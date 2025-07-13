import { createOpenAI } from "@ai-sdk/openai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
// Removed redundant imports for createOpenAI, createAnthropic, and createGoogleGenerativeAI.
import { createOllama } from "ollama-ai-provider";
import { generateObject, CoreMessage } from "ai";
import { z } from "zod";
import "dotenv/config";
import {
  getInteractiveSystemPrompt,
  getCritiqueSystemPrompt,
  getCritiqueUserPrompt,
} from "./prompts";
import {
  CritiqueRequest,
  GenerateContentRequest,
  GenerateContentResponse,
  CritiqueResponse,
  LLMProviderConfig,
  PRDContent,
} from "./generated";
import {
  createPRDTrace,
  createCritiqueTrace,
  isLangfuseEnabled,
  LangfuseTraceData,
  generateSessionId,
  trackCustomEvent,
  trackPerformanceMetric,
} from "./langfuse";

// Helper function to get the appropriate AI model based on provider configuration
const getAIModel = (provider?: LLMProviderConfig, modelId?: string) => {
  // Default fallback
  const defaultModel = "llama3.2:latest";
  const defaultOllamaBaseURL = "http://localhost:11434";

  if (!provider || !provider.isConfigured) {
    console.log("No provider configured, using Ollama default:", defaultModel);
    const defaultOllama = createOllama({
      baseURL: `${defaultOllamaBaseURL}/api`,
    });
    return { model: defaultOllama(defaultModel), modelName: defaultModel };
  }

  const selectedModel = modelId || defaultModel;

  switch (provider.type) {
    case "openai":
      if (!provider.apiKey) {
        console.warn("OpenAI API key not provided, falling back to Ollama");
        const fallbackOllama = createOllama({
          baseURL: `${defaultOllamaBaseURL}/api`,
        });
        return { model: fallbackOllama(defaultModel), modelName: defaultModel };
      }
      // Create OpenAI instance with provided API key
      const openaiWithKey = createOpenAI({
        apiKey: provider.apiKey,
      });
      console.log("Using OpenAI model:", selectedModel);
      return { model: openaiWithKey(selectedModel), modelName: selectedModel };

    case "anthropic":
      if (!provider.apiKey) {
        console.warn("Anthropic API key not provided, falling back to Ollama");
        const fallbackOllama = createOllama({
          baseURL: `${defaultOllamaBaseURL}/api`,
        });
        return { model: fallbackOllama(defaultModel), modelName: defaultModel };
      }
      // Create Anthropic instance with provided API key
      const anthropicWithKey = createAnthropic({
        apiKey: provider.apiKey,
      });
      console.log("Using Anthropic model:", selectedModel);
      return {
        model: anthropicWithKey(selectedModel),
        modelName: selectedModel,
      };

    case "google":
      if (!provider.apiKey) {
        console.warn("Google API key not provided, falling back to Ollama");
        const fallbackOllama = createOllama({
          baseURL: `${defaultOllamaBaseURL}/api`,
        });
        return { model: fallbackOllama(defaultModel), modelName: defaultModel };
      }
      // Create Google instance with provided API key
      const googleWithKey = createGoogleGenerativeAI({
        apiKey: provider.apiKey,
      });
      console.log("Using Google model:", selectedModel);
      return { model: googleWithKey(selectedModel), modelName: selectedModel };

    case "ollama":
      // Use the provider's baseURL or fall back to default
      const ollamaBaseURL = provider.baseURL || defaultOllamaBaseURL;
      const ollamaInstance = createOllama({
        baseURL: `${ollamaBaseURL}/api`,
      });
      console.log("Using Ollama model:", selectedModel, "at", ollamaBaseURL);
      return { model: ollamaInstance(selectedModel), modelName: selectedModel };

    default:
      console.log("Unknown provider type, using Ollama default:", defaultModel);
      const defaultOllama = createOllama({
        baseURL: `${defaultOllamaBaseURL}/api`,
      });
      return { model: defaultOllama(defaultModel), modelName: defaultModel };
  }
};

export const generateContent = async (
  request: GenerateContentRequest,
  prdId?: string,
  userId?: string,
  sessionId?: string
): Promise<GenerateContentResponse & { langfuseData?: LangfuseTraceData }> => {
  const startTime = Date.now();

  // Generate session ID if not provided
  const effectiveSessionId = sessionId || generateSessionId(userId);

  // Track the generation request
  await trackCustomEvent(
    "prd_generation_started",
    {
      prdId,
      provider: request.provider?.type || "ollama",
      model: request.model,
      tone: request.tone,
      length: request.length,
      hasConversationHistory: !!request.conversation_history?.length,
      conversationLength: request.conversation_history?.length || 0,
    },
    userId,
    effectiveSessionId
  );

  // Create Langfuse trace with enhanced metadata
  let trace = null;
  let generation = null;
  let langfuseData: LangfuseTraceData | undefined;

  if (isLangfuseEnabled() && prdId) {
    trace = await createPRDTrace(prdId, userId, effectiveSessionId, {
      provider: request.provider?.type || "ollama",
      model: request.model,
      tone: request.tone,
      length: request.length,
      promptLength: request.prompt?.length || 0,
      conversationTurns: request.conversation_history?.length || 0,
    });

    if (trace) {
      langfuseData = {
        traceId: trace.id,
        generationId: "", // Will be set after generation
        userId,
        sessionId: effectiveSessionId,
        metadata: { prdId },
      };
    }
  }

  // Get the appropriate model based on provider configuration
  const { model, modelName } = getAIModel(request.provider, request.model);

  try {
    // Build the system prompt using the new async function that fetches from Langfuse
    const systemPrompt = await getInteractiveSystemPrompt(request);

    // Check if we have a valid prompt
    if (!request.prompt || request.prompt.trim() === "") {
      throw new Error("No prompt provided. The current user input is missing.");
    }

    // Prepare messages array - include conversation history + current prompt
    let messages: CoreMessage[] = [];
    if (
      request.conversation_history &&
      request.conversation_history.length > 0
    ) {
      // Add existing conversation history - filter and validate roles
      messages = request.conversation_history
        .filter((msg) => msg.role === "user" || msg.role === "assistant")
        .map((msg) => ({
          role: msg.role as "user" | "assistant",
          content: msg.content,
        }));

      // Add the current user prompt as the latest message
      messages.push({
        role: "user",
        content: request.prompt,
      });
    } else {
      console.log(
        "No conversation history, using prompt directly:",
        JSON.stringify(request.prompt)
      );
    }

    // Start Langfuse generation tracking with enhanced metadata
    if (trace) {
      generation = trace.generation({
        name: "prd-interactive-generation",
        model: modelName,
        input: {
          system: systemPrompt,
          messages: messages.length > 0 ? messages : request.prompt,
          tone: request.tone,
          length: request.length,
        },
        metadata: {
          provider: request.provider?.type || "ollama",
          model: modelName,
          temperature: 0.7,
          maxTokens: 10000,
          systemPromptLength: systemPrompt.length,
          userPromptLength: request.prompt.length,
          conversationTurns: messages.length,
          requestTimestamp: new Date().toISOString(),
        },
      });

      if (langfuseData) {
        langfuseData.generationId = generation.id;
      }
    }

    const result = await generateObject({
      model: model,
      system: systemPrompt,
      maxTokens: 10000,
      temperature: 0.7,
      prompt: messages.length === 0 ? request.prompt : undefined,
      messages: messages.length > 0 ? messages : undefined,
      schema: z.object({
        title: z.string(),
        summary: z.string(),
        sections: z.array(
          z.object({
            title: z.string(),
            content: z.string(),
          })
        ),
      }),
    });

    const endTime = Date.now();
    const generationTime = (endTime - startTime) / 1000;

    // Track performance metrics
    await trackPerformanceMetric("generation_time", generationTime, "seconds", {
      provider: request.provider?.type || "ollama",
      model: modelName,
      inputTokens: result.usage?.promptTokens || 0,
      outputTokens: result.usage?.completionTokens || 0,
      prdId,
      userId,
    });

    await trackPerformanceMetric(
      "token_usage",
      result.usage?.totalTokens || 0,
      "tokens",
      {
        provider: request.provider?.type || "ollama",
        model: modelName,
        inputTokens: result.usage?.promptTokens || 0,
        outputTokens: result.usage?.completionTokens || 0,
        prdId,
        userId,
      }
    );

    // Update Langfuse generation with results
    if (generation) {
      generation.end({
        output: result.object,
        usage: {
          input: result.usage?.promptTokens || 0,
          output: result.usage?.completionTokens || 0,
          total: result.usage?.totalTokens || 0,
        },
        metadata: {
          generationTime,
          outputLength: JSON.stringify(result.object).length,
          completedAt: new Date().toISOString(),
        },
      });
    }

    // Track successful generation
    await trackCustomEvent(
      "prd_generation_completed",
      {
        prdId,
        provider: request.provider?.type || "ollama",
        model: modelName,
        generationTime,
        inputTokens: result.usage?.promptTokens || 0,
        outputTokens: result.usage?.completionTokens || 0,
        outputLength: JSON.stringify(result.object).length,
        success: true,
      },
      userId,
      effectiveSessionId
    );

    console.log("AI generation completed in", generationTime, "seconds");
    console.log("Generated content length:", JSON.stringify(result.object).length);
    console.log(
      "Generated content preview:",
      JSON.stringify(result.object).substring(0, 200) + "..."
    );

    return {
      generated_content: result.object as PRDContent,
      tokens_used: result.usage?.totalTokens || 0,
      input_tokens: result.usage?.promptTokens || 0,
      output_tokens: result.usage?.completionTokens || 0,
      model_used: modelName,
      generation_time: generationTime,
      langfuseData,
    };
  } catch (error) {
    const endTime = Date.now();
    const generationTime = (endTime - startTime) / 1000;

    // Track error metrics
    await trackCustomEvent(
      "prd_generation_error",
      {
        prdId,
        provider: request.provider?.type || "ollama",
        model: modelName,
        error: error instanceof Error ? error.message : "Unknown error",
        generationTime,
        userId,
      },
      userId,
      effectiveSessionId
    );

    // Mark generation as failed in Langfuse
    if (generation) {
      generation.end({
        output: null,
        level: "ERROR",
        statusMessage: error instanceof Error ? error.message : "Unknown error",
        metadata: {
          generationTime,
          errorType:
            error instanceof Error ? error.constructor.name : "Unknown",
          failedAt: new Date().toISOString(),
        },
      });
    }

    console.error("AI generation failed:", error);
    throw new Error(
      `AI generation failed: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
};

// Enhanced critique function with similar improvements
export const critiquePRD = async (
  request: CritiqueRequest,
  prdId?: string,
  userId?: string,
  sessionId?: string
): Promise<CritiqueResponse & { langfuseData?: LangfuseTraceData }> => {
  const startTime = Date.now();

  // Generate session ID if not provided
  const effectiveSessionId = sessionId || generateSessionId(userId);

  // Track the critique request
  await trackCustomEvent(
    "prd_critique_started",
    {
      prdId,
      provider: request.provider?.type || "ollama",
      model: request.model,
      depth: request.depth,
      focusAreas: request.focus_areas,
      hasCustomCriteria: !!request.custom_criteria,
      includeSuggestions: request.include_suggestions,
      contentLength: request.existing_content?.length || 0,
    },
    userId,
    effectiveSessionId
  );

  // Create Langfuse trace with enhanced metadata
  let trace = null;
  let generation = null;
  let langfuseData: LangfuseTraceData | undefined;

  if (isLangfuseEnabled() && prdId) {
    trace = await createCritiqueTrace(prdId, userId, effectiveSessionId, {
      provider: request.provider?.type || "ollama",
      model: request.model,
      depth: request.depth,
      focusAreas: request.focus_areas,
      contentLength: request.existing_content?.length || 0,
      hasCustomCriteria: !!request.custom_criteria,
    });

    if (trace) {
      langfuseData = {
        traceId: trace.id,
        generationId: "", // Will be set after generation
        userId,
        sessionId: effectiveSessionId,
        metadata: { prdId },
      };
    }
  }

  // Get the appropriate model based on provider configuration
  const { model, modelName } = getAIModel(request.provider, request.model);

  try {
    const systemPrompt = await getCritiqueSystemPrompt(request);
    const userPrompt = await getCritiqueUserPrompt(request);

    // Start Langfuse generation tracking with enhanced metadata
    if (trace) {
      generation = trace.generation({
        name: "prd-critique-generation",
        model: modelName,
        input: {
          system: systemPrompt,
          prompt: userPrompt,
          focusAreas: request.focus_areas,
          depth: request.depth,
          includeSuggestions: request.include_suggestions,
        },
        metadata: {
          provider: request.provider?.type || "ollama",
          model: modelName,
          temperature: 0.3,
          maxTokens: 2000,
          systemPromptLength: systemPrompt.length,
          userPromptLength: userPrompt.length,
          contentLength: request.existing_content?.length || 0,
          requestTimestamp: new Date().toISOString(),
        },
      });

      if (langfuseData) {
        langfuseData.generationId = generation.id;
      }
    }

    console.log("Critiquing PRD with AI model:", modelName);
    console.log("Provider:", request.provider?.type || "ollama (default)");

    const result = await generateObject({
      model,
      system: systemPrompt,
      prompt: userPrompt,
      maxTokens: 2000,
      temperature: 0.3,
      schema: z.object({
        summary: z.string(),
      }),
    });

    const endTime = Date.now();
    const generationTime = (endTime - startTime) / 1000;

    // Track performance metrics
    await trackPerformanceMetric("critique_time", generationTime, "seconds", {
      provider: request.provider?.type || "ollama",
      model: modelName,
      inputTokens: result.usage?.promptTokens || 0,
      outputTokens: result.usage?.completionTokens || 0,
      prdId,
      userId,
    });

    // Update Langfuse generation with results
    if (generation) {
      generation.end({
        output: result.object,
        usage: {
          input: result.usage?.promptTokens || 0,
          output: result.usage?.completionTokens || 0,
          total: result.usage?.totalTokens || 0,
        },
        metadata: {
          generationTime,
          outputLength: JSON.stringify(result.object).length,
          completedAt: new Date().toISOString(),
        },
      });
    }

    // Track successful critique
    await trackCustomEvent(
      "prd_critique_completed",
      {
        prdId,
        provider: request.provider?.type || "ollama",
        model: modelName,
        generationTime,
        inputTokens: result.usage?.promptTokens || 0,
        outputTokens: result.usage?.completionTokens || 0,
        outputLength: JSON.stringify(result.object).length,
        success: true,
      },
      userId,
      effectiveSessionId
    );

    console.log("AI critique completed in", generationTime, "seconds");
    console.log("Generated critique:", JSON.stringify(result.object, null, 2));

    return {
      summary: result.object.summary,
      input_tokens: result.usage?.promptTokens || 0,
      output_tokens: result.usage?.completionTokens || 0,
      tokens_used: result.usage?.totalTokens || 0,
      model_used: modelName,
      generation_time: generationTime,
      langfuseData,
    } as CritiqueResponse & { langfuseData?: LangfuseTraceData };
  } catch (error) {
    const endTime = Date.now();
    const generationTime = (endTime - startTime) / 1000;

    // Track error metrics
    await trackCustomEvent(
      "prd_critique_error",
      {
        prdId,
        provider: request.provider?.type || "ollama",
        model: modelName,
        error: error instanceof Error ? error.message : "Unknown error",
        generationTime,
        userId,
      },
      userId,
      effectiveSessionId
    );

    // Mark generation as failed in Langfuse
    if (generation) {
      generation.end({
        output: null,
        level: "ERROR",
        statusMessage: error instanceof Error ? error.message : "Unknown error",
        metadata: {
          generationTime,
          errorType:
            error instanceof Error ? error.constructor.name : "Unknown",
          failedAt: new Date().toISOString(),
        },
      });
    }

    console.error("AI critique failed:", error);
    throw new Error(
      `AI critique failed: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
};

// Test provider connection with a simple AI request
export const testProvider = async (
  provider: LLMProviderConfig,
  modelId?: string
): Promise<{
  success: boolean;
  provider: string;
  model: string;
  response_time: number;
  test_content: string;
  error?: string;
}> => {
  const startTime = Date.now();

  try {
    // Get the appropriate model based on provider configuration
    const { model, modelName } = getAIModel(provider, modelId);

    console.log("Testing provider:", provider.type);
    console.log("Testing model:", modelName);

    // Simple test prompt to verify the provider is working
    const result = await generateObject({
      model: model,
      prompt: "Say 'Hello from AI provider test!' in exactly those words.",
      maxTokens: 50,
      temperature: 0.1, // Very low temperature for consistent response
      schema: z.object({
        greeting: z.string(),
      }),
    });

    const endTime = Date.now();
    const responseTime = (endTime - startTime) / 1000;

    console.log("Provider test completed in", responseTime, "seconds");
    console.log("Test response:", result.object.greeting);

    return {
      success: true,
      provider: provider.type || "unknown",
      model: modelName,
      response_time: responseTime,
      test_content: result.object.greeting,
    };
  } catch (error) {
    const endTime = Date.now();
    const responseTime = (endTime - startTime) / 1000;

    console.error("Provider test failed:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    return {
      success: false,
      provider: provider.type || "unknown",
      model: modelId || "unknown",
      response_time: responseTime,
      test_content: "",
      error: errorMessage,
    };
  }
};

// Export service object with all functions
export const aiService = {
  generateContent,
  critiquePRD,
  testProvider,
};
