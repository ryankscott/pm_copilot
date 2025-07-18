import { useState, useEffect, useCallback, useMemo } from "react";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Bot, Loader2, Send, Plus, RotateCcw } from "lucide-react";
import type {
  PRD,
  GenerateContentRequest,
  ConversationMessage,
  LLMProviderConfig,
  LLMModel,
  PRDContent,
} from "@/types";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import { prdApi, sessionApi } from "@/lib/api";
import { Textarea } from "./ui/textarea";
import { useLLMStore } from "@/store/llm-store";
import { MetadataFooter } from "./MetadataFooter";

// Utility functions moved outside component
const generateRequestId = () => Math.random().toString(36).substr(2, 9);

const calculateCost = (
  inputTokens: number,
  outputTokens: number,
  modelId: string,
  provider: LLMProviderConfig
): number => {
  if (!modelId || !provider || !provider.models) return 0;

  const model = provider.models.find((m: LLMModel) => m.id === modelId);
  if (!model || !model.costPer1MTokens) return 0;

  const inputCost = (inputTokens / 1000000) * model.costPer1MTokens.input;
  const outputCost = (outputTokens / 1000000) * model.costPer1MTokens.output;

  return inputCost + outputCost;
};

const createUserMessage = (content: string): ConversationMessage => ({
  role: "user",
  content,
  timestamp: new Date().toISOString(),
});

const createAssistantMessage = (
  content: string | PRDContent,
  inputTokens?: number,
  outputTokens?: number,
  generationTime?: number,
  cost?: number,
  modelUsed?: string,
  langfuseData?: { traceId: string; generationId: string }
): ConversationMessage => ({
  role: "assistant",
  content,
  timestamp: new Date().toISOString(),
  ...(inputTokens && { input_tokens: inputTokens }),
  ...(outputTokens && { output_tokens: outputTokens }),
  ...(generationTime && { total_time: generationTime }),
  ...(cost && { cost }),
  ...(modelUsed && { model_used: modelUsed }),
  ...(langfuseData && { langfuseData }),
});

const createErrorMessage = (isStart: boolean): ConversationMessage => ({
  role: "assistant",
  content: isStart
    ? "Sorry, I encountered an error starting our PRD creation session. Please try again."
    : "Sorry, I encountered an error. Please try again.",
  timestamp: new Date().toISOString(),
  ...(isStart ? {} : { has_error: true }),
});

// Custom hook for session management
const useSessionManagement = (
  prdId: string,
  setInteractiveMessages: (messages: ConversationMessage[]) => void
) => {
  useEffect(() => {
    setInteractiveMessages([]);

    // Load existing session for this PRD
    const loadSession = async () => {
      try {
        const session = await sessionApi.get(prdId);
        if (
          session &&
          session.conversation_history &&
          session.conversation_history.length > 0
        ) {
          setInteractiveMessages(session.conversation_history);
        }
      } catch {
        console.log("No existing session found for this PRD");
      }
    };

    loadSession();
  }, [prdId, setInteractiveMessages]);

  const saveSession = useCallback(
    async (messages: ConversationMessage[]) => {
      if (messages.length > 0) {
        try {
          await sessionApi.save(prdId, {
            conversation_history: messages,
            settings: {},
          });
        } catch (error) {
          console.error("Error saving session:", error);
        }
      }
    },
    [prdId]
  );

  // Create debounced version of saveSession
  const debouncedSaveSession = useMemo(() => {
    let timeoutId: NodeJS.Timeout;

    const debouncedFn = (messages: ConversationMessage[]) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        saveSession(messages);
      }, 1000); // Debounce for 1 second
    };

    // Add cancel method to the function
    Object.assign(debouncedFn, {
      cancel: () => {
        clearTimeout(timeoutId);
      },
    });

    return debouncedFn as typeof debouncedFn & { cancel: () => void };
  }, [saveSession]);

  // Cleanup effect to cancel debounced function on unmount
  useEffect(() => {
    return () => {
      if (debouncedSaveSession.cancel) {
        debouncedSaveSession.cancel();
      }
    };
  }, [debouncedSaveSession]);

  return { debouncedSaveSession };
};

interface InteractivePRDPanelProps {
  prd: PRD;
  onApplyContent: (content: PRDContent) => void;
}

export function InteractivePRDPanel({
  prd,
  onApplyContent,
}: InteractivePRDPanelProps) {
  const { getCurrentProvider, settings } = useLLMStore();

  // Interactive PRD Creation state
  const [interactiveMessages, setInteractiveMessages] = useState<
    ConversationMessage[]
  >([]);
  const [interactiveInput, setInteractiveInput] = useState("");
  const [isInteractiveLoading, setIsInteractiveLoading] = useState(false);
  const [interactiveSettings, setInteractiveSettings] = useState<{
    tone: "professional" | "casual" | "technical" | "executive";
    length: "brief" | "standard" | "detailed" | "comprehensive";
  }>({
    tone: "professional",
    length: "standard",
  });

  // Session management logic
  const { debouncedSaveSession } = useSessionManagement(
    prd.id,
    setInteractiveMessages
  );

  // Save session whenever messages change
  useEffect(() => {
    if (interactiveMessages.length > 0) {
      debouncedSaveSession(interactiveMessages);
    }
  }, [interactiveMessages, debouncedSaveSession]);

  const handleInteractiveSession = async (isStart: boolean = false) => {
    if (!interactiveInput.trim() || isInteractiveLoading) return;

    const requestId = generateRequestId();
    const actionType = isStart ? "initial" : "continue";
    console.log(`=== Starting ${actionType} request ${requestId} ===`);

    const userMessage = createUserMessage(interactiveInput);

    // Determine the new messages array based on whether we're starting or continuing
    const newMessages = isStart
      ? [userMessage]
      : [...interactiveMessages, userMessage];
    setInteractiveMessages(newMessages);
    setInteractiveInput("");
    setIsInteractiveLoading(true);

    try {
      const request: GenerateContentRequest = {
        prompt: userMessage.content as string,
        tone: interactiveSettings.tone,
        length: interactiveSettings.length,
        existing_content: prd.content,
        conversation_history: isStart ? [] : interactiveMessages,
        provider: getCurrentProvider(),
        model: settings.selectedModel,
      };

      const result = await prdApi.generateContent(prd.id, request);

      console.log(`=== AI Response Received for ${requestId} ===`);
      console.log("Result:", result);
      console.log("Generated content:", result.generated_content);
      console.log(
        "Content length:",
        result.generated_content
          ? JSON.stringify(result.generated_content).length
          : 0
      );

      if (!result.generated_content) {
        console.error(
          `Empty response received from AI for request ${requestId}`
        );
        throw new Error("Empty response received from AI");
      }

      const cost = calculateCost(
        result.input_tokens || 0,
        result.output_tokens || 0,
        settings.selectedModel || "",
        getCurrentProvider()
      );

      const assistantMessage = createAssistantMessage(
        result.generated_content,
        result.input_tokens,
        result.output_tokens,
        result.generation_time,
        cost,
        settings.selectedModel,
        result.langfuseData
      );

      setInteractiveMessages([...newMessages, assistantMessage]);
      console.log(
        `=== Successfully completed ${actionType} request ${requestId} ===`
      );
    } catch (error) {
      console.error(
        `Error in ${actionType} interactive session for request ${requestId}:`,
        error
      );
      const errorMessage = createErrorMessage(isStart);
      setInteractiveMessages([...newMessages, errorMessage]);
    } finally {
      setIsInteractiveLoading(false);
    }
  };

  // Convenience wrapper functions for the two use cases
  const handleStartInteractiveSession = () => handleInteractiveSession(true);
  const handleContinueInteractiveSession = () =>
    handleInteractiveSession(false);

  const handleApplyInteractiveContent = (content: PRDContent) => {
    onApplyContent(content);
  };

  const handleRetry = () => {
    if (interactiveMessages.length === 0) {
      // No messages to retry, shouldn't happen but handle gracefully
      return;
    }

    const lastMessage = interactiveMessages[interactiveMessages.length - 1];

    // If the last message is an error or failed assistant message, we need to:
    // 1. Find the last user message
    // 2. Remove the failed assistant message and the user message that caused it
    // 3. Retry with the user message content

    if (lastMessage.role === "assistant" && lastMessage.has_error) {
      // Remove the failed assistant message
      const messagesWithoutError = interactiveMessages.slice(0, -1);

      // Find the last user message to retry
      const lastUserMessage = messagesWithoutError
        .slice()
        .reverse()
        .find((msg) => msg.role === "user");

      if (lastUserMessage) {
        // Remove the user message that caused the error as well, since we'll re-add it
        const messagesWithoutLastUser = messagesWithoutError.filter(
          (msg) => msg !== lastUserMessage
        );

        setInteractiveMessages(messagesWithoutLastUser);
        setInteractiveInput(lastUserMessage.content as string);

        // Directly retry with the content - no need for setTimeout
        // The handleInteractiveSession will add the user message again
        if (messagesWithoutLastUser.length === 0) {
          // This will be a fresh start
          handleInteractiveSession(true);
        } else {
          // This will continue the conversation
          handleInteractiveSession(false);
        }
      }
    }
  };

  // Helper functions for form handling
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (interactiveMessages.length === 0) {
      handleStartInteractiveSession();
    } else {
      handleContinueInteractiveSession();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (
      e.key === "Enter" &&
      !e.shiftKey &&
      !isInteractiveLoading &&
      interactiveInput.trim()
    ) {
      e.preventDefault();
      if (interactiveMessages.length === 0) {
        handleStartInteractiveSession();
      } else {
        handleContinueInteractiveSession();
      }
    }
  };

  const handleNewChat = () => {
    setInteractiveMessages([]);
    setInteractiveInput("");
  };

  const getPlaceholder = () => {
    return interactiveMessages.length === 0
      ? "Describe the product or feature you want to create a PRD for... (Enter to send, Shift+Enter for new line)"
      : "Continue the conversation... (Enter to send, Shift+Enter for new line)";
  };

  // Render a single message using the MessageComponent
  const renderMessage = (
    message: ConversationMessage,
    showApplyButton = false
  ) => (
    <MessageComponent
      key={message.timestamp}
      message={message}
      showApplyButton={showApplyButton}
      onApplyContent={handleApplyInteractiveContent}
      onRetry={handleRetry}
      getCurrentProvider={getCurrentProvider}
      selectedModel={settings.selectedModel}
      isLoading={isInteractiveLoading}
      isLastMessage={
        message === interactiveMessages[interactiveMessages.length - 1]
      }
    />
  );

  return (
    <div className="h-full flex flex-col">
      {/* Settings and New Chat Button */}
      <SettingsPanel
        interactiveSettings={interactiveSettings}
        setInteractiveSettings={setInteractiveSettings}
        hasMessages={interactiveMessages.length > 0}
        onNewChat={handleNewChat}
      />

      {/* Conversation */}
      <div className="flex-1 p-4 space-y-4 overflow-y-auto">
        {interactiveMessages.length === 0 ? (
          <EmptyState />
        ) : (
          interactiveMessages.map((message) => renderMessage(message, true))
        )}
        {isInteractiveLoading && (
          <div className="flex justify-start">
            <div className="bg-muted rounded-lg p-3 border">
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Thinking...</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <InputForm
        value={interactiveInput}
        onChange={setInteractiveInput}
        onSubmit={handleFormSubmit}
        onKeyDown={handleKeyDown}
        placeholder={getPlaceholder()}
        disabled={isInteractiveLoading}
      />
    </div>
  );
}

// Empty State Component
function EmptyState() {
  return (
    <div className="flex justify-center items-center h-full">
      <div className="text-center text-muted-foreground max-w-md">
        <Bot className="w-12 h-12 mx-auto mb-4 text-primary" />
        <h3 className="text-lg font-medium mb-2 text-foreground">
          Interactive PRD Creation
        </h3>
        <p className="text-sm">
          Start a conversation to create and refine your Product Requirements
          Document
        </p>
      </div>
    </div>
  );
}

// Input Form Component
interface InputFormProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  placeholder: string;
  disabled: boolean;
}

function InputForm({
  value,
  onChange,
  onSubmit,
  onKeyDown,
  placeholder,
  disabled,
}: InputFormProps) {
  return (
    <div className="p-4 border-t border-border">
      <form onSubmit={onSubmit} className="flex gap-2">
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className="flex-1"
        />
        <Button
          type="submit"
          disabled={disabled || !value.trim()}
          size="icon"
          className="self-end"
        >
          {disabled ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </Button>
      </form>
    </div>
  );
}

// Settings Panel Component
interface SettingsPanelProps {
  interactiveSettings: {
    tone: "professional" | "casual" | "technical" | "executive";
    length: "brief" | "standard" | "detailed" | "comprehensive";
  };
  setInteractiveSettings: React.Dispatch<
    React.SetStateAction<{
      tone: "professional" | "casual" | "technical" | "executive";
      length: "brief" | "standard" | "detailed" | "comprehensive";
    }>
  >;
  hasMessages: boolean;
  onNewChat: () => void;
}

function SettingsPanel({
  interactiveSettings,
  setInteractiveSettings,
  hasMessages,
  onNewChat,
}: SettingsPanelProps) {
  return (
    <div className="p-4 border-b border-border space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex flex-row gap-6">
          {!hasMessages ? (
            <>
              <div className="">
                <Label className="text-sm font-medium">Tone</Label>
                <Select
                  value={interactiveSettings.tone}
                  onValueChange={(
                    value: "professional" | "casual" | "technical" | "executive"
                  ) =>
                    setInteractiveSettings((prev) => ({
                      ...prev,
                      tone: value,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="professional">Professional</SelectItem>
                    <SelectItem value="casual">Casual</SelectItem>
                    <SelectItem value="technical">Technical</SelectItem>
                    <SelectItem value="executive">Executive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="">
                <Label className="text-sm font-medium">Detail Level</Label>
                <Select
                  value={interactiveSettings.length}
                  onValueChange={(
                    value: "brief" | "standard" | "detailed" | "comprehensive"
                  ) =>
                    setInteractiveSettings((prev) => ({
                      ...prev,
                      length: value,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="brief">Brief</SelectItem>
                    <SelectItem value="standard">Standard</SelectItem>
                    <SelectItem value="detailed">Detailed</SelectItem>
                    <SelectItem value="comprehensive">Comprehensive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          ) : null}
        </div>
        {hasMessages && (
          <Button
            variant="outline"
            size="sm"
            onClick={onNewChat}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            New Chat
          </Button>
        )}
      </div>
    </div>
  );
}

// Message Component for rendering individual messages
interface MessageProps {
  message: ConversationMessage;
  showApplyButton?: boolean;
  onApplyContent: (content: PRDContent) => void;
  onRetry: () => void;
  getCurrentProvider: () => LLMProviderConfig;
  selectedModel?: string;
  isLoading: boolean;
  isLastMessage: boolean;
}

function MessageComponent({
  message,
  showApplyButton = false,
  onApplyContent,
  onRetry,
  getCurrentProvider,
  selectedModel,
  isLoading,
  isLastMessage,
}: MessageProps) {
  const cost =
    message.role === "assistant" &&
    message.input_tokens &&
    message.output_tokens &&
    selectedModel
      ? calculateCost(
          message.input_tokens,
          message.output_tokens,
          selectedModel,
          getCurrentProvider()
        )
      : 0;

  const contentAsPRD =
    typeof message.content === "object"
      ? (message.content as PRDContent)
      : null;
  const contentAsString =
    typeof message.content === "string"
      ? message.content
      : contentAsPRD
        ? `# ${contentAsPRD.title}\n\n**Summary:** ${contentAsPRD.summary}\n\n` +
          contentAsPRD.sections
            .map((s) => `## ${s.title}\n\n${s.content}`)
            .join("\n\n")
        : "";

  return (
    <div
      key={message.timestamp}
      className={`flex items-start gap-3 ${
        message.role === "user" ? "justify-end" : "justify-start"
      }`}
    >
      <div
        className={`max-w-[85%] rounded-lg p-4 ${
          message.role === "user"
            ? "bg-primary text-primary-foreground"
            : "bg-muted border"
        }`}
      >
        <div
          className={`prose prose-sm max-w-none ${
            message.role === "user"
              ? "prose-invert [&>*]:text-primary-foreground"
              : "dark:prose-invert"
          }`}
        >
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeHighlight]}
          >
            {contentAsString}
          </ReactMarkdown>
          {message.has_error && (
            <div className="w-full flex justify-end">
              <Button size="sm" onClick={onRetry}>
                <RotateCcw className="inline mr-1 w-4 h-4" />
                Retry
              </Button>
            </div>
          )}
        </div>

        {/* Token usage footer for assistant messages */}
        {message.role === "assistant" && (
          <MetadataFooter
            inputTokens={message.input_tokens}
            outputTokens={message.output_tokens}
            generationTime={message.total_time}
            cost={cost > 0 ? cost : undefined}
            showFeedback={true}
            provider={getCurrentProvider().name}
            model={selectedModel}
            langfuseData={message.langfuseData}
          />
        )}

        {/* Apply button */}
        {showApplyButton &&
          message.role === "assistant" &&
          !isLoading &&
          isLastMessage &&
          contentAsPRD && (
            <div className="mt-3 pt-3 border-t border-border flex gap-2">
              <Button size="sm" onClick={() => onApplyContent(contentAsPRD)}>
                Apply to PRD
              </Button>
            </div>
          )}
      </div>
    </div>
  );
}
