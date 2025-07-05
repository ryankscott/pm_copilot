import type {
  PRD,
  GenerateContentRequest,
  GenerateContentResponse,
  ConversationMessage,
  LLMProviderConfig,
  CritiqueRequest,
  CritiqueResponse,
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

async function fetchApi<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new ApiError(
      response.status,
      errorData.error || `HTTP ${response.status}: ${response.statusText}`
    );
  }

  // Handle 204 No Content responses
  if (response.status === 204) {
    return null as T;
  }

  return response.json();
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
  ): Promise<GenerateContentResponse> =>
    fetchApi<GenerateContentResponse>(`/prds/${id}/generate`, {
      method: "POST",
      body: JSON.stringify(request),
    }),

  // Get AI critique for PRD
  critique: (id: string, request: CritiqueRequest): Promise<CritiqueResponse> =>
    fetchApi<CritiqueResponse>(`/prds/${id}/critique`, {
      method: "POST",
      body: JSON.stringify(request),
    }),
};

// Interactive session API calls
export const sessionApi = {
  // Get session for a PRD
  get: (
    prdId: string
  ): Promise<{
    id: string;
    prd_id: string;
    conversation_history: ConversationMessage[];
    settings: Record<string, unknown>;
    created_at: string;
    updated_at: string;
  } | null> =>
    fetchApi(`/prds/${prdId}/session`, {
      method: "GET",
    }),

  // Save session for a PRD
  save: (
    prdId: string,
    data: {
      conversation_history: ConversationMessage[];
      settings: Record<string, unknown>;
    }
  ): Promise<{ success: boolean; id?: string }> =>
    fetchApi(`/prds/${prdId}/session`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
};

// Provider testing API
export const providerApi = {
  // Test provider connection
  testConnection: (
    provider: LLMProviderConfig,
    model?: string
  ): Promise<{
    success: boolean;
    provider: string;
    model: string;
    responseTime?: number;
    message?: string;
    error?: string;
  }> =>
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
};
