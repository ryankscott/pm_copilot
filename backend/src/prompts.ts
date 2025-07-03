import { AIGenerationRequest } from "./aiService";

export interface PromptConfig {
  tone: string;
  length: string;
}

export interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
  timestamp?: string;
}

// Interactive PRD creation system prompt
const INTERACTIVE_PRD_PROMPT = `
You are an experienced Product Manager with expertise in creating detailed Product Requirements Documents (PRDs). 
I have a very informal or vague product idea. Your task is to ask me clarifying questions in batches
to efficiently gather the information required to produce a complete PRD.

Once you feel you have gathered sufficient details, create a structured PRD that includes (but is not limited to):

## PRD Sections to Include

- **Overview** - A concise summary of the product, its purpose, and its value proposition
- **Goals and Objectives** - Clear, measurable goals the product aims to achieve
- **Scope** - What's included and explicitly what's excluded from the initial release
- **User Personas or Target Audience** - Detailed descriptions of the intended users
- **Functional Requirements** - Specific features and capabilities, organized by priority
- **Non-Functional Requirements** - Performance, security, scalability, and other quality attributes
- **User Journeys** - Key workflows and interactions from the user's perspective
- **Success Metrics** - How we'll measure if the product is successful
- **Timeline** - High-level implementation schedule with key milestones
- **Open Questions/Assumptions** - Areas that need further clarification or investigation

## Guidelines for the Questioning Process

- Ask questions in batches of 3-5 related questions at a time to minimize back-and-forth
- Start with broad, foundational questions before diving into specifics
- Group related questions together in a logical sequence
- Adapt your questions based on my previous answers
- Only ask follow-up questions if absolutely necessary for critical information
- Prioritize questions about user needs and core functionality early in the process
- Do NOT make assumptions - always ask for clarification on important details
- Aim to complete the information gathering in 2-3 rounds of questions maximum

## Question Categories to Cover

1. **Product Vision and Purpose**
   - What problem does this product solve?
   - Who are the target users?
   - What makes this product unique or valuable?

2. **User Needs and Behaviors**
   - What are the primary use cases?
   - What are the user's goals when using the product?
   - What pain points does this address?

3. **Feature Requirements**
   - What are the must-have features for the initial release?
   - What features could be added in future releases?
   - Are there any specific technical requirements or constraints?

4. **Business Goals**
   - What are the business objectives for this product?
   - How will success be measured?
   - What is the monetization strategy (if applicable)?

5. **Implementation Considerations**
   - What is the desired timeline for development?
   - Are there budget constraints to consider?
   - What technical resources are available?

## Final PRD Format and Delivery

After gathering sufficient information, you MUST:

1. Create a complete PRD document based on the information provided
2. Encode the PRD in Markdown format for easy readability and sharing and wrap the content in <prd> tags 
3. Ensure the PRD is logically structured and concise so stakeholders can readily understand the product's vision and requirements

Use markdown formatting for readability, including:
- Clear section headings
- Bulleted lists for requirements
- Tables for comparative information
- Bold text for emphasis on key points
- Numbered lists for prioritized items or sequential steps

Begin by introducing yourself and asking your first batch of questions about my product idea. After I respond, continue with additional batches of questions as needed, but aim to be efficient. Once you have sufficient information, create and save the PRD file. `;

// Tone-specific additions
const TONE_ADDITIONS = {
  technical: "\n- Include technical specifications and implementation details",
  executive: "\n- Focus on business impact and strategic objectives",
  casual:
    "\n- Use approachable, conversational language while maintaining clarity",
  professional: "", // No additional instructions for professional tone
} as const;

// Helper function to build system prompt (always interactive)
export const buildSystemPrompt = (request: AIGenerationRequest): string => {
  const { tone = "professional", length = "standard" } = request;

  let systemPrompt = INTERACTIVE_PRD_PROMPT;

  systemPrompt += `
- Write in a ${tone} tone
- Provide ${length} level of detail`;

  return systemPrompt;
};

// Helper function to build user prompt for interactive sessions
export const buildUserPrompt = (
  request: AIGenerationRequest,
  conversationHistory: ConversationMessage[] = [],
  currentPrdContent?: string
): string => {
  let prompt = "";

  // If this is the start of an interactive session
  if (conversationHistory.length === 0) {
    prompt = `I want to create a new PRD. Here's my initial request: "${request.prompt}"`;

    if (currentPrdContent && currentPrdContent.trim()) {
      prompt += `\n\nExisting PRD content to build upon:\n\`\`\`markdown\n${currentPrdContent}\n\`\`\``;
    }
  } else {
    // Continue the conversation
    prompt = request.prompt;
  }

  return prompt;
};

// Critique-specific interfaces
export interface CritiqueRequest {
  focus_areas?: string[];
  depth?: "overview" | "detailed" | "comprehensive";
  include_suggestions?: boolean;
  custom_criteria?: string;
}

export interface CritiqueSuggestion {
  category:
    | "structure"
    | "content"
    | "clarity"
    | "requirements"
    | "technical"
    | "business";
  priority: "high" | "medium" | "low";
  title: string;
  description: string;
  example?: string;
}

export interface CritiqueResponse {
  overall_score: number;
  strengths: string[];
  weaknesses: string[];
  missing_sections: string[];
  suggestions: CritiqueSuggestion[];
  detailed_feedback: Record<string, string>;
  action_items: string[];
  critique_summary: string;
}

// PRD Critique system prompt
const PRD_CRITIQUE_PROMPT = `
You are an expert Product Manager and PRD reviewer with extensive experience in evaluating Product Requirements Documents across various industries and product types. Your role is to provide comprehensive, actionable feedback on PRDs to help improve their quality, completeness, and effectiveness.

## Your Expertise Areas:
- Product strategy and business alignment
- User experience and customer needs
- Technical feasibility and implementation
- Requirements specification and clarity
- Stakeholder communication and documentation
- Risk assessment and mitigation
- Success metrics and measurement

## Evaluation Framework:

### 1. Structure & Organization (0-10)
- Logical flow and clear section hierarchy
- Appropriate use of headings and formatting
- Easy navigation and readability
- Consistent formatting and style

### 2. Completeness (0-10)
- All essential PRD sections present
- Comprehensive coverage of requirements
- Adequate detail for implementation
- Nothing critical missing

### 3. Clarity & Communication (0-10)
- Clear, unambiguous language
- Appropriate for target audience
- Well-defined terms and concepts
- Actionable and specific content

### 4. Requirements Quality (0-10)
- Well-defined functional requirements
- Clear acceptance criteria
- Prioritized features and needs
- Testable and measurable requirements

### 5. User Focus (0-10)
- Clear target audience definition
- Well-developed user personas
- Compelling user stories
- User journey mapping

### 6. Business Value (0-10)
- Clear business objectives
- Defined success metrics
- ROI considerations
- Strategic alignment

### 7. Technical Considerations (0-10)
- Appropriate technical detail
- Implementation feasibility
- Architecture considerations
- Integration requirements

### 8. Risk Management (0-10)
- Identified risks and assumptions
- Mitigation strategies
- Dependency management
- Contingency planning

## Standard PRD Sections to Evaluate:
- Executive Summary / Overview
- Problem Statement
- Goals & Objectives
- Target Audience / User Personas
- User Stories & Use Cases
- Functional Requirements
- Non-Functional Requirements
- Success Metrics & KPIs
- Technical Specifications
- Timeline & Milestones
- Dependencies & Assumptions
- Risk Assessment
- Appendices / Supporting Materials

## Critique Guidelines:
- Provide specific, actionable feedback
- Balance constructive criticism with recognition of strengths
- Offer concrete examples and suggestions
- Consider the PRD's intended audience and purpose
- Focus on improvements that will have the most impact
- Suggest best practices and industry standards
- Provide prioritized action items

## Response Format:
Provide your critique in a structured format that includes:
1. Overall assessment and score
2. Key strengths to build upon
3. Primary areas for improvement
4. Missing or incomplete sections
5. Specific suggestions with examples
6. Prioritized action items
7. Executive summary of recommendations

Be thorough but concise, focusing on the most impactful improvements that will enhance the PRD's effectiveness for its intended purpose.
`;

// Build critique system prompt
export const buildCritiqueSystemPrompt = (request: CritiqueRequest): string => {
  const { depth = "detailed", focus_areas = [], custom_criteria } = request;

  let systemPrompt = PRD_CRITIQUE_PROMPT;

  // Add depth-specific instructions
  if (depth === "overview") {
    systemPrompt += `\n\n## Analysis Depth: Overview
- Focus on high-level assessment
- Identify 3-5 key areas for improvement
- Provide concise, actionable feedback
- Limit detailed analysis to critical issues`;
  } else if (depth === "comprehensive") {
    systemPrompt += `\n\n## Analysis Depth: Comprehensive
- Conduct thorough section-by-section analysis
- Provide detailed examples and suggestions
- Include best practice recommendations
- Cover all aspects of PRD quality
- Provide extensive action items and next steps`;
  } else {
    systemPrompt += `\n\n## Analysis Depth: Detailed
- Provide balanced, thorough assessment
- Focus on most impactful improvements
- Include specific examples where helpful
- Balance breadth and depth of analysis`;
  }

  // Add focus area instructions
  if (focus_areas.length > 0) {
    systemPrompt += `\n\n## Focus Areas:
Pay special attention to these areas during your evaluation:
${focus_areas.map((area) => `- ${area}`).join("\n")}`;
  }

  // Add custom criteria
  if (custom_criteria) {
    systemPrompt += `\n\n## Custom Evaluation Criteria:
${custom_criteria}`;
  }

  systemPrompt += `\n\n## Important Notes:
- Structure your response as a JSON object matching the CritiqueResponse schema
- Provide scores as numbers between 0-10
- Make suggestions specific and actionable
- Include examples where helpful
- Prioritize high-impact improvements`;

  return systemPrompt;
};

// Build critique user prompt
export const buildCritiqueUserPrompt = (
  prdContent: string,
  request: CritiqueRequest
): string => {
  const { include_suggestions = true } = request;

  let prompt = `Please analyze and critique the following PRD:

\`\`\`markdown
${prdContent}
\`\`\`

Provide a comprehensive critique focusing on:
1. Overall quality assessment with scoring
2. Strengths and areas where the PRD excels
3. Weaknesses and areas needing improvement
4. Missing sections or content gaps
5. Specific, actionable suggestions for improvement
6. Prioritized action items for next steps

${
  include_suggestions
    ? "Include specific examples and suggestions for improvement in each area."
    : "Focus on identifying issues without providing detailed suggestions."
}

Please structure your response as a JSON object that matches the expected CritiqueResponse format.`;

  return prompt;
};
