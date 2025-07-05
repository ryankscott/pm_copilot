export interface PRD {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
  timestamp?: string;
  input_tokens?: number;
  output_tokens?: number;
  total_time?: number;
  cost?: number;
}

export interface GenerateContentRequest {
  prompt: string;
  context?: string;
  tone?: "professional" | "casual" | "technical" | "executive";
  length?: "brief" | "standard" | "detailed" | "comprehensive";
  existing_content?: string;
  conversation_history?: ConversationMessage[];
  provider?: LLMProviderConfig;
  model?: string;
}

export interface GenerateContentResponse {
  generated_content: string;
  model_used?: string;
  suggestions?: string[];
  input_tokens?: number;
  output_tokens?: number;
  tokens_used?: number;
  generation_time?: number;
}

// Enhanced provider types
export type ProviderType = "openai" | "anthropic" | "google" | "ollama";

export interface LLMProviderConfig {
  type: ProviderType;
  name: string;
  apiKey?: string;
  baseURL?: string;
  models: LLMModel[];
  isConfigured: boolean;
  lastTested?: string;
  lastTestSuccess?: boolean;
}

export interface LLMModel {
  id: string;
  name: string;
  description?: string;
  maxTokens?: number;
  supportsStreaming?: boolean;
  costPer1MTokens?: {
    input: number;
    output: number;
  };
}

export interface LLMSettings {
  selectedProvider: ProviderType;
  selectedModel: string;
  providers: Record<ProviderType, LLMProviderConfig>;
  defaultSettings: {
    temperature: number;
    maxTokens: number;
    topP: number;
  };
}

// Legacy interface for backwards compatibility
export interface LLMProvider {
  name: string;
  baseURL?: string;
  apiKey?: string;
}
export type CritiqueResponse = {
  /**
   * Executive summary of the critique
   */
  summary?: string;
  /**
   * Number of input tokens used
   */
  input_tokens?: number;
  /**
   * Number of output tokens generated
   */
  output_tokens?: number;
  /**
   * Total number of tokens consumed
   */
  tokens_used?: number;
  /**
   * The AI model used for critique
   */
  model_used?: string;
  /**
   * Time taken to generate critique in seconds
   */
  generation_time?: number;
};

// Critique-related types
export interface CritiqueRequest {
  existing_content?: string;
  focus_areas?: Array<
    | "completeness"
    | "clarity"
    | "structure"
    | "feasibility"
    | "requirements"
    | "user_experience"
    | "technical"
    | "business_value"
  >;
  depth?: "surface" | "detailed" | "comprehensive";
  include_suggestions?: boolean;
  custom_criteria?: string;
  provider?: LLMProviderConfig;
  model?: string;
}
