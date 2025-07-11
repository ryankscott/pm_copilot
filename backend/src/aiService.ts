import { createOpenAI } from "@ai-sdk/openai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOllama } from "ollama-ai-provider";
import { generateText, CoreMessage } from "ai";
import "dotenv/config";
// Updated imports from prompts.ts - these will be new async functions
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
} from "./generated";

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
  request: GenerateContentRequest
): Promise<GenerateContentResponse> => {
  const startTime = Date.now();

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

    const result = await generateText({
      model: model,
      system: systemPrompt,
      maxTokens: 10000,
      temperature: 0.7,
      prompt: messages.length === 0 ? request.prompt : undefined,
      messages: messages.length > 0 ? messages : undefined,
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
    const systemPrompt = await getCritiqueSystemPrompt(request);
    const userPrompt = await getCritiqueUserPrompt(request);

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
