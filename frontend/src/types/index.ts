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
}

export interface GenerateContentRequest {
  prompt: string;
  context?: string;
  tone?: "professional" | "casual" | "technical" | "executive";
  length?: "brief" | "standard" | "detailed" | "comprehensive";
  existing_content?: string;
  conversation_history?: ConversationMessage[];
}

export interface GenerateContentResponse {
  generated_content: string;
  tokens_used?: number;
  model_used?: string;
  generation_time?: number;
  suggestions?: string[];
}

export interface LLMProvider {
  name: string;
  baseURL?: string;
  apiKey?: string;
}

export interface LLMModel {
  name: string;
  provider: LLMProvider;
  description?: string;
  maxTokens?: number;
  temperature?: number;
}
