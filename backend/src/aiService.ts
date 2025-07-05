import { createOpenAI } from "@ai-sdk/openai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOllama } from "ollama-ai-provider";
import { generateText } from "ai";
import "dotenv/config";
import {
  buildSystemPrompt,
  buildCritiqueSystemPrompt,
  buildCritiqueUserPrompt,
} from "./prompts";
import {
  CritiqueRequest,
  GenerateContentRequest,
  GenerateContentResponse,
  CritiqueResponse,
  LLMProviderConfig,
} from "./generated";

// Configure Ollama using the dedicated provider
const ollama = createOllama({
  baseURL: "http://localhost:11434/api",
});

// Helper function to get the appropriate AI model based on provider configuration
const getAIModel = (provider?: LLMProviderConfig, modelId?: string) => {
  // Default fallback
  const defaultModel = "llama3.2:latest";

  if (!provider || !provider.isConfigured) {
    console.log("No provider configured, using Ollama default:", defaultModel);
    return { model: ollama(defaultModel), modelName: defaultModel };
  }

  const selectedModel = modelId || defaultModel;

  switch (provider.type) {
    case "openai":
      if (!provider.apiKey) {
        console.warn("OpenAI API key not provided, falling back to Ollama");
        return { model: ollama(defaultModel), modelName: defaultModel };
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
        return { model: ollama(defaultModel), modelName: defaultModel };
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
        return { model: ollama(defaultModel), modelName: defaultModel };
      }
      // Create Google instance with provided API key
      const googleWithKey = createGoogleGenerativeAI({
        apiKey: provider.apiKey,
      });
      console.log("Using Google model:", selectedModel);
      return { model: googleWithKey(selectedModel), modelName: selectedModel };

    case "ollama":
      return { model: ollama(selectedModel), modelName: selectedModel };

    default:
      console.log("Unknown provider type, using Ollama default:", defaultModel);
      return { model: ollama(defaultModel), modelName: defaultModel };
  }
};

export const generateContent = async (
  request: GenerateContentRequest
): Promise<GenerateContentResponse> => {
  const startTime = Date.now();

  // Get the appropriate model based on provider configuration
  const { model, modelName } = getAIModel(request.provider, request.model);

  try {
    // Build the system prompt based on request parameters
    const systemPrompt = buildSystemPrompt(request);

    console.log("Generating content with AI model:", modelName);
    console.log("Provider:", request.provider?.type || "ollama (default)");
    console.log("Request prompt:", request.prompt);
    console.log(
      "Conversation history length:",
      request.conversation_history?.length || 0
    );

    // Add the current user prompt as the latest message
    console.log(
      "Total messages being sent to AI:",
      request.conversation_history?.length
    );

    const result = await generateText({
      model: model,
      system: systemPrompt,
      maxTokens: 1000,
      temperature: 0.7,
      prompt: request.prompt,
      messages:
        request?.conversation_history &&
        request?.conversation_history?.length > 0
          ? request.conversation_history
          : undefined,
    });

    const endTime = Date.now();
    const generationTime = (endTime - startTime) / 1000;

    console.log("AI generation completed in", generationTime, "seconds");
    console.log("Generated content length:", result.text.length);
    console.log(
      "Generated content preview:",
      result.text.substring(0, 200) + "..."
    );

    return {
      generated_content: result.text,
      tokens_used: result.usage?.totalTokens || 0,
      input_tokens: result.usage?.promptTokens || 0,
      output_tokens: result.usage?.completionTokens || 0,
      model_used: modelName,
      generation_time: generationTime,
    };
  } catch (error) {
    console.error("AI generation failed:", error);
    throw new Error(
      `AI generation failed: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
};

// Main critique function
export const critiquePRD = async (
  request: CritiqueRequest
): Promise<CritiqueResponse> => {
  const startTime = Date.now();

  // Get the appropriate model based on provider configuration
  const { model, modelName } = getAIModel(request.provider, request.model);

  try {
    const systemPrompt = buildCritiqueSystemPrompt(request);
    const userPrompt = buildCritiqueUserPrompt(request);

    console.log("Critiquing PRD with AI model:", modelName);
    console.log("Provider:", request.provider?.type || "ollama (default)");

    const result = await generateText({
      model,
      system: systemPrompt,
      prompt: userPrompt,
      maxTokens: 2000,
      temperature: 0.3,
    });
    console.log({ result });

    const endTime = Date.now();
    const generationTime = (endTime - startTime) / 1000;

    console.log("AI critique completed in", generationTime, "seconds");
    console.log("Generated critique:", JSON.stringify(result.text, null, 2));

    return {
      summary: result.text,
      input_tokens: result.usage?.promptTokens || 0,
      output_tokens: result.usage?.completionTokens || 0,
      tokens_used: result.usage?.totalTokens || 0,
      model_used: modelName,
      generation_time: generationTime,
    } as CritiqueResponse;
  } catch (error) {
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
    const result = await generateText({
      model: model,
      prompt: "Say 'Hello from AI provider test!' in exactly those words.",
      maxTokens: 50,
      temperature: 0.1, // Very low temperature for consistent response
    });

    const endTime = Date.now();
    const responseTime = (endTime - startTime) / 1000;

    console.log("Provider test completed in", responseTime, "seconds");
    console.log("Test response:", result.text);

    return {
      success: true,
      provider: provider.type || "unknown",
      model: modelName,
      response_time: responseTime,
      test_content: result.text,
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
