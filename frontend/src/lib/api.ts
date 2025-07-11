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
  submit: (
    feedback: FeedbackRequest & {
      rating?: number;
      categories?: string[];
    }
  ): Promise<
    FeedbackResponse & {
      analytics?: {
        traceId: string;
        generationId: string;
        rating: number;
        categoriesCount: number;
      };
    }
  > =>
    fetchApi<
      FeedbackResponse & {
        analytics?: {
          traceId: string;
          generationId: string;
          rating: number;
          categoriesCount: number;
        };
      }
    >("/api/feedback/enhanced", {
      method: "POST",
      body: JSON.stringify(feedback),
    }),

  // Get feedback history
  getHistory: (params?: {
    limit?: number;
    offset?: number;
    userId?: string;
  }): Promise<{
    success: boolean;
    data: Array<{
      id: string;
      traceId: string;
      generationId: string;
      rating: number;
      comment?: string;
      categories?: string[];
      timestamp: string;
      modelUsed?: string;
      provider?: string;
      responsePreview?: string;
    }>;
    pagination: {
      limit: number;
      offset: number;
      total: number;
    };
  }> => {
    const searchParams = new URLSearchParams();
    if (params?.limit) searchParams.append("limit", params.limit.toString());
    if (params?.offset) searchParams.append("offset", params.offset.toString());
    if (params?.userId) searchParams.append("userId", params.userId);

    return fetchApi<{
      success: boolean;
      data: Array<{
        id: string;
        traceId: string;
        generationId: string;
        rating: number;
        comment?: string;
        categories?: string[];
        timestamp: string;
        modelUsed?: string;
        provider?: string;
        responsePreview?: string;
      }>;
      pagination: {
        limit: number;
        offset: number;
        total: number;
      };
    }>(`/api/feedback/history?${searchParams}`);
  },

  // Get feedback analytics
  getAnalytics: (params?: {
    userId?: string;
    timeRange?: string;
  }): Promise<{
    success: boolean;
    data: {
      totalFeedback: number;
      positiveCount: number;
      negativeCount: number;
      positiveRate: number;
      averageRating: number;
      topCategories: Array<{ category: string; count: number }>;
      recentTrend: "up" | "down" | "stable";
      timeRange: string;
      lastUpdated: string;
    };
    generatedAt: string;
  }> => {
    const searchParams = new URLSearchParams();
    if (params?.userId) searchParams.append("userId", params.userId);
    if (params?.timeRange) searchParams.append("timeRange", params.timeRange);

    return fetchApi<{
      success: boolean;
      data: {
        totalFeedback: number;
        positiveCount: number;
        negativeCount: number;
        positiveRate: number;
        averageRating: number;
        topCategories: Array<{ category: string; count: number }>;
        recentTrend: "up" | "down" | "stable";
        timeRange: string;
        lastUpdated: string;
      };
      generatedAt: string;
    }>(`/api/feedback/analytics?${searchParams}`);
  },

  // Get feedback trends
  getTrends: (params?: {
    userId?: string;
    period?: string;
    timeRange?: string;
  }): Promise<{
    success: boolean;
    data: Array<{
      date: string;
      positive: number;
      negative: number;
      total: number;
      averageRating: number;
    }>;
    period: string;
    timeRange: string;
    generatedAt: string;
  }> => {
    const searchParams = new URLSearchParams();
    if (params?.userId) searchParams.append("userId", params.userId);
    if (params?.period) searchParams.append("period", params.period);
    if (params?.timeRange) searchParams.append("timeRange", params.timeRange);

    return fetchApi<{
      success: boolean;
      data: Array<{
        date: string;
        positive: number;
        negative: number;
        total: number;
        averageRating: number;
      }>;
      period: string;
      timeRange: string;
      generatedAt: string;
    }>(`/api/feedback/trends?${searchParams}`);
  },
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
