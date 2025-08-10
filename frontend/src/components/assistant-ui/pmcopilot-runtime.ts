import {
  useExternalStoreRuntime,
  type ChatModelAdapter,
  type ThreadMessage,
} from "@assistant-ui/react";
import { prdApi } from "@/lib/api";
import type {
  ConversationMessage,
  GenerateContentRequest,
  CritiqueRequest,
  QuestionRequest,
  PRD,
  LLMProviderConfig,
} from "@/types";

interface RuntimeState {
  mode: "create" | "critique" | "question";
  selectedTemplateId?: string;
  prdContexts: PRD[];
  provider: LLMProviderConfig;
  selectedModel?: string;
}

export interface PMCoPilotRuntimeConfig {
  provider: LLMProviderConfig;
  selectedModel?: string;
  mode?: "create" | "critique" | "question";
  selectedTemplateId?: string;
  prdContexts?: PRD[];
}

export function usePMCoPilotRuntime(config: PMCoPilotRuntimeConfig) {
  const {
    provider,
    selectedModel,
    mode = "create",
    selectedTemplateId,
    prdContexts = [],
  } = config;

  const adapter: ChatModelAdapter = {
    async run({ messages, abortSignal, onUpdate }) {
      try {
        const lastMessage = messages[messages.length - 1];
        if (lastMessage?.role !== "user") {
          throw new Error("Last message must be from user");
        }

        const conversationHistory: ConversationMessage[] = messages
          .slice(0, -1)
          .map((msg) => ({
            role: msg.role,
            content: Array.isArray(msg.content)
              ? msg.content
                  .map((part) =>
                    part.type === "text" ? part.text : "[Unsupported content]"
                  )
                  .join("")
              : msg.content,
            timestamp: new Date().toISOString(),
          }));

        const userPrompt = Array.isArray(lastMessage.content)
          ? lastMessage.content
              .map((part) =>
                part.type === "text" ? part.text : "[Unsupported content]"
              )
              .join("")
          : lastMessage.content;

        let result: unknown;

        switch (mode) {
          case "create": {
            if (!selectedTemplateId) {
              throw new Error("Template must be selected for create mode");
            }

            const contextPrd =
              prdContexts.length > 0
                ? prdContexts[0]
                : {
                    id: "temp-chat",
                    title: "Chat Session",
                    content: "",
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                  };

            const createRequest: GenerateContentRequest = {
              prompt: userPrompt,
              tone: "professional",
              length: "standard",
              existing_content: contextPrd.content,
              conversation_history: conversationHistory,
              provider,
              model: selectedModel,
              template_id: selectedTemplateId,
            };

            result = await prdApi.generateContent(contextPrd.id, createRequest);
            break;
          }

          case "critique": {
            if (prdContexts.length === 0) {
              throw new Error("PRD context required for critique mode");
            }

            const critiqueRequest: CritiqueRequest = {
              existing_content: prdContexts[0].content,
              focus_areas: ["completeness", "clarity", "structure"],
              depth: "detailed",
              include_suggestions: true,
              custom_criteria: userPrompt,
              provider,
              model: selectedModel,
            };

            result = await prdApi.critique(prdContexts[0].id, critiqueRequest);
            break;
          }

          case "question": {
            if (prdContexts.length === 0) {
              throw new Error("PRD context required for question mode");
            }

            const questionRequest: QuestionRequest = {
              question: userPrompt,
              context:
                prdContexts.length > 1
                  ? `Multiple PRDs: ${prdContexts.map((prd) => prd.title).join(", ")}`
                  : undefined,
              conversation_history: conversationHistory,
              provider,
              model: selectedModel,
            };

            result = await prdApi.question(prdContexts[0].id, questionRequest);
            break;
          }

          default:
            throw new Error(`Unknown mode: ${mode}`);
        }

        // Check if aborted during the API call
        if (abortSignal?.aborted) {
          throw new Error("Request was cancelled");
        }

        // Process the response based on mode
        let responseContent: string;
        if (mode === "critique") {
          responseContent =
            (result as { summary?: string }).summary || "No critique available";
        } else if (mode === "question") {
          responseContent =
            (result as { answer?: string }).answer || "No answer provided";
        } else {
          // Create mode
          const generatedContent = (
            result as { generated_content?: string | Record<string, unknown> }
          ).generated_content;
          if (typeof generatedContent === "string") {
            responseContent = generatedContent;
          } else if (generatedContent && typeof generatedContent === "object") {
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

        // Stream the response text
        for (let i = 0; i <= responseContent.length; i++) {
          if (abortSignal?.aborted) break;

          const partialContent = responseContent.slice(0, i);
          onUpdate({
            content: [{ type: "text", text: partialContent }],
            status: { type: "running" },
          });

          // Add a small delay to simulate streaming
          if (i < responseContent.length) {
            await new Promise((resolve) => setTimeout(resolve, 20));
          }
        }

        // Final update with complete status
        if (!abortSignal?.aborted) {
          onUpdate({
            content: [{ type: "text", text: responseContent }],
            status: { type: "complete" },
          });
        }
      } catch (error) {
        if (abortSignal?.aborted) {
          return;
        }

        const errorMessage = `I'm sorry, there was an error processing your request: ${
          error instanceof Error ? error.message : "Unknown error"
        }`;

        onUpdate({
          content: [{ type: "text", text: errorMessage }],
          status: {
            type: "error",
            error: error instanceof Error ? error : new Error(errorMessage),
          },
        });
      }
    },
  };

  return useExternalStoreRuntime(adapter);
}
