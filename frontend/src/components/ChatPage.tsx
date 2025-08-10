import { useState, useMemo } from "react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import {
  Bot,
  X,
  FileText,
  MessageSquare,
  Wand2,
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
import { useMessageMetadataStore } from "@/store/message-metadata-store";
import { prdApi } from "@/lib/api";
import { calculateCost } from "@/lib/cost";

// Assistant UI imports
import {
  AssistantRuntimeProvider,
  useLocalRuntime,
  type ChatModelAdapter,
} from "@assistant-ui/react";
import { Thread } from "@/components/assistant-ui/thread";

import type {
  ConversationMessage,
  PRD,
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
  const [chatMode, setChatMode] = useState<ChatMode>("create");
  const [prdContexts, setPrdContexts] = useState<PRDContext[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");

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

  // Create the chat model adapter that handles API calls
  const chatModelAdapter: ChatModelAdapter = useMemo(
    () => ({
      async run({ messages, abortSignal }) {
        const lastMessage = messages[messages.length - 1];
        if (lastMessage?.role !== "user") {
          throw new Error("Last message must be from user");
        }

        const userContent = Array.isArray(lastMessage.content)
          ? lastMessage.content
              .filter((part) => part.type === "text")
              .map((part) => ("text" in part ? part.text : ""))
              .join("")
          : lastMessage.content || "";

        // Convert assistant-ui messages to our conversation format
        const conversationHistory: ConversationMessage[] = messages
          .slice(0, -1)
          .filter((msg) => msg.role === "user" || msg.role === "assistant")
          .map((msg) => ({
            role: msg.role as "user" | "assistant",
            content: Array.isArray(msg.content)
              ? msg.content
                  .filter((part) => part.type === "text")
                  .map((part) => ("text" in part ? part.text : ""))
                  .join("")
              : msg.content || "",
            timestamp: new Date().toISOString(),
          })) as ConversationMessage[];

        const provider = getCurrentProvider();

        let result: unknown;
        try {
          switch (chatMode) {
            case "create": {
              if (!selectedTemplateId) {
                throw new Error("Template must be selected for create mode");
              }

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

              const createRequest: GenerateContentRequest = {
                prompt: userContent as string,
                tone: "professional",
                length: "standard",
                existing_content: contextPrd.content,
                conversation_history: conversationHistory,
                provider,
                model: settings.selectedModel,
                template_id: selectedTemplateId,
              };

              result = await prdApi.generateContent(
                contextPrd.id,
                createRequest
              );
              break;
            }

            case "critique": {
              if (prdContexts.length === 0) {
                throw new Error("PRD context required for critique mode");
              }

              const critiqueRequest: CritiqueRequest = {
                existing_content: prdContexts[0].prd.content,
                focus_areas: ["completeness", "clarity", "structure"],
                depth: "detailed",
                include_suggestions: true,
                custom_criteria: userContent as string,
                provider,
                model: settings.selectedModel,
              };

              result = await prdApi.critique(
                prdContexts[0].prd.id,
                critiqueRequest
              );
              break;
            }

            case "question": {
              if (prdContexts.length === 0) {
                throw new Error("PRD context required for question mode");
              }

              const questionRequest: QuestionRequest = {
                question: userContent as string,
                context:
                  prdContexts.length > 1
                    ? `Multiple PRDs: ${prdContexts.map((ctx: PRDContext) => ctx.prd.title).join(", ")}`
                    : undefined,
                conversation_history: conversationHistory,
                provider,
                model: settings.selectedModel,
              };

              result = await prdApi.question(
                prdContexts[0].prd.id,
                questionRequest
              );
              break;
            }

            default:
              throw new Error(`Unknown mode: ${chatMode}`);
          }

          // Check if aborted
          if (abortSignal?.aborted) {
            throw new Error("Request was cancelled");
          }

          // Process the response based on mode
          let responseContent: string;
          if (chatMode === "critique") {
            responseContent =
              (result as { summary?: string }).summary ||
              "No critique available";
          } else if (chatMode === "question") {
            responseContent =
              (result as { answer?: string }).answer || "No answer provided";
          } else {
            // Create mode
            const generatedContent = (
              result as { generated_content?: string | object }
            ).generated_content;
            if (typeof generatedContent === "string") {
              responseContent = generatedContent;
            } else if (
              generatedContent &&
              typeof generatedContent === "object"
            ) {
              // Convert PRDContent object to markdown
              const prdContent = generatedContent as {
                title?: string;
                summary?: string;
                sections?: Array<{ title: string; content: string }>;
              };
              responseContent = `# ${prdContent.title || "Generated PRD"}\n\n`;
              if (prdContent.summary) {
                responseContent += `**Summary:** ${prdContent.summary}\n\n`;
              }
              if (prdContent.sections?.length) {
                responseContent += prdContent.sections
                  .map((section) => `## ${section.title}\n\n${section.content}`)
                  .join("\n\n");
              }
            } else {
              responseContent = "No content generated";
            }
          }

          // Store pending metadata for matching later
          const setMessageMetadata = useMessageMetadataStore.getState();

          // Calculate cost (reuse logic from InteractivePRDPanel)
          // Cost utility imported statically

          if (
            result &&
            typeof result === "object" &&
            "input_tokens" in result
          ) {
            const apiResponse = result as {
              input_tokens?: number;
              output_tokens?: number;
              generation_time?: number;
              langfuse_data?: unknown;
            };
            const cost = calculateCost(
              apiResponse.input_tokens || 0,
              apiResponse.output_tokens || 0,
              settings.selectedModel,
              provider
            );

            interface LangfuseLike {
              traceId: unknown;
              generationId: unknown;
            }
            const langfuseData = (():
              | { traceId: string; generationId: string }
              | undefined => {
              const data = apiResponse.langfuse_data as unknown;
              if (data && typeof data === "object") {
                const lf = data as LangfuseLike;
                if (
                  typeof lf.traceId === "string" &&
                  typeof lf.generationId === "string"
                ) {
                  return { traceId: lf.traceId, generationId: lf.generationId };
                }
              }
              return undefined;
            })();

            setMessageMetadata.addPendingMetadata({
              inputTokens: apiResponse.input_tokens,
              outputTokens: apiResponse.output_tokens,
              generationTime: apiResponse.generation_time,
              cost,
              provider: provider.name,
              model: settings.selectedModel || "unknown",
              langfuseData,
              timestamp: new Date(),
              responseContent: responseContent.substring(0, 100), // Store first 100 chars for matching
            });
          }

          return {
            content: [{ type: "text", text: responseContent }],
          };
        } catch (error) {
          if (abortSignal?.aborted) {
            throw error; // Let assistant-ui handle cancellation
          }

          const errorMessage = `I'm sorry, there was an error processing your request: ${
            error instanceof Error ? error.message : "Unknown error"
          }`;

          return {
            content: [{ type: "text", text: errorMessage }],
          };
        }
      },
    }),
    [
      chatMode,
      selectedTemplateId,
      prdContexts,
      getCurrentProvider,
      settings.selectedModel,
    ]
  );

  // Create runtime with the chat model adapter
  const runtime = useLocalRuntime(chatModelAdapter);

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header with Controls */}
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
              onClick={() => runtime.switchToNewThread()}
            >
              New Chat
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

              {/* PRD Context Selector for critique/question modes */}
              {chatMode !== "create" && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
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
            </div>

            <div className="flex flex-col gap-2">
              {chatMode === "create" && !selectedTemplateId && (
                <p className="text-red-500 text-sm">
                  Select a template to get started.
                </p>
              )}
              {(chatMode === "critique" || chatMode === "question") &&
                prdContexts.length === 0 && (
                  <p className="text-amber-600 text-sm">
                    Add a PRD as context to get started.
                  </p>
                )}
            </div>
          </div>
        </div>

        {/* PRD Context Display */}
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
                      className="p-0 m-0"
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

      {/* Assistant UI Thread */}
      <div className="flex-1 overflow-hidden">
        <AssistantRuntimeProvider runtime={runtime}>
          <Thread />
        </AssistantRuntimeProvider>
      </div>
    </div>
  );
}
