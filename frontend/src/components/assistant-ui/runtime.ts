import { useMemo } from "react";
import { useLocalRuntime, type ChatModelAdapter } from "@assistant-ui/react";
import { prdApi } from "@/lib/api";
import { calculateCost } from "@/lib/cost";
import { useLLMStore } from "@/store/llm-store";
import { useMessageMetadataStore } from "@/store/message-metadata-store";
import type {
  ConversationMessage,
  PRD,
  GenerateContentRequest,
  CritiqueRequest,
  QuestionRequest,
} from "@/types";

export type ChatMode = "create" | "critique" | "question";

export interface PRDContext {
  prd: PRD;
  addedAt: Date;
}

export interface UsePrdRuntimeOptions {
  chatMode: ChatMode;
  prdContexts: PRDContext[];
  selectedTemplateId: string;
}

export function usePrdRuntime({
  chatMode,
  prdContexts,
  selectedTemplateId,
}: UsePrdRuntimeOptions) {
  const { getCurrentProvider, settings } = useLLMStore();

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
                user_context: settings.userContext,
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
                user_context: settings.userContext,
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
                    ? `Multiple PRDs: ${prdContexts
                        .map((ctx) => ctx.prd.title)
                        .join(", ")}`
                    : undefined,
                conversation_history: conversationHistory,
                provider,
                model: settings.selectedModel,
                user_context: settings.userContext,
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

          if (abortSignal?.aborted) {
            throw new Error("Request was cancelled");
          }

          let responseContent: string;
          if (chatMode === "critique") {
            responseContent =
              (result as { summary?: string }).summary ||
              "No critique available";
          } else if (chatMode === "question") {
            responseContent =
              (result as { answer?: string }).answer || "No answer provided";
          } else {
            const generatedContent = (
              result as { generated_content?: string | object }
            ).generated_content;
            if (typeof generatedContent === "string") {
              responseContent = generatedContent;
            } else if (
              generatedContent &&
              typeof generatedContent === "object"
            ) {
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

          const setMessageMetadata = useMessageMetadataStore.getState();

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
              responseContent: (typeof result === "object" &&
              "generated_content" in (result as Record<string, unknown>)
                ? ((result as { generated_content?: string | object })
                    .generated_content as string | undefined) || ""
                : ""
              )
                .toString()
                .substring(0, 100),
            });
          }

          return {
            content: [{ type: "text", text: responseContent }],
          };
        } catch (error) {
          if (abortSignal?.aborted) {
            throw error;
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
      settings.userContext,
    ]
  );

  return useLocalRuntime(chatModelAdapter);
}
