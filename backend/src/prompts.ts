import { CritiqueRequest, GenerateContentRequest } from "./generated";
import { getLangfuseClient } from "./langfuseService";

export interface PromptConfig {
  tone: string;
  length: string;
}

export interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
  timestamp?: string;
}

// Tone-specific additions - these will form the content for the {{toneInstructions}} variable
const TONE_INSTRUCTIONS_MAP = {
  technical: "\n- Include technical specifications and implementation details",
  executive: "\n- Focus on business impact and strategic objectives",
  casual:
    "\n- Use approachable, conversational language while maintaining clarity",
  professional: "", // No additional instructions for professional tone
} as const;

// Async function to get and compile the interactive system prompt from Langfuse
export const getInteractiveSystemPrompt = async (
  request: GenerateContentRequest
): Promise<string> => {
  const langfuse = getLangfuseClient();
  const { tone = "professional", length = "standard" } = request;

  try {
    const prompt = await langfuse.getPrompt("interactive-prd-system-prompt");
    const compiledPrompt = prompt.compile({
      length: length,
      toneInstructions: TONE_INSTRUCTIONS_MAP[tone] || "",
    });
    // Langfuse compile method returns string for text prompts
    return compiledPrompt as string;
  } catch (error) {
    console.error(
      "Failed to fetch or compile 'interactive-prd-system-prompt' from Langfuse:",
      error
    );
    // Fallback or rethrow, for now, rethrow
    throw error;
  }
};

// Async function to get and compile the critique system prompt from Langfuse
export const getCritiqueSystemPrompt = async (
  request: CritiqueRequest
): Promise<string> => {
  const langfuse = getLangfuseClient();
  const { depth = "detailed", focus_areas = [], custom_criteria } = request;

  let analysisDepthInstructions = "";
  if (depth === "overview") {
    analysisDepthInstructions = `\n\n## Analysis Depth: Overview
- Focus on high-level assessment
- Identify 3-5 key areas for improvement
- Provide concise, actionable feedback
- Limit detailed analysis to critical issues`;
  } else if (depth === "comprehensive") {
    analysisDepthInstructions = `\n\n## Analysis Depth: Comprehensive
- Conduct thorough section-by-section analysis
- Provide detailed examples and suggestions
- Include best practice recommendations
- Cover all aspects of PRD quality
- Provide extensive action items and next steps`;
  } else {
    analysisDepthInstructions = `\n\n## Analysis Depth: Detailed
- Provide balanced, thorough assessment
- Focus on most impactful improvements
- Include specific examples where helpful
- Balance breadth and depth of analysis`;
  }

  let focusAreasInstructions = "";
  if (focus_areas.length > 0) {
    focusAreasInstructions = `\n\n## Focus Areas:
Pay special attention to these areas during your evaluation:
${focus_areas.map((area) => `- ${area}`).join("\n")}`;
  }

  const customCriteriaInstructions = custom_criteria
    ? `\n\n## Custom Evaluation Criteria:\n${custom_criteria}`
    : "";

  try {
    const prompt = await langfuse.getPrompt("prd-critique-system-prompt");
    const compiledPrompt = prompt.compile({
      analysisDepthInstructions,
      focusAreasInstructions,
      customCriteriaInstructions,
    });
    return compiledPrompt as string;
  } catch (error) {
    console.error(
      "Failed to fetch or compile 'prd-critique-system-prompt' from Langfuse:",
      error
    );
    throw error;
  }
};

// Async function to get and compile the critique user prompt from Langfuse
export const getCritiqueUserPrompt = async (
  request: CritiqueRequest
): Promise<string> => {
  const langfuse = getLangfuseClient();
  const { include_suggestions = true, existing_content } = request;

  const suggestionInstructions = include_suggestions
    ? "Include specific examples and suggestions for improvement in each area."
    : "Focus on identifying issues without providing detailed suggestions.";

  try {
    const prompt = await langfuse.getPrompt("prd-critique-user-prompt-template");
    const compiledPrompt = prompt.compile({
      existingPrdContent: existing_content,
      suggestionInstructions,
    });
    return compiledPrompt as string;
  } catch (error) {
    console.error(
      "Failed to fetch or compile 'prd-critique-user-prompt-template' from Langfuse:",
      error
    );
    throw error;
  }
};
