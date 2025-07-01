export interface PRD {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
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
