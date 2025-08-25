import {
  CritiqueRequest,
  GenerateContentRequest,
  QuestionRequest,
  UserContext,
} from "./generated";
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
  technical: `
- Include technical specifications and implementation details`,
  executive: `
- Focus on business impact and strategic objectives`,
  casual: `
- Use approachable, conversational language while maintaining clarity`,
  professional: "", // No additional instructions for professional tone, empty string.
} as const;

/**
 * Formats user context into a structured string for use in prompts.
 * @param userContext The user context information.
 * @returns A formatted string with user context or empty string if no context.
 */
const formatUserContext = (userContext?: UserContext): string => {
  if (!userContext) return "";

  const sections = [];

  // Company context
  if (
    userContext.company &&
    Object.values(userContext.company).some((v) => v)
  ) {
    const company = userContext.company;
    const companyInfo = [];
    if (company.name) companyInfo.push(`Company: ${company.name}`);
    if (company.industry) companyInfo.push(`Industry: ${company.industry}`);
    if (company.size) companyInfo.push(`Size: ${company.size}`);
    if (company.business_strategy)
      companyInfo.push(`Business Strategy: ${company.business_strategy}`);
    if (company.product_strategy)
      companyInfo.push(`Product Strategy: ${company.product_strategy}`);
    if (company.okrs) companyInfo.push(`Company OKRs: ${company.okrs}`);

    if (companyInfo.length > 0) {
      sections.push(`Company Context:\n${companyInfo.join("\n")}`);
    }
  }

  // Product context
  if (
    userContext.product &&
    Object.values(userContext.product).some((v) => v)
  ) {
    const product = userContext.product;
    const productInfo = [];
    if (product.name) productInfo.push(`Product: ${product.name}`);
    if (product.description)
      productInfo.push(`Description: ${product.description}`);
    if (product.current_stage)
      productInfo.push(`Stage: ${product.current_stage}`);
    if (product.target_market)
      productInfo.push(`Target Market: ${product.target_market}`);
    if (product.monetization_strategy)
      productInfo.push(`Monetization: ${product.monetization_strategy}`);
    if (product.competitors)
      productInfo.push(`Competitors: ${product.competitors}`);

    if (productInfo.length > 0) {
      sections.push(`Product Context:\n${productInfo.join("\n")}`);
    }
  }

  // Team context
  if (userContext.team && Object.values(userContext.team).some((v) => v)) {
    const team = userContext.team;
    const teamInfo = [];
    if (team.name) teamInfo.push(`Team: ${team.name}`);
    if (team.role) teamInfo.push(`Your Role: ${team.role}`);
    if (team.size) teamInfo.push(`Team Size: ${team.size}`);
    if (team.structure) teamInfo.push(`Structure: ${team.structure}`);
    if (team.responsibilities)
      teamInfo.push(`Responsibilities: ${team.responsibilities}`);
    if (team.okrs) teamInfo.push(`Team OKRs: ${team.okrs}`);

    if (teamInfo.length > 0) {
      sections.push(`Team Context:\n${teamInfo.join("\n")}`);
    }
  }

  return sections.length > 0
    ? `\n\nUser Context:\n${sections.join("\n\n")}`
    : "";
};

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
    const prompt = await langfuse.getPrompt(
      "interactive-prd-system-prompt-template"
    );

    // Format user context for inclusion in the prompt
    const userContextString = formatUserContext(request.user_context);

    // Compile the prompt with dynamic variables
    const compiledPrompt = prompt.compile({
      length: length,
      toneInstructions: TONE_INSTRUCTIONS_MAP[tone] || "", // Fallback for safety
      userContext: userContextString,
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

  // Format user context for inclusion in the prompt
  const userContextString = formatUserContext(request.user_context);

  try {
    const prompt = await langfuse.getPrompt(
      "prd-critique-system-prompt-template"
    );
    const compiledPrompt = prompt.compile({
      suggestionInstructions,
      userContext: userContextString,
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
  request: CritiqueRequest,
  prdContent: string
): Promise<string> => {
  try {
    const prompt = await langfuse.getPrompt(
      "prd-critique-user-prompt-template"
    );
    const compiledPrompt = prompt.compile({
      existingPrdContent: prdContent || "",
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

/**
 * Fetches and compiles the system prompt for PRD question answering from Langfuse.
 * @param request The question request.
 * @returns The compiled system prompt string.
 */
export const getQuestionSystemPrompt = async (
  request: QuestionRequest
): Promise<string> => {
  // Format user context for inclusion in the prompt
  const userContextString = formatUserContext(request.user_context);

  try {
    // Fetch the raw prompt template from Langfuse by its unique name
    const prompt = await langfuse.getPrompt(
      "prd-question-system-prompt-template"
    );

    // Compile the prompt with dynamic variables
    const compiledPrompt = prompt.compile({
      context: request.context || "",
      userContext: userContextString,
    });

    // The compile method for text prompts returns a string
    return compiledPrompt as string;
  } catch (error) {
    console.error(
      "Failed to fetch or compile 'prd-question-system-prompt-template' from Langfuse:",
      error
    );
    // Fallback prompt if Langfuse is not available
    return `You are an expert Product Manager and Technical Writer assistant. Your role is to answer questions about Product Requirements Documents (PRDs) with precision and clarity.

When answering questions about a PRD:
1. Base your answers on the specific content provided in the PRD
2. If information is not explicitly stated in the PRD, clearly indicate this
3. Provide relevant context and explanations
4. Suggest related sections or topics that might be relevant
5. Be concise but comprehensive in your responses
6. If the question requires clarification, ask follow-up questions

${
  request.context ? `Additional context: ${request.context}` : ""
}${userContextString}

Always maintain a professional tone and focus on being helpful and accurate.`;
  }
};

/**
 * Fetches and compiles the user prompt for PRD question answering from Langfuse.
 * @param request The question request.
 * @param prdContent The PRD content to ask questions about.
 * @returns The compiled user prompt string.
 */
export const getQuestionUserPrompt = async (
  request: QuestionRequest,
  prdContent: string
): Promise<string> => {
  try {
    const prompt = await langfuse.getPrompt(
      "prd-question-user-prompt-template"
    );
    const compiledPrompt = prompt.compile({
      prdContent: prdContent,
      question: request.question,
    });
    return compiledPrompt as string;
  } catch (error) {
    console.error(
      "Failed to fetch or compile 'prd-question-user-prompt-template' from Langfuse:",
      error
    );
    // Fallback prompt if Langfuse is not available
    return `Here is the PRD content:

${prdContent}

Question: ${request.question}

Please answer the question based on the PRD content provided above.`;
  }
};
