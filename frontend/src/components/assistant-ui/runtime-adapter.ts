import type { ExternalStoreAdapter } from "@assistant-ui/react";
import { prdApi } from "@/lib/api";
import { useMessageMetadataStore } from "@/store/message-metadata-store";
import type {
  ConversationMessage,
  GenerateContentRequest,
  CritiqueRequest,
  QuestionRequest,
  PRD,
  LLMProviderConfig,
} from "@/types";
import { calculateCost } from "@/lib/cost";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt?: Date;
}

interface ChatModelAdapter {
  run: (options: {
    messages: ChatMessage[];
    abortSignal?: AbortSignal;
  }) => Promise<void>;
}

interface RuntimeState {
  messages: ChatMessage[];
  isRunning: boolean;
  mode: "create" | "critique" | "question";
  selectedTemplateId?: string;
  prdContexts: PRD[];
  provider: LLMProviderConfig;
  selectedModel?: string;
}

export class PMCoPilotRuntimeAdapter
  implements ExternalStoreAdapter<RuntimeState>
{
  private state: RuntimeState = {
    messages: [],
    isRunning: false,
    mode: "create",
    prdContexts: [],
    provider: {} as LLMProviderConfig,
  };

  private listeners = new Set<() => void>();
  private abortController: AbortController | null = null;

  constructor(provider: LLMProviderConfig, selectedModel?: string) {
    this.state.provider = provider;
    this.state.selectedModel = selectedModel;
  }

  subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  getState() {
    return this.state;
  }

  private setState(newState: Partial<RuntimeState>) {
    this.state = { ...this.state, ...newState };
    this.listeners.forEach((listener) => listener());
  }

  setMode(mode: "create" | "critique" | "question") {
    this.setState({ mode, messages: [] });
  }

  setTemplateId(templateId: string) {
    this.setState({ selectedTemplateId: templateId });
  }

  setPrdContexts(prds: PRD[]) {
    this.setState({ prdContexts: prds });
  }

  updateProvider(provider: LLMProviderConfig, selectedModel?: string) {
    this.setState({ provider, selectedModel });
  }

  async onNew(): Promise<void> {
    this.setState({ messages: [] });
  }

  getModelAdapter(): ChatModelAdapter {
    return {
      run: async ({ messages, abortSignal }) => {
        this.abortController = new AbortController();

        // Combine the abort signals
        const combinedAbortController = new AbortController();

        const abortHandler = () => {
          combinedAbortController.abort();
        };

        abortSignal?.addEventListener("abort", abortHandler);
        this.abortController.signal.addEventListener("abort", abortHandler);

        try {
          this.setState({ isRunning: true });

          const lastMessage = messages[messages.length - 1];
          if (lastMessage?.role !== "user") {
            throw new Error("Last message must be from user");
          }

          const conversationHistory: ConversationMessage[] = messages
            .slice(0, -1)
            .map((msg) => ({
              role: msg.role,
              content: msg.content,
              timestamp:
                msg.createdAt?.toISOString() || new Date().toISOString(),
            }));

          // Result union covers possible response shapes with token metadata
          let result:
            | {
                generated_content?: string | object;
                input_tokens?: number;
                output_tokens?: number;
                generation_time?: number;
                langfuse_data?: unknown;
              }
            | {
                summary?: string;
                input_tokens?: number;
                output_tokens?: number;
                generation_time?: number;
                langfuse_data?: unknown;
              }
            | {
                answer?: string;
                input_tokens?: number;
                output_tokens?: number;
                generation_time?: number;
                langfuse_data?: unknown;
              };

          switch (this.state.mode) {
            case "create": {
              if (!this.state.selectedTemplateId) {
                throw new Error("Template must be selected for create mode");
              }
              const contextPrd =
                this.state.prdContexts.length > 0
                  ? this.state.prdContexts[0]
                  : {
                      id: "temp-chat",
                      title: "Chat Session",
                      content: "",
                      created_at: new Date().toISOString(),
                      updated_at: new Date().toISOString(),
                    };
              const createRequest: GenerateContentRequest = {
                prompt: lastMessage.content,
                tone: "professional",
                length: "standard",
                existing_content: contextPrd.content,
                conversation_history: conversationHistory,
                provider: this.state.provider,
                model: this.state.selectedModel,
                template_id: this.state.selectedTemplateId,
              };
              result = await prdApi.generateContent(
                contextPrd.id,
                createRequest
              );
              break;
            }
            case "critique": {
              if (this.state.prdContexts.length === 0) {
                throw new Error("PRD context required for critique mode");
              }
              const critiqueRequest: CritiqueRequest = {
                existing_content: this.state.prdContexts[0].content,
                focus_areas: ["completeness", "clarity", "structure"],
                depth: "detailed",
                include_suggestions: true,
                custom_criteria: lastMessage.content,
                provider: this.state.provider,
                model: this.state.selectedModel,
              };
              result = await prdApi.critique(
                this.state.prdContexts[0].id,
                critiqueRequest
              );
              break;
            }
            case "question": {
              if (this.state.prdContexts.length === 0) {
                throw new Error("PRD context required for question mode");
              }
              const questionRequest: QuestionRequest = {
                question: lastMessage.content,
                context:
                  this.state.prdContexts.length > 1
                    ? `Multiple PRDs: ${this.state.prdContexts.map((prd) => prd.title).join(", ")}`
                    : undefined,
                conversation_history: conversationHistory,
                provider: this.state.provider,
                model: this.state.selectedModel,
              };
              result = await prdApi.question(
                this.state.prdContexts[0].id,
                questionRequest
              );
              break;
            }
            default: {
              throw new Error(`Unknown mode: ${this.state.mode}`);
            }
          }

          // Check if aborted during the API call
          if (combinedAbortController.signal.aborted) {
            throw new Error("Request was cancelled");
          }

          // Process the response based on mode
          let responseContent: string;
          if (this.state.mode === "critique") {
            responseContent =
              (result as { summary?: string }).summary ||
              "No critique available";
          } else if (this.state.mode === "question") {
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
              interface PRDContentShape {
                title?: string;
                summary?: string;
                sections?: Array<{ title: string; content: string }>;
              }
              const prdContent = generatedContent as PRDContentShape;
              responseContent = `# ${prdContent.title || "Generated PRD"}\n\n`;
              if (prdContent.summary) {
                responseContent += `**Summary:** ${prdContent.summary}\n\n`;
              }
              if (
                Array.isArray(prdContent.sections) &&
                prdContent.sections.length > 0
              ) {
                responseContent += prdContent.sections
                  .map((section) => `## ${section.title}\n\n${section.content}`)
                  .join("\n\n");
              }
            } else {
              responseContent = "No content generated";
            }
          }

          // Add the assistant's response to messages
          const assistantMessage: ChatMessage = {
            id: Date.now().toString(),
            role: "assistant",
            content: responseContent,
            createdAt: new Date(),
          };

          // Store metadata for the assistant message
          const setMessageMetadata =
            useMessageMetadataStore.getState().setMessageMetadata;

          // Cost now calculated via shared util

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
              this.state.selectedModel,
              this.state.provider
            );

            const langfuseData = (():
              | { traceId: string; generationId: string }
              | undefined => {
              const data = apiResponse.langfuse_data;
              if (
                data &&
                typeof data === "object" &&
                "traceId" in data &&
                "generationId" in data &&
                typeof (data as { traceId?: unknown }).traceId === "string" &&
                typeof (data as { generationId?: unknown }).generationId ===
                  "string"
              ) {
                return {
                  traceId: (data as { traceId: string }).traceId,
                  generationId: (data as { generationId: string }).generationId,
                };
              }
              return undefined;
            })();

            setMessageMetadata(assistantMessage.id, {
              inputTokens: apiResponse.input_tokens,
              outputTokens: apiResponse.output_tokens,
              generationTime: apiResponse.generation_time,
              cost,
              provider: this.state.provider.name,
              model: this.state.selectedModel || "unknown",
              langfuseData,
              timestamp: new Date(),
            });
          }

          this.setState({
            messages: [...messages, assistantMessage],
            isRunning: false,
          });
        } catch (error) {
          if (combinedAbortController.signal.aborted) {
            // Request was cancelled, don't update state
            return;
          }

          const errorMessage: ChatMessage = {
            id: Date.now().toString(),
            role: "assistant",
            content: `I'm sorry, there was an error processing your request: ${
              error instanceof Error ? error.message : "Unknown error"
            }`,
            createdAt: new Date(),
          };

          this.setState({
            messages: [...messages, errorMessage],
            isRunning: false,
          });
        } finally {
          abortSignal?.removeEventListener("abort", abortHandler);
          this.abortController = null;
        }
      },
    };
  }

  cancel() {
    if (this.abortController) {
      this.abortController.abort();
    }
  }
}
