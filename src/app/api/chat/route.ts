import { openai, createOpenAI } from "@ai-sdk/openai";
import { anthropic, createAnthropic } from "@ai-sdk/anthropic";
import { google, createGoogleGenerativeAI } from "@ai-sdk/google";
import { ollama } from "ollama-ai-provider";
import { streamText, convertToCoreMessages } from "ai";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

function getModel(provider: string, apiKey?: string) {
  switch (provider) {
    case "openai":
      if (apiKey) {
        const customOpenAI = createOpenAI({ apiKey });
        return customOpenAI(process.env.OPENAI_MODEL || "gpt-4o-mini");
      }
      return openai(process.env.OPENAI_MODEL || "gpt-4o-mini");
    case "claude":
      if (apiKey) {
        const customAnthropic = createAnthropic({ apiKey });
        return customAnthropic("claude-3-5-sonnet-20241022");
      }
      return anthropic("claude-3-5-sonnet-20241022");
    case "gemini":
      if (apiKey) {
        const customGoogle = createGoogleGenerativeAI({ apiKey });
        return customGoogle("gemini-pro");
      }
      return google("gemini-pro");
    case "ollama":
      // For ollama, we'll use the baseURL as a simple string and let the provider handle it
      return ollama("llama3.1");
    default:
      if (apiKey) {
        const customOpenAI = createOpenAI({ apiKey });
        return customOpenAI("gpt-4o-mini");
      }
      return openai("gpt-4o-mini");
  }
}

export async function POST(req: Request) {
  try {
    const {
      messages,
      mode,
      currentContent,
      provider = "openai",
      apiKey,
      test = false,
    } = await req.json();

    // Handle test requests - just validate the API key can connect
    if (test) {
      try {
        await streamText({
          model: getModel(provider, apiKey),
          messages: convertToCoreMessages([
            { role: "user", content: "Test connection - respond with OK" },
          ]),
          maxTokens: 10,
          temperature: 0,
        });

        return new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      } catch (testError) {
        console.error("API Key Test Error:", testError);
        return new Response(
          JSON.stringify({
            success: false,
            error: "Invalid API key or connection failed",
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
    }

    // Configure the system prompt based on the mode
    let systemPrompt = "";

    switch (mode) {
      case "improve":
        systemPrompt = `You are an expert product manager and technical writer. Your task is to improve Product Requirements Documents (PRDs) by making them more comprehensive, clear, and professional. 

When improving a PRD, you should:
- Enhance clarity and structure
- Add missing sections that are commonly found in professional PRDs
- Improve existing content while maintaining the original intent
- Use professional language and formatting
- Ensure all requirements are specific and measurable
- Add acceptance criteria where appropriate

Common PRD sections to include:
- Executive Summary
- Problem Statement
- Target Audience/User Personas
- Goals and Objectives
- User Stories
- Functional Requirements
- Non-functional Requirements
- Success Metrics and KPIs
- Technical Considerations
- Timeline and Milestones
- Dependencies and Assumptions
- Risk Assessment

Return the improved PRD content in markdown format.`;
        break;

      case "critique":
        systemPrompt = `You are an expert product manager and consultant. Your task is to provide detailed, constructive critique of Product Requirements Documents (PRDs).

When critiquing a PRD, you should:
- Identify strengths and what's done well
- Point out gaps, missing sections, or unclear requirements
- Suggest specific improvements
- Highlight potential risks or concerns
- Check for completeness, clarity, and feasibility
- Assess whether requirements are measurable and testable

Provide your critique in a structured format with:
- Strengths
- Areas for Improvement
- Missing Elements
- Recommendations
- Overall Assessment

Be constructive and specific in your feedback.`;
        break;

      case "chat":
        systemPrompt = `You are an expert product manager and AI assistant specializing in Product Requirements Documents (PRDs). You help product managers create, improve, and refine their PRDs.

You can:
- Answer questions about PRD best practices
- Suggest improvements to specific sections
- Help with user story writing
- Assist with requirement gathering
- Provide templates and examples
- Help with stakeholder communication
- Advise on prioritization and scoping

Be helpful, concise, and practical in your responses. Focus on actionable advice.`;
        break;

      default:
        systemPrompt =
          "You are a helpful AI assistant for product managers working on Product Requirements Documents.";
    }

    // For improve and critique modes, include the current content in the context
    const processedMessages = messages.map(
      (message: { role: string; content: string }) => {
        if (
          (mode === "improve" || mode === "critique") &&
          message.role === "user" &&
          currentContent
        ) {
          return {
            ...message,
            content: `${message.content}\n\nCurrent PRD Content:\n${currentContent}`,
          };
        }
        return message;
      }
    );

    const result = await streamText({
      model: getModel(provider, apiKey),
      system: systemPrompt,
      messages: convertToCoreMessages(processedMessages),
      maxTokens: 4000,
      temperature: 0.7,
    });

    return result.toDataStreamResponse();
  } catch (error) {
    console.error("AI API Error:", error);
    return new Response("Error processing AI request", { status: 500 });
  }
}
