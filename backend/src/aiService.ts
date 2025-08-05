import { createOpenAI } from "@ai-sdk/openai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOllama } from "ollama-ai-provider";
import { generateObject, CoreMessage, generateText } from "ai";
import { z } from "zod";
import "dotenv/config";
import {
  getInteractiveSystemPrompt,
  getCritiqueSystemPrompt,
  getCritiqueUserPrompt,
  getQuestionSystemPrompt,
  getQuestionUserPrompt,
} from "./prompts";
import {
  CritiqueRequest,
  GenerateContentRequest,
  GenerateContentResponse,
  CritiqueResponse,
  QuestionRequest,
  QuestionResponse,
  LLMProviderConfig,
  PRDContent,
  Template,
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
  sessionId?: string,
  template?: Template | null
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
    let systemPrompt = await getInteractiveSystemPrompt(request);

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

    // Build the tool description based on template structure
    let toolDescription =
      "Generate the final PRD content following the template structure. Call this tool when you have completed the PRD and are ready to output the final content.";

    if (template && template.sections && template.sections.length > 0) {
      const requiredSections = template.sections
        .filter((section) => section.required)
        .map((section) => `"${section.name}"`)
        .join(", ");

      const optionalSections = template.sections
        .filter((section) => !section.required)
        .map((section) => `"${section.name}"`)
        .join(", ");

      const allSections = template.sections
        .map((section) => `"${section.name}": ${section.description}`)
        .join("; ");

      toolDescription = `Generate the final PRD content following the template structure. The output must include a title (string), optional summary (string), and sections array with objects containing title and content fields. Required sections: ${
        requiredSections || "none"
      }. ${
        optionalSections ? `Optional sections: ${optionalSections}. ` : ""
      }Section descriptions: ${allSections}. Call this tool when you have completed the PRD and are ready to output the final content.`;
    }

    const result = await generateText({
      model: model,
      system: systemPrompt,
      maxTokens: 10000,
      temperature: 0.7,
      prompt: messages.length === 0 ? request.prompt : undefined,
      messages: messages.length > 0 ? messages : undefined,
      tools: {
        generatePRD: {
          description: toolDescription,
          parameters: z.object({
            title: z.string(),
            summary: z.string().optional(),
            sections: z.array(
              z.object({
                title: z.string(),
                content: z.string(),
              })
            ),
          }),
        },
      },
      toolChoice: "auto",
    });

    const endTime = Date.now();
    const generationTime = (endTime - startTime) / 1000;

    // Extract the PRD content from tool calls or use text response
    let generatedContent: PRDContent | string = "";
    let isComplete = false;

    if (result.toolCalls && result.toolCalls.length > 0) {
      // Find the generatePRD tool call
      const prdToolCall = result.toolCalls.find(
        (call) => call.toolName === "generatePRD"
      );
      if (prdToolCall && prdToolCall.args) {
        generatedContent = prdToolCall.args as PRDContent;
        isComplete = true; // PRD generation is complete
      }
    } else {
      // No tool call made, this is conversational response
      generatedContent = result.text;
      isComplete = false; // Still in conversation mode
    }

    const outputLength = JSON.stringify(generatedContent).length;

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
        output: generatedContent,
        usage: {
          input: result.usage?.promptTokens || 0,
          output: result.usage?.completionTokens || 0,
          total: result.usage?.totalTokens || 0,
        },
        metadata: {
          generationTime,
          outputLength,
          completedAt: new Date().toISOString(),
          toolCallsUsed: result.toolCalls?.length || 0,
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
        outputLength,
        success: true,
        toolCallsUsed: result.toolCalls?.length || 0,
        isComplete,
        responseType: isComplete ? "prd" : "conversation",
      },
      userId,
      effectiveSessionId
    );

    console.log("AI generation completed in", generationTime, "seconds");
    console.log("Generated content length:", outputLength);
    console.log("Is PRD complete:", isComplete);
    console.log(
      "Generated content preview:",
      JSON.stringify(generatedContent).substring(0, 200) + "..."
    );

    if (result.toolCalls && result.toolCalls.length > 0) {
      console.log(
        "Tool calls made:",
        result.toolCalls.map((call) => call.toolName)
      );
    } else {
      console.log("No tool calls made - conversational response");
    }

    return {
      generated_content: generatedContent,
      tokens_used: result.usage?.totalTokens || 0,
      input_tokens: result.usage?.promptTokens || 0,
      output_tokens: result.usage?.completionTokens || 0,
      model_used: modelName,
      generation_time: generationTime,
      is_complete: isComplete,
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
  prdContent: string,
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
      contentLength: prdContent?.length || 0,
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
      contentLength: prdContent?.length || 0,
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
    const userPrompt = await getCritiqueUserPrompt(request, prdContent);

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
          contentLength: prdContent?.length || 0,
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

export const answerQuestion = async (
  request: QuestionRequest,
  prdContent: string,
  prdId: string,
  userId: string,
  sessionId: string
): Promise<QuestionResponse & { langfuseData?: LangfuseTraceData }> => {
  const { model, modelName } = getAIModel(request.provider, request.model);

  let traceData: LangfuseTraceData | undefined;

  try {
    // Create Langfuse trace if enabled
    if (isLangfuseEnabled()) {
      const trace = await createPRDTrace(prdId, userId, sessionId, {
        question: request.question,
        context: request.context,
        provider: request.provider?.type,
        model: modelName,
      });
      if (trace) {
        traceData = {
          traceId: trace.id,
          generationId: "", // Will be set later if needed
        };
      }
    }

    // Track custom event
    await trackCustomEvent(
      "prd_question_started",
      {
        prdId,
        question: request.question,
        provider: request.provider?.type,
        model: modelName,
      },
      userId,
      sessionId
    );

    const startTime = Date.now();

    // Get system and user prompts
    const systemPrompt = await getQuestionSystemPrompt(request);
    const userPrompt = await getQuestionUserPrompt(request, prdContent);

    // Prepare conversation history
    const messages: CoreMessage[] = [
      {
        role: "system",
        content: systemPrompt,
      },
    ];

    // Add conversation history if provided
    if (request.conversation_history) {
      for (const msg of request.conversation_history) {
        messages.push({
          role: msg.role as "user" | "assistant",
          content: msg.content as string,
        });
      }
    }

    // Add the current question
    messages.push({
      role: "user",
      content: userPrompt,
    });

    // Generate response using AI SDK
    const result = await generateObject({
      model,
      messages,
      schema: z.object({
        answer: z.string().describe("The answer to the question about the PRD"),
        related_sections: z
          .array(z.string())
          .optional()
          .describe(
            "Sections of the PRD that are most relevant to the question"
          ),
        follow_up_questions: z
          .array(z.string())
          .optional()
          .describe("Suggested follow-up questions"),
      }),
      temperature: 0.7,
      maxTokens: 2000,
    });

    const endTime = Date.now();
    const generationTime = (endTime - startTime) / 1000;

    // Track performance metric
    await trackPerformanceMetric(
      "question_generation_time",
      generationTime,
      "seconds",
      {
        provider: request.provider?.type,
        model: modelName,
        prdId,
        question_length: request.question.length,
        userId,
        sessionId,
      }
    );

    // Track custom event for completion
    await trackCustomEvent(
      "prd_question_completed",
      {
        prdId,
        question: request.question,
        provider: request.provider?.type,
        model: modelName,
        generation_time: generationTime,
        input_tokens: result.usage?.promptTokens,
        output_tokens: result.usage?.completionTokens,
      },
      userId,
      sessionId
    );

    const response: QuestionResponse & { langfuseData?: LangfuseTraceData } = {
      answer: result.object.answer,
      related_sections: result.object.related_sections || [],
      follow_up_questions: result.object.follow_up_questions || [],
      input_tokens: result.usage?.promptTokens,
      output_tokens: result.usage?.completionTokens,
      tokens_used: result.usage?.totalTokens,
      generation_time: generationTime,
      langfuseData: traceData,
    };

    return response;
  } catch (error) {
    console.error("Question answering failed:", error);

    // Track error event
    await trackCustomEvent(
      "prd_question_failed",
      {
        prdId,
        question: request.question,
        provider: request.provider?.type,
        model: modelName,
        error: error instanceof Error ? error.message : String(error),
      },
      userId,
      sessionId
    );

    throw error;
  }
};

// Export service object with all functions
export const aiService = {
  generateContent,
  critiquePRD,
  answerQuestion,
  testProvider,
};
