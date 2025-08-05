export interface PRD {
  id: string;
  title: string;
  content: string;
  templateId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TemplateSection {
  id: string;
  name: string;
  description: string;
  placeholder?: string;
  required?: boolean;
  order: number;
}

export interface Template {
  id: string;
  title: string;
  description: string;
  category: string;
  sections: TemplateSection[];
  createdAt: string;
  updatedAt: string;
  isCustom?: boolean; // True for user-created templates
}

export interface PRDContent {
  title: string;
  summary: string;
  sections: {
    title: string;
    content: string;
  }[];
}

export interface Template {
  id: string;
  title: string;
  description: string;
  category: string;
  sections: TemplateSection[];
  createdAt: string;
  updatedAt: string;
  isCustom?: boolean;
}

export interface TemplateSection {
  id: string;
  name: string;
  description: string;
  placeholder?: string;
  required?: boolean;
  order: number;
}

export interface ConversationMessage {
  role: "user" | "assistant";
  content: string | PRDContent;
  timestamp?: string;
  input_tokens?: number;
  output_tokens?: number;
  total_time?: number;
  cost?: number;
  model_used?: string;
  has_error?: boolean;
  is_complete?: boolean; // True when the generatePRD tool was used
  langfuseData?: LangfuseData;
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
  template_id: string;
}

export interface GenerateContentResponse {
  generated_content: PRDContent;
  model_used?: string;
  suggestions?: string[];
  input_tokens?: number;
  output_tokens?: number;
  tokens_used?: number;
  generation_time?: number;
  is_complete?: boolean;
  langfuseData?: {
    traceId: string;
    generationId: string;
  };
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
  /**
   * Langfuse tracking data for feedback
   */
  langfuseData?: {
    traceId: string;
    generationId: string;
  };
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

export interface LangfuseData {
  traceId: string;
  generationId: string;
}

// Question-related types
export interface QuestionRequest {
  question: string;
  context?: string;
  conversation_history?: ConversationMessage[];
  provider?: LLMProviderConfig;
  model?: string;
}

export interface QuestionResponse {
  answer: string;
  input_tokens?: number;
  output_tokens?: number;
  tokens_used?: number;
  model_used?: string;
  generation_time?: number;
  related_sections?: string[];
  follow_up_questions?: string[];
  langfuseData?: {
    traceId: string;
    generationId: string;
  };
}
