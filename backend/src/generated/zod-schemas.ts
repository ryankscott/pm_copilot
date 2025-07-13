import { z } from 'zod';

export const PRD = z.object({
  id: z.string(),
  title: z.string(),
  content: z.string(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const GenerateContentRequest = z.object({
  prompt: z.string(),
  context: z.string().optional(),
  tone: z.enum(['professional', 'casual', 'technical', 'executive']).default('professional'),
  length: z.enum(['brief', 'standard', 'detailed', 'comprehensive']).default('standard'),
  existing_content: z.string().optional(),
  conversation_history: z.array(z.lazy(() => ConversationMessage)).optional(),
  provider: z.lazy(() => LLMProviderConfig).optional(),
  model: z.string().optional(),
});

export const CritiqueRequest = z.object({
  existing_content: z.string().optional(),
  focus_areas: z.array(z.enum(['completeness', 'clarity', 'structure', 'feasibility', 'requirements', 'user_experience', 'technical', 'business_value'])),
  depth: z.enum(['overview', 'detailed', 'comprehensive']).default('detailed'),
  include_suggestions: z.boolean().default(true),
  custom_criteria: z.string().optional(),
  provider: z.lazy(() => LLMProviderConfig).optional(),
  model: z.string().optional(),
});

export const ConversationMessage = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string(),
  timestamp: z.string().datetime(),
  input_tokens: z.number().int().optional(),
  output_tokens: z.number().int().optional(),
  total_time: z.number().optional(),
});

export const GenerateContentResponse = z.object({
  generated_content: z.string(),
  input_tokens: z.number().int(),
  output_tokens: z.number().int(),
  tokens_used: z.number().int(),
  model_used: z.string(),
  generation_time: z.number(),
  suggestions: z.array(z.string()).optional(),
});

export const CritiqueResponse = z.object({
  summary: z.string(),
  input_tokens: z.number().int(),
  output_tokens: z.number().int(),
  tokens_used: z.number().int(),
  model_used: z.string(),
  generation_time: z.number(),
});

export const LLMProviderConfig = z.object({
  type: z.enum(['openai', 'anthropic', 'google', 'ollama']),
  name: z.string(),
  apiKey: z.string().optional(),
  baseURL: z.string().optional(),
  isConfigured: z.boolean(),
});

export const LLMModel = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  maxTokens: z.number().int(),
  supportsStreaming: z.boolean(),
  costPer1MTokens: z.object({
    input: z.number(),
    output: z.number(),
  }).optional(),
});

export const Error = z.object({
  message: z.string(),
  code: z.string().optional(),
  details: z.any().optional(),
});

export const FeedbackRequest = z.object({
  traceId: z.string(),
  generationId: z.string(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().optional(),
  categories: z.array(z.string()).optional(),
});

export const FeedbackResponse = z.object({
  success: z.boolean(),
  message: z.string(),
  analytics: z.object({
    traceId: z.string(),
    generationId: z.string(),
    rating: z.number().int(),
    categoriesCount: z.number().int(),
  }).optional(),
});

export const LangfuseData = z.object({
  traceId: z.string(),
  generationId: z.string(),
  userId: z.string().optional(),
  sessionId: z.string().optional(),
  metadata: z.any().optional(),
});
