import { createOpenAI } from "@ai-sdk/openai";
import { generateText } from "ai";
import "dotenv/config";

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
}

export interface AIGenerationResponse {
  content: string;
  tokensUsed: number;
  modelUsed: string;
  generationTime: number;
}

// Configuration
const getModel = (): string => process.env.OLLAMA_MODEL || "llama3.2:latest";

// Helper function to build system prompt
const buildSystemPrompt = (request: AIGenerationRequest): string => {
  const { tone = "professional", length = "standard" } = request;

  let systemPrompt = `You are an expert Product Manager AI assistant specializing in creating high-quality Product Requirements Documents (PRDs). 

Your role is to help generate clear, comprehensive, and well-structured PRD content based on user prompts.

Tone: ${tone}
Length: ${length}

Guidelines:
- Write in a ${tone} tone
- Provide ${length} level of detail
- Use clear, actionable language
- Structure content with proper headings and bullet points when appropriate
- Focus on practical, implementable requirements
- Consider user experience, technical feasibility, and business objectives`;

  if (tone === "technical") {
    systemPrompt +=
      "\n- Include technical specifications and implementation details";
  } else if (tone === "executive") {
    systemPrompt += "\n- Focus on business impact and strategic objectives";
  } else if (tone === "casual") {
    systemPrompt +=
      "\n- Use approachable, conversational language while maintaining clarity";
  }

  return systemPrompt;
};

// Helper function to build user prompt
const buildUserPrompt = (request: AIGenerationRequest): string => {
  let prompt = `Please generate PRD content based on this request: "${request.prompt}"`;

  if (request.context) {
    prompt += `\n\nAdditional context: ${request.context}`;
  }

  if (request.existingContent) {
    prompt += `\n\nExisting content to build upon:\n${request.existingContent}`;
  }

  return prompt;
};

// Main generation function
export const generateContent = async (
  request: AIGenerationRequest
): Promise<AIGenerationResponse> => {
  const startTime = Date.now();
  const model = getModel();

  try {
    // Build the system prompt based on request parameters
    const systemPrompt = buildSystemPrompt(request);

    // Build the user prompt
    const userPrompt = buildUserPrompt(request);

    console.log("Generating content with AI model:", model);
    console.log("System prompt:", systemPrompt);
    console.log("User prompt:", userPrompt);

    const result = await generateText({
      model: ollama(model),
      system: systemPrompt,
      prompt: userPrompt,
      maxTokens: 1000,
      temperature: 0.7,
    });

    const endTime = Date.now();
    const generationTime = (endTime - startTime) / 1000;

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

// Export service object with the same interface for backward compatibility
export const aiService = {
  generateContent,
};
