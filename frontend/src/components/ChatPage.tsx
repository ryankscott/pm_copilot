import { useState } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Textarea } from "./ui/textarea";
import {
  Bot,
  Send,
  X,
  FileText,
  MessageSquare,
  Wand2,
  Loader2,
  Paperclip,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { usePrds } from "@/hooks/use-prd-queries";
import { useTemplates } from "@/hooks/use-template-queries";
import { useLLMStore } from "@/store/llm-store";
import { prdApi } from "@/lib/api";
import { MetadataFooter } from "./MetadataFooter";
import AIAvatar from "./ui/AIAvatar";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import type {
  ConversationMessage,
  PRD,
  PRDContent,
  GenerateContentRequest,
  CritiqueRequest,
  QuestionRequest,
  Template,
} from "@/types";

type ChatMode = "create" | "critique" | "question";

interface PRDContext {
  prd: PRD;
  addedAt: Date;
}

export function ChatPage() {
  const { data: prds } = usePrds();
  const { data: templates } = useTemplates();
  const { getCurrentProvider, settings } = useLLMStore();

  // Chat state
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [chatMode, setChatMode] = useState<ChatMode>("create");
  const [prdContexts, setPrdContexts] = useState<PRDContext[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");

  // Mode descriptions
  const modeDescriptions = {
    create:
      "I'll help you create a new PRD interactively by asking questions and building it step by step.",
    critique:
      "I'll analyze and provide detailed feedback on your PRD with suggestions for improvement.",
    question:
      "I'll answer questions about your PRD and help you understand or improve specific aspects.",
  };

  // Handle mode change
  const handleModeChange = (value: ChatMode) => {
    setChatMode(value);
    // Clear template selection when switching away from create mode
    if (value !== "create") {
      setSelectedTemplateId("");
    }
  };

  // Add PRD to context
  const addPrdContext = (prdId: string) => {
    const prd = prds?.find((p: PRD) => p.id === prdId);
    if (prd && !prdContexts.find((ctx: PRDContext) => ctx.prd.id === prdId)) {
      setPrdContexts((prev) => [...prev, { prd, addedAt: new Date() }]);
    }
  };

  // Remove PRD from context
  const removePrdContext = (prdId: string) => {
    setPrdContexts((prev) =>
      prev.filter((ctx: PRDContext) => ctx.prd.id !== prdId)
    );
  };

  // Create user message
  const createUserMessage = (content: string): ConversationMessage => ({
    role: "user",
    content,
    timestamp: new Date().toISOString(),
  });

  // Create assistant message
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

  // Calculate cost
  const calculateCost = (
    inputTokens: number,
    outputTokens: number,
    modelId: string,
    provider: {
      models?: Array<{
        id: string;
        costPer1MTokens?: { input: number; output: number };
      }>;
    }
  ): number => {
    if (!modelId || !provider?.models) return 0;
    const model = provider.models.find((m) => m.id === modelId);
    if (!model?.costPer1MTokens) return 0;

    const inputCost = (inputTokens / 1000000) * model.costPer1MTokens.input;
    const outputCost = (outputTokens / 1000000) * model.costPer1MTokens.output;
    return inputCost + outputCost;
  };

  // Handle sending message
  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = createUserMessage(input);
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    try {
      let result;
      const provider = getCurrentProvider();

      if (chatMode === "create") {
        // Use the existing interactive PRD creation API
        const templateId = selectedTemplateId || undefined;

        if (!templateId) {
          throw new Error(
            "No template selected. Please select a template before generating content."
          );
        }

        const request: GenerateContentRequest = {
          prompt: userMessage.content as string,
          tone: "professional",
          length: "standard",
          existing_content:
            prdContexts.length > 0 ? prdContexts[0].prd.content : "",
          conversation_history: messages,
          provider,
          model: settings.selectedModel,
          template_id: templateId,
        };

        // For create mode, we need a PRD context or create a temporary one
        const contextPrd =
          prdContexts.length > 0
            ? prdContexts[0].prd
            : {
                id: "temp-chat",
                title: "Chat Session",
                content: "",
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              };

        result = await prdApi.generateContent(contextPrd.id, request);
      } else if (chatMode === "critique") {
        // Use the critique API
        if (prdContexts.length === 0) {
          throw new Error("Please add a PRD to analyze for critique mode");
        }

        const request: CritiqueRequest = {
          existing_content: prdContexts[0].prd.content,
          focus_areas: ["completeness", "clarity", "structure"],
          depth: "detailed",
          include_suggestions: true,
          custom_criteria: userMessage.content as string,
          provider,
          model: settings.selectedModel,
        };

        result = await prdApi.critique(prdContexts[0].prd.id, request);
      } else {
        // Question mode - use the new question endpoint
        if (prdContexts.length === 0) {
          throw new Error("Please add a PRD to ask questions about");
        }

        const request: QuestionRequest = {
          question: userMessage.content as string,
          context:
            prdContexts.length > 1
              ? `Multiple PRDs: ${prdContexts.map((ctx: PRDContext) => ctx.prd.title).join(", ")}`
              : undefined,
          conversation_history: messages,
          provider,
          model: settings.selectedModel,
        };

        result = await prdApi.question(prdContexts[0].prd.id, request);
      }

      const cost = calculateCost(
        result.input_tokens || 0,
        result.output_tokens || 0,
        settings.selectedModel || "",
        provider
      );

      let responseContent: string;
      if (chatMode === "critique") {
        responseContent =
          (result as { summary?: string }).summary || "No critique available";
      } else if (chatMode === "question") {
        // Handle question response
        const questionResult = result as { answer?: string };
        responseContent = questionResult.answer || "No answer provided";
      } else {
        // Handle create mode response
        const generatedContent = (
          result as { generated_content?: string | PRDContent }
        ).generated_content;
        if (typeof generatedContent === "string") {
          responseContent = generatedContent;
        } else if (generatedContent && typeof generatedContent === "object") {
          // Handle PRDContent object
          const prdContent = generatedContent as PRDContent;
          responseContent =
            `# ${prdContent.title}\n\n**Summary:** ${prdContent.summary}\n\n` +
            prdContent.sections
              .map((s) => `## ${s.title}\n\n${s.content}`)
              .join("\n\n");
        } else {
          responseContent = "No content generated";
        }
      }

      const assistantMessage = createAssistantMessage(
        responseContent,
        result.input_tokens,
        result.output_tokens,
        result.generation_time,
        cost,
        settings.selectedModel,
        result.langfuseData
      );

      setMessages([...newMessages, assistantMessage]);
    } catch (error) {
      console.error("Error sending message:", error);
      const errorMessage: ConversationMessage = {
        role: "assistant",
        content: `I'm sorry, there was an error processing your request: ${error instanceof Error ? error.message : "Unknown error"}`,
        timestamp: new Date().toISOString(),
        has_error: true,
      };
      setMessages([...newMessages, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Clear chat
  const clearChat = () => {
    setMessages([]);
  };

  // Render message
  const renderMessage = (message: ConversationMessage) => {
    const contentAsString =
      typeof message.content === "string"
        ? message.content
        : typeof message.content === "object" && message.content
          ? `# ${message.content.title}\n\n**Summary:** ${message.content.summary}\n\n` +
            message.content.sections
              .map((s) => `## ${s.title}\n\n${s.content}`)
              .join("\n\n")
          : "";

    return (
      <div
        key={message.timestamp}
        className={`flex gap-4 ${message.role === "user" ? "justify-end" : "justify-start"}`}
      >
        {message.role === "assistant" && (
          <div className="flex-shrink-0">
            <AIAvatar
              provider={getCurrentProvider().name}
              model={settings.selectedModel}
              orientation="vertical"
            />
          </div>
        )}

        <div
          className={`max-w-[65%] rounded-lg p-4 ${
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
          </div>

          {message.role === "assistant" && (
            <MetadataFooter
              inputTokens={message.input_tokens}
              outputTokens={message.output_tokens}
              generationTime={message.total_time}
              cost={message.cost}
              showFeedback={true}
              provider={getCurrentProvider().name}
              model={settings.selectedModel}
              langfuseData={message.langfuseData}
              className="mt-3 pt-3 border-t"
            />
          )}
        </div>

        {message.role === "user" && (
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-medium">
            U
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <Bot className="w-6 h-6 text-primary" />
            <h1 className="text-xl font-semibold">AI Assistant</h1>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={clearChat}
              disabled={messages.length === 0}
            >
              Clear Chat
            </Button>
          </div>
        </div>

        {/* Mode Selection */}
        <div className="px-4 pb-4">
          <div className="flex flex-col items-start gap-2">
            <div className="flex items-center gap-4">
              <Select value={chatMode} onValueChange={handleModeChange}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="create">
                    <div className="flex items-center gap-2">
                      <Wand2 className="w-4 h-4" />
                      Create PRD
                    </div>
                  </SelectItem>
                  <SelectItem value="critique">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-4 h-4" />
                      Critique PRD
                    </div>
                  </SelectItem>
                  <SelectItem value="question">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      Ask Questions
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>

              {/* Template Selection - Only show in create mode */}
              {chatMode === "create" && (
                <Select
                  value={selectedTemplateId}
                  onValueChange={setSelectedTemplateId}
                >
                  <SelectTrigger className="w-64">
                    <SelectValue placeholder="Select a template..." />
                  </SelectTrigger>
                  <SelectContent>
                    {templates?.map((template: Template) => (
                      <SelectItem key={template.id} value={template.id}>
                        <div className="flex flex-col items-start">
                          <span className="font-medium">{template.title}</span>
                          <span className="text-xs text-muted-foreground">
                            {template.category}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <p className="text-sm text-muted-foreground">
                {modeDescriptions[chatMode]}
              </p>
              {chatMode === "create" && !selectedTemplateId && (
                <p className="text-red-500 text-sm">
                  Select a template to get started.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* PRD Context */}
        {prdContexts.length > 0 && (
          <div className="px-4 pb-2">
            <div className="flex flex-col gap-1">
              <span className="text-sm font-medium">Context:</span>
              <div className="flex flex-wrap gap-2">
                {prdContexts.map((ctx: PRDContext) => (
                  <Badge
                    key={ctx.prd.id}
                    className="flex rounded-none items-center gap-1 p-0 m-0 pl-2"
                  >
                    <FileText className="w-3 h-3" />
                    {ctx.prd.title}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removePrdContext(ctx.prd.id)}
                      className="p-0 m-0 "
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bot className="w-5 h-5" />
                  Ready to help!
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  {modeDescriptions[chatMode]}
                </p>
                {chatMode === "create" && !selectedTemplateId && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Select a template above to get started.
                  </p>
                )}
                {(chatMode === "critique" || chatMode === "question") && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Add a PRD as context to get started.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        ) : (
          messages.map(renderMessage)
        )}

        {isLoading && (
          <div className="flex gap-4 justify-start">
            <div className="flex-shrink-0">
              <AIAvatar
                provider={getCurrentProvider().name}
                model={settings.selectedModel}
                orientation="vertical"
              />
            </div>
            <div className="bg-muted rounded-lg p-4">
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Thinking...</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="flex flex-col w-full border-t px-4 pt-4">
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder="Type your message... (Enter to send, Shift+Enter for new line)"
          className="min-h-[60px] resize-none"
          disabled={isLoading}
        />

        <div
          className={`flex flex-row gap-2 ${
            chatMode !== "create" ? "justify-between" : "justify-end"
          } py-2 pt-4 relative`}
        >
          {chatMode !== "create" && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="mb-2">
                  <Paperclip className="w-4 h-4 mr-2" />
                  Add PRD
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {prds?.map((prd: PRD) => (
                  <DropdownMenuItem
                    key={prd.id}
                    onClick={() => addPrdContext(prd.id)}
                    disabled={prdContexts.some(
                      (ctx: PRDContext) => ctx.prd.id === prd.id
                    )}
                    className="flex items-center gap-2"
                  >
                    <FileText className="w-4 h-4" />
                    {prd.title}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          <Button
            onClick={handleSendMessage}
            disabled={
              !input.trim() ||
              isLoading ||
              (chatMode === "create" && !selectedTemplateId)
            }
            size="sm"
            className="mb-2"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
