import { createOpenAI } from "@ai-sdk/openai";
import { generateText } from "ai";
import "dotenv/config";
import {
  buildSystemPrompt,
  buildUserPrompt,
  buildCritiqueSystemPrompt,
  buildCritiqueUserPrompt,
  ConversationMessage,
  CritiqueRequest,
  CritiqueResponse,
} from "./prompts";

// Configure Ollama as an OpenAI-compatible provider
const ollama = createOpenAI({
  baseURL: process.env.OLLAMA_BASE_URL || "http://localhost:11434/v1",
  apiKey: "ollama", // Ollama doesn't require a real API key
});

export interface AIGenerationRequest {
  prompt: string;
  context?: string;
  existingContent?: string;
  tone?: "professional" | "casual" | "technical" | "executive";
  length?: "brief" | "standard" | "comprehensive";
  conversationHistory?: ConversationMessage[];
}

export interface AIGenerationResponse {
  content: string;
  tokensUsed: number;
  modelUsed: string;
  generationTime: number;
}

// Configuration
const getModel = (): string => process.env.OLLAMA_MODEL || "llama3.2:latest";

// Main generation function
export const generateContent = async (
  request: AIGenerationRequest
): Promise<AIGenerationResponse> => {
  const startTime = Date.now();
  const model = getModel();

  try {
    // Build the system prompt based on request parameters
    const systemPrompt = buildSystemPrompt(request);

    console.log("Generating content with AI model:", model);
    console.log("Request prompt:", request.prompt);
    console.log(
      "Conversation history length:",
      request.conversationHistory?.length || 0
    );

    // Include conversation history as context
    const messages = [];
    if (request.conversationHistory) {
      // Add conversation history as context
      for (const msg of request.conversationHistory) {
        messages.push({
          role:
            msg.role === "user" ? ("user" as const) : ("assistant" as const),
          content: msg.content,
        });
      }
    }

    // Add the current user prompt as the latest message
    const userPrompt = buildUserPrompt(
      request,
      request.conversationHistory || [],
      request.existingContent
    );
    console.log("Built user prompt:", userPrompt);

    messages.push({
      role: "user" as const,
      content: userPrompt,
    });

    console.log("Total messages being sent to AI:", messages.length);

    const result = await generateText({
      model: ollama(model),
      system: systemPrompt,
      maxTokens: 1000,
      temperature: 0.7,
      messages: messages,
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
      content: result.text,
      tokensUsed: result.usage?.totalTokens || 0,
      modelUsed: model,
      generationTime,
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
  prdContent: string,
  request: CritiqueRequest
): Promise<CritiqueResponse> => {
  const startTime = Date.now();
  const model = getModel();

  try {
    const systemPrompt = buildCritiqueSystemPrompt(request);
    const userPrompt = buildCritiqueUserPrompt(prdContent, request);

    console.log("Critiquing PRD with AI model:", model);

    const result = await generateText({
      model: ollama(model),
      system: systemPrompt,
      prompt: userPrompt,
      maxTokens: 2000, // More tokens for detailed critique
      temperature: 0.3, // Lower temperature for more consistent critique
    });

    const endTime = Date.now();
    const generationTime = (endTime - startTime) / 1000;

    console.log("AI critique completed in", generationTime, "seconds");

    // Try to parse the JSON response
    let critiqueData: CritiqueResponse;
    try {
      critiqueData = JSON.parse(result.text);
    } catch (parseError) {
      console.error("Failed to parse critique JSON, using fallback format");
      // Fallback to a structured response if JSON parsing fails
      critiqueData = {
        overall_score: 7.0,
        strengths: ["Critique generated successfully"],
        weaknesses: ["AI response format needs improvement"],
        missing_sections: [],
        suggestions: [
          {
            category: "content",
            priority: "medium",
            title: "Response Format",
            description: "The AI response should be properly formatted as JSON",
            example: "Ensure the critique follows the expected schema",
          },
        ],
        detailed_feedback: { general: result.text },
        action_items: ["Review and improve AI response formatting"],
        critique_summary: result.text.substring(0, 500) + "...",
      };
    }

    return critiqueData;
  } catch (error) {
    console.error("AI critique failed:", error);
    throw new Error(
      `AI critique failed: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
};

// Export service object with both functions
export const aiService = {
  generateContent,
  critiquePRD,
};
