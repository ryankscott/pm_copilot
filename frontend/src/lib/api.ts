import type {
  PRD,
  GenerateContentRequest,
  GenerateContentResponse,
  ConversationMessage,
  LLMProviderConfig,
  CritiqueRequest,
  CritiqueResponse,
  LLMModel,
} from "@/types";

const API_BASE_URL = "http://localhost:8080";

export class ApiError extends Error {
  public status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = "ApiError";
  }
}

// Helper function to make API calls
async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new ApiError(
      response.status,
      errorData.message || `HTTP ${response.status}`
    );
  }

  return response.json();
}

// Session management API
export const sessionApi = {
  get: (prdId: string) =>
    fetchApi<{
      id: string;
      prd_id: string;
      conversation_history: ConversationMessage[];
      settings: Record<string, unknown>;
      created_at: string;
      updated_at: string;
    } | null>(`/prds/${prdId}/session`),
  save: (
    prdId: string,
    session: {
      conversation_history: ConversationMessage[];
      settings: Record<string, unknown>;
    }
  ) =>
    fetchApi<{ success: boolean; id?: string }>(`/prds/${prdId}/session`, {
      method: "POST",
      body: JSON.stringify(session),
    }),
};

// Langfuse feedback types
export interface LangfuseData {
  traceId: string;
  generationId: string;
  userId?: string;
  sessionId?: string;
  metadata?: Record<string, unknown>;
}

export interface FeedbackRequest {
  traceId: string;
  generationId: string;
  score: number; // 1 for thumbs up, -1 for thumbs down
  comment?: string;
}

export interface FeedbackResponse {
  success: boolean;
  message: string;
}

export const prdApi = {
  // Get all PRDs
  getAll: (): Promise<PRD[]> => fetchApi<PRD[]>("/prds"),

  // Get PRD by ID
  getById: (id: string): Promise<PRD> => fetchApi<PRD>(`/prds/${id}`),

  // Create new PRD
  create: (prd: Omit<PRD, "id" | "createdAt" | "updatedAt">): Promise<PRD> =>
    fetchApi<PRD>("/prds", {
      method: "POST",
      body: JSON.stringify(prd),
    }),

  // Update existing PRD
  update: (
    id: string,
    prd: Partial<Omit<PRD, "id" | "createdAt" | "updatedAt">>
  ): Promise<PRD> =>
    fetchApi<PRD>(`/prds/${id}`, {
      method: "PUT",
      body: JSON.stringify(prd),
    }),

  // Delete PRD
  delete: (id: string): Promise<null> =>
    fetchApi<null>(`/prds/${id}`, {
      method: "DELETE",
    }),

  // Generate AI content for PRD
  generateContent: (
    id: string,
    request: GenerateContentRequest
  ): Promise<GenerateContentResponse & { langfuseData?: LangfuseData }> =>
    fetchApi<GenerateContentResponse & { langfuseData?: LangfuseData }>(
      `/prds/${id}/generate`,
      {
        method: "POST",
        body: JSON.stringify(request),
      }
    ),

  // Get AI critique for PRD
  critique: (
    id: string,
    request: CritiqueRequest
  ): Promise<CritiqueResponse & { langfuseData?: LangfuseData }> =>
    fetchApi<CritiqueResponse & { langfuseData?: LangfuseData }>(
      `/prds/${id}/critique`,
      {
        method: "POST",
        body: JSON.stringify(request),
      }
    ),
};

// Feedback API
export const feedbackApi = {
  // Submit feedback for a generation
  submit: (feedback: FeedbackRequest): Promise<FeedbackResponse> =>
    fetchApi<FeedbackResponse>("/feedback", {
      method: "POST",
      body: JSON.stringify(feedback),
    }),
};

// Provider testing API
export const providerApi = {
  test: (provider: LLMProviderConfig, model?: string) =>
    fetchApi<{
      success: boolean;
      provider: string;
      model: string;
      responseTime?: number;
      message?: string;
      error?: string;
    }>("/test-provider", {
      method: "POST",
      body: JSON.stringify({ provider, model }),
    }),

  getOllamaModels: (baseURL?: string): Promise<LLMModel[]> =>
    fetchApi<LLMModel[]>(
      `/ollama/models?baseURL=${baseURL || "http://localhost:11434"}`
    ),
};
