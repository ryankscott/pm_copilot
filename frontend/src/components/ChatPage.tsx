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
  Plus,
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
import { usePrds, useCreatePrd } from "@/hooks/use-prd-queries";
import { useTemplates } from "@/hooks/use-template-queries";
import { useLLMStore } from "@/store/llm-store";
import { prdApi } from "@/lib/api";
import { MetadataFooter } from "./MetadataFooter";
import AIAvatar from "./ui/AIAvatar";
import { useRouter } from "@tanstack/react-router";
import { useToast } from "@/hooks/use-toast";
import { markdownToHtml } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import type {
  ConversationMessage,
  PRD,
  PRDContent,
  GenerateContentRequest,
  GenerateContentResponse,
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
  const router = useRouter();
  const { success, error: errorToast } = useToast();
  const createPrd = useCreatePrd();

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
    langfuseData?: { traceId: string; generationId: string },
    isComplete?: boolean
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
    ...(isComplete && { is_complete: isComplete }),
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
          // For PRDContent object, store the object directly in the message
          // The renderMessage function will handle the display conversion
          const assistantMessage = createAssistantMessage(
            generatedContent, // Store as PRDContent object
            result.input_tokens,
            result.output_tokens,
            result.generation_time,
            cost,
            settings.selectedModel,
            result.langfuseData,
            (result as GenerateContentResponse).is_complete
          );

          setMessages([...newMessages, assistantMessage]);
          return; // Exit early since we've created the message
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
        result.langfuseData,
        chatMode === "create"
          ? (result as GenerateContentResponse).is_complete
          : false
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

  // Create PRD from last AI message
  const handleCreatePrdFromMessage = async (message: ConversationMessage) => {
    if (message.role !== "assistant" || !message.content) return;

    try {
      let title = "AI Generated PRD";
      let content = "";

      if (typeof message.content === "string") {
        // Convert markdown to HTML if it's a string
        content = markdownToHtml(message.content);

        // Try to extract title from content if it starts with a heading
        const titleMatch = message.content.match(/^#\s+(.+?)$/m);
        if (titleMatch) {
          title = titleMatch[1];
        }
      } else if (typeof message.content === "object") {
        // Handle PRDContent object - convert to rich HTML
        const prdContent = message.content as PRDContent;
        title = prdContent.title || title;

        // Create rich HTML content
        const htmlParts: string[] = [];

        // Add title
        if (prdContent.title) {
          htmlParts.push(`<h1>${prdContent.title}</h1>`);
        }

        // Add summary
        if (prdContent.summary) {
          htmlParts.push(
            `<p><strong>Summary:</strong> ${prdContent.summary}</p>`
          );
        }

        // Add sections
        if (prdContent.sections && prdContent.sections.length > 0) {
          prdContent.sections.forEach((section) => {
            htmlParts.push(`<h2>${section.title}</h2>`);

            // Convert section content from markdown to HTML
            const sectionHtml = markdownToHtml(section.content);

            htmlParts.push(sectionHtml);
          });
        }

        content = htmlParts.join("\n\n");
      }

      const newPrd = await createPrd.mutateAsync({
        title,
        content,
        templateId: selectedTemplateId || undefined,
      });

      // Navigate to the new PRD
      await router.navigate({
        to: "/prd/$prdId",
        params: { prdId: newPrd.id! },
      });

      success("PRD Created", "Successfully created PRD from AI response");
    } catch (error) {
      console.error("Failed to create PRD:", error);
      errorToast(
        "Failed to create PRD",
        (error as Error)?.message || "Please try again later."
      );
    }
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
            <>
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

              {/* Create PRD Button - only show when the generatePRD tool was used */}
              {chatMode === "create" &&
                message.is_complete &&
                message.content &&
                !isLoading && (
                  <div className="mt-3 pt-3 border-t border-border flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleCreatePrdFromMessage(message)}
                      disabled={createPrd.isPending}
                      className="flex items-center gap-2"
                    >
                      {createPrd.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Creating PRD...
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4" />
                          Create PRD
                        </>
                      )}
                    </Button>
                  </div>
                )}
            </>
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
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="flex flex-col gap-2">
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
