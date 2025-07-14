import { z } from "zod";

const PRD = z
  .object({
    id: z.string(),
    title: z.string(),
    content: z.string(),
    createdAt: z.string().datetime({ offset: true }),
    updatedAt: z.string().datetime({ offset: true }),
  })
  .partial()
  .passthrough();
const ConversationMessage = z
  .object({
    role: z.enum(["user", "assistant"]),
    content: z.string(),
    timestamp: z.string().datetime({ offset: true }).optional(),
    input_tokens: z.number().int().optional(),
    output_tokens: z.number().int().optional(),
    total_time: z.number().optional(),
  })
  .passthrough();
const LLMProviderConfig = z
  .object({
    type: z.enum(["openai", "anthropic", "google", "ollama"]),
    name: z.string(),
    apiKey: z.string(),
    baseURL: z.string(),
    isConfigured: z.boolean(),
  })
  .partial()
  .passthrough();
const GenerateContentRequest = z
  .object({
    prompt: z.string(),
    context: z.string().optional(),
    tone: z
      .enum(["professional", "casual", "technical", "executive"])
      .optional()
      .default("professional"),
    length: z
      .enum(["brief", "standard", "detailed", "comprehensive"])
      .optional()
      .default("standard"),
    existing_content: z.unknown().optional(),
    conversation_history: z.array(ConversationMessage).optional(),
    provider: LLMProviderConfig.optional(),
    model: z.string().optional(),
  })
  .passthrough();
const PRDContent = z
  .object({
    title: z.string(),
    sections: z.array(
      z
        .object({ title: z.string(), content: z.string() })
        .partial()
        .passthrough()
    ),
    summary: z.string(),
  })
  .partial()
  .passthrough();
const GenerateContentResponse = z
  .object({
    generated_content: PRDContent,
    input_tokens: z.number().int(),
    output_tokens: z.number().int(),
    tokens_used: z.number().int(),
    model_used: z.string(),
    generation_time: z.number(),
    suggestions: z.array(z.string()),
  })
  .partial()
  .passthrough();
const Error = z
  .object({
    message: z.string(),
    code: z.string().optional(),
    details: z.object({}).partial().passthrough().optional(),
  })
  .passthrough();
const CritiqueRequest = z
  .object({
    existing_content: z.unknown(),
    focus_areas: z.array(
      z.enum([
        "completeness",
        "clarity",
        "structure",
        "feasibility",
        "requirements",
        "user_experience",
        "technical",
        "business_value",
      ])
    ),
    depth: z
      .enum(["overview", "detailed", "comprehensive"])
      .default("detailed"),
    include_suggestions: z.boolean().default(true),
    custom_criteria: z.string(),
    provider: LLMProviderConfig,
    model: z.string(),
  })
  .partial()
  .passthrough();
const CritiqueResponse = z
  .object({
    summary: z.string(),
    input_tokens: z.number().int(),
    output_tokens: z.number().int(),
    tokens_used: z.number().int(),
    model_used: z.string(),
    generation_time: z.number(),
  })
  .partial()
  .passthrough();
const postTestProvider_Body = z
  .object({ provider: LLMProviderConfig, model: z.string().optional() })
  .passthrough();
const LLMModel = z
  .object({
    id: z.string(),
    name: z.string(),
    description: z.string(),
    maxTokens: z.number().int(),
    supportsStreaming: z.boolean(),
    costPer1MTokens: z
      .object({ input: z.number(), output: z.number() })
      .partial()
      .passthrough(),
  })
  .partial()
  .passthrough();
const FeedbackRequest = z
  .object({
    traceId: z.string(),
    generationId: z.string(),
    rating: z.number().int().gte(1).lte(5).optional(),
    comment: z.string().optional(),
    categories: z.array(z.string()).optional(),
  })
  .passthrough();
const FeedbackResponse = z
  .object({
    success: z.boolean(),
    message: z.string(),
    analytics: z
      .object({
        traceId: z.string(),
        generationId: z.string(),
        rating: z.number().int(),
        categoriesCount: z.number().int(),
      })
      .partial()
      .passthrough(),
  })
  .partial()
  .passthrough();
const LangfuseData = z
  .object({
    traceId: z.string(),
    generationId: z.string(),
    userId: z.string(),
    sessionId: z.string(),
    metadata: z.object({}).partial().passthrough(),
  })
  .partial()
  .passthrough();

export const schemas = {
  PRD,
  ConversationMessage,
  LLMProviderConfig,
  GenerateContentRequest,
  PRDContent,
  GenerateContentResponse,
  Error,
  CritiqueRequest,
  CritiqueResponse,
  postTestProvider_Body,
  LLMModel,
  FeedbackRequest,
  FeedbackResponse,
  LangfuseData,
};
