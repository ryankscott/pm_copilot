import { Langfuse } from "langfuse";
import "dotenv/config";

// Initialize Langfuse client
export const langfuse = new Langfuse({
  publicKey: process.env.LANGFUSE_PUBLIC_KEY,
  secretKey: process.env.LANGFUSE_SECRET_KEY,
  baseUrl: process.env.LANGFUSE_HOST || "https://cloud.langfuse.com",
});

// Enhanced error types for better tracking
export enum LangfuseErrorType {
  CONNECTION_ERROR = "connection_error",
  AUTHENTICATION_ERROR = "authentication_error",
  RATE_LIMIT_ERROR = "rate_limit_error",
  VALIDATION_ERROR = "validation_error",
  UNKNOWN_ERROR = "unknown_error",
}

export interface LangfuseError {
  type: LangfuseErrorType;
  message: string;
  stack?: string;
  timestamp: string;
  retryCount?: number;
}

// Enhanced configuration
export interface LangfuseConfig {
  maxRetries: number;
  retryDelay: number;
  healthCheckInterval: number;
  enableDetailedLogging: boolean;
}

const defaultConfig: LangfuseConfig = {
  maxRetries: 3,
  retryDelay: 1000,
  healthCheckInterval: 30000,
  enableDetailedLogging: process.env.NODE_ENV === "development",
};

// Health check state
let lastHealthCheck: Date | null = null;
let isHealthy = true;
let healthCheckPromise: Promise<boolean> | null = null;

// Helper function to ensure Langfuse is properly initialized
export const isLangfuseEnabled = (): boolean => {
  return !!(process.env.LANGFUSE_PUBLIC_KEY && process.env.LANGFUSE_SECRET_KEY);
};

// Enhanced error handling with retry logic
export const withRetry = async <T>(
  operation: () => Promise<T>,
  context: string,
  config: Partial<LangfuseConfig> = {}
): Promise<T | null> => {
  const { maxRetries, retryDelay, enableDetailedLogging } = {
    ...defaultConfig,
    ...config,
  };

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;

      const langfuseError: LangfuseError = {
        type: classifyError(error),
        message: lastError.message,
        stack: lastError.stack,
        timestamp: new Date().toISOString(),
        retryCount: attempt,
      };

      if (enableDetailedLogging) {
        console.warn(
          `Langfuse operation failed (attempt ${attempt}/${maxRetries}) - ${context}:`,
          langfuseError
        );
      }

      // Don't retry on authentication errors
      if (langfuseError.type === LangfuseErrorType.AUTHENTICATION_ERROR) {
        break;
      }

      // Wait before retrying (exponential backoff)
      if (attempt < maxRetries) {
        await new Promise((resolve) =>
          setTimeout(resolve, retryDelay * Math.pow(2, attempt - 1))
        );
      }
    }
  }

  console.error(
    `Langfuse operation failed after ${maxRetries} attempts - ${context}:`,
    lastError
  );
  return null;
};

// Classify errors for better handling
const classifyError = (error: any): LangfuseErrorType => {
  if (!error) return LangfuseErrorType.UNKNOWN_ERROR;

  const message = error.message?.toLowerCase() || "";

  if (message.includes("unauthorized") || message.includes("invalid key")) {
    return LangfuseErrorType.AUTHENTICATION_ERROR;
  }
  if (message.includes("rate limit") || message.includes("too many requests")) {
    return LangfuseErrorType.RATE_LIMIT_ERROR;
  }
  if (message.includes("connection") || message.includes("network")) {
    return LangfuseErrorType.CONNECTION_ERROR;
  }
  if (message.includes("validation") || message.includes("invalid")) {
    return LangfuseErrorType.VALIDATION_ERROR;
  }

  return LangfuseErrorType.UNKNOWN_ERROR;
};

// Health check for Langfuse connectivity
export const checkLangfuseHealth = async (): Promise<boolean> => {
  if (!isLangfuseEnabled()) {
    return false;
  }

  // Return cached result if recent
  if (
    lastHealthCheck &&
    Date.now() - lastHealthCheck.getTime() < defaultConfig.healthCheckInterval
  ) {
    return isHealthy;
  }

  // Prevent multiple concurrent health checks
  if (healthCheckPromise) {
    return healthCheckPromise;
  }

  healthCheckPromise = withRetry(
    async () => {
      // Simple health check - create a minimal trace
      const trace = langfuse.trace({
        name: "health-check",
        metadata: { type: "health_check", timestamp: new Date().toISOString() },
      });

      if (trace) {
        await langfuse.flushAsync();
        return true;
      }
      throw new Error("Failed to create health check trace");
    },
    "health-check",
    { maxRetries: 1, retryDelay: 500 }
  ).then((result) => {
    isHealthy = result !== null;
    lastHealthCheck = new Date();
    healthCheckPromise = null;
    return isHealthy;
  });

  return healthCheckPromise;
};

// Helper function to safely use Langfuse
export const safeLangfuse = () => {
  if (!isLangfuseEnabled()) {
    console.warn(
      "Langfuse is not configured. Set LANGFUSE_PUBLIC_KEY and LANGFUSE_SECRET_KEY environment variables."
    );
    return null;
  }
  return langfuse;
};

// Enhanced types for Langfuse integration
export interface LangfuseTraceData {
  traceId: string;
  generationId: string;
  userId?: string;
  sessionId?: string;
  metadata?: Record<string, any>;
}

export interface LangfuseFeedback {
  traceId: string;
  generationId: string;
  score: number; // 1 for thumbs up, -1 for thumbs down
  comment?: string;
  userId?: string;
}

// Enhanced session management
export interface SessionMetadata {
  userAgent?: string;
  ipAddress?: string;
  location?: string;
  sessionStart: string;
  lastActivity: string;
  interactionCount: number;
  totalTokensUsed: number;
  averageResponseTime: number;
}

// Generate consistent session ID
export const generateSessionId = (userId?: string): string => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  return `session_${userId || "anon"}_${timestamp}_${random}`;
};

// Enhanced trace creation with better metadata
export const createPRDTrace = (
  prdId: string,
  userId?: string,
  sessionId?: string,
  metadata?: Record<string, any>
) => {
  const lf = safeLangfuse();
  if (!lf) return null;

  try {
    const trace = lf.trace({
      name: "prd-generation",
      userId,
      sessionId,
      metadata: {
        prdId,
        application: "pm-copilot",
        version: "1.0.0",
        timestamp: new Date().toISOString(),
        type: "prd_generation",
        ...metadata,
      },
    });

    if (defaultConfig.enableDetailedLogging) {
      console.log(`Created PRD trace: ${trace?.id} for PRD: ${prdId}`);
    }

    return trace;
  } catch (error) {
    console.error(`Failed to create PRD trace for ${prdId}:`, error);
    return null;
  }
};

// Enhanced critique trace creation
export const createCritiqueTrace = (
  prdId: string,
  userId?: string,
  sessionId?: string,
  metadata?: Record<string, any>
) => {
  const lf = safeLangfuse();
  if (!lf) return null;

  try {
    const trace = lf.trace({
      name: "prd-critique",
      userId,
      sessionId,
      metadata: {
        prdId,
        application: "pm-copilot",
        version: "1.0.0",
        timestamp: new Date().toISOString(),
        type: "prd_critique",
        ...metadata,
      },
    });

    if (defaultConfig.enableDetailedLogging) {
      console.log(`Created critique trace: ${trace?.id} for PRD: ${prdId}`);
    }

    return trace;
  } catch (error) {
    console.error(`Failed to create critique trace for ${prdId}:`, error);
    return null;
  }
};

// Enhanced feedback submission with retry logic
export const submitFeedback = async (feedback: LangfuseFeedback) => {
  const lf = safeLangfuse();
  if (!lf) return;

  return withRetry(async () => {
    await lf.score({
      traceId: feedback.traceId,
      name: "user-feedback",
      value: feedback.score,
      comment: feedback.comment,
    });

    if (defaultConfig.enableDetailedLogging) {
      console.log("Feedback submitted successfully:", {
        traceId: feedback.traceId,
        score: feedback.score,
        userId: feedback.userId,
      });
    }
  }, `submit-feedback-${feedback.traceId}`);
};

// Enhanced flush with error handling
export const flushLangfuse = async (): Promise<boolean> => {
  const lf = safeLangfuse();
  if (!lf) return false;

  const result = await withRetry(
    async () => {
      await lf.flushAsync();
      return true;
    },
    "flush-langfuse",
    { maxRetries: 2, retryDelay: 500 }
  );

  if (result) {
    console.log("Langfuse flushed successfully");
    return true;
  } else {
    console.error("Failed to flush Langfuse after retries");
    return false;
  }
};

// New utility functions for enhanced tracking
export const trackCustomEvent = async (
  eventName: string,
  properties: Record<string, any>,
  userId?: string,
  sessionId?: string
) => {
  const lf = safeLangfuse();
  if (!lf) return;

  return withRetry(async () => {
    const event = lf.event({
      name: eventName,
      metadata: {
        ...properties,
        timestamp: new Date().toISOString(),
        application: "pm-copilot",
        userId,
        sessionId,
      },
    });

    if (defaultConfig.enableDetailedLogging) {
      console.log(`Tracked custom event: ${eventName}`, properties);
    }

    return event;
  }, `track-event-${eventName}`);
};

// Performance metrics tracking
export const trackPerformanceMetric = async (
  metricName: string,
  value: number,
  unit: string,
  metadata?: Record<string, any>
) => {
  return trackCustomEvent("performance_metric", {
    metric_name: metricName,
    value,
    unit,
    ...metadata,
  });
};

// Export health check endpoint data
export const getLangfuseHealthStatus = async () => {
  const isEnabled = isLangfuseEnabled();
  const healthy = isEnabled ? await checkLangfuseHealth() : false;

  return {
    enabled: isEnabled,
    healthy,
    lastHealthCheck: lastHealthCheck?.toISOString(),
    configuration: {
      baseUrl: process.env.LANGFUSE_HOST || "https://cloud.langfuse.com",
      hasPublicKey: !!process.env.LANGFUSE_PUBLIC_KEY,
      hasSecretKey: !!process.env.LANGFUSE_SECRET_KEY,
    },
  };
};
