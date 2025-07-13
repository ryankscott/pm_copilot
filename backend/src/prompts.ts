import { CritiqueRequest, GenerateContentRequest } from "./generated";
import { langfuse } from "./langfuse";

export interface PromptConfig {
  tone: string;
  length: string;
}

export interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
  timestamp?: string;
}

// This map provides the content for the {{toneInstructions}} variable in the Langfuse prompt.
const TONE_INSTRUCTIONS_MAP = {
  technical: "
- Include technical specifications and implementation details",
  executive: "
- Focus on business impact and strategic objectives",
  casual:
    "
- Use approachable, conversational language while maintaining clarity",
  professional: "", // No additional instructions for professional tone, empty string.
} as const;

/**
 * Fetches and compiles the interactive system prompt for PRD generation from Langfuse.
 * @param request The content generation request, containing tone and length preferences.
 * @returns The compiled system prompt string.
 */
export const getInteractiveSystemPrompt = async (
  request: GenerateContentRequest
): Promise<string> => {
  const { tone = "professional", length = "standard" } = request;

  try {
    // Fetch the raw prompt template from Langfuse by its unique name
    const prompt = await langfuse.getPrompt("interactive-prd-system-prompt");

    // Compile the prompt with dynamic variables
    const compiledPrompt = prompt.compile({
      length: length,
      toneInstructions: TONE_INSTRUCTIONS_MAP[tone] || "", // Fallback for safety
    });

    // The compile method for text prompts returns a string
    return compiledPrompt as string;
  } catch (error) {
    console.error(
      "Failed to fetch or compile 'interactive-prd-system-prompt' from Langfuse:",
      error
    );
    // Fallback to a very basic default or rethrow, depending on desired resilience.
    // Rethrowing makes the error visible and forces handling.
    throw new Error(
      `Failed to get interactive system prompt: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
};

/**
 * Fetches and compiles the system prompt for PRD critique from Langfuse.
 * @param request The critique request, containing depth, focus areas, and custom criteria.
 * @returns The compiled system prompt string.
 */
export const getCritiqueSystemPrompt = async (
  request: CritiqueRequest
): Promise<string> => {
  const { include_suggestions = true } = request;

  // Prepare content for the {{suggestionInstructions}} variable
  const suggestionInstructions = include_suggestions
    ? "Include specific examples and suggestions for improvement in each area."
    : "Focus on identifying issues without providing detailed suggestions.";

  try {
    const prompt = await langfuse.getPrompt(
      "prd-critique-system-prompt-template"
    );
    const compiledPrompt = prompt.compile({
      suggestionInstructions,
    });
    return compiledPrompt as string;
  } catch (error) {
    console.error(
      "Failed to fetch or compile 'prd-critique-system-prompt-template' from Langfuse:",
      error
    );
    throw new Error(
      `Failed to get critique system prompt: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
};

export const getCritiqueUserPrompt = async (
  request: CritiqueRequest
): Promise<string> => {
  const { existing_content } = request;
  try {
    const prompt = await langfuse.getPrompt("prd-critique-user-prompt");
    const compiledPrompt = prompt.compile({
      existingPrdContent: existing_content || "",
    });
    return compiledPrompt as string;
  } catch (error) {
    console.error(
      "Failed to fetch or compile 'prd-critique-user-prompt' from Langfuse:",
      error
    );
    throw new Error(
      `Failed to get critique user prompt: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
};
