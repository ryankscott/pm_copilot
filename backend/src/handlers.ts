import { Request, Response } from "express";
import sqlite3 from "sqlite3";
import { v4 as uuidv4 } from "uuid";
import {
  PRD,
  GenerateContentRequest,
  GenerateContentResponse,
} from "./generated";
import { aiService } from "./aiService";
import { CritiqueRequest, CritiqueResponse } from "./prompts";

export const getPrds =
  (db: sqlite3.Database) => (req: Request, res: Response) => {
    db.all("SELECT * FROM prds", [], (err, rows) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json(rows);
    });
  };

export const createPrd =
  (db: sqlite3.Database) => (req: Request, res: Response) => {
    const prd: PRD = req.body;
    const now = new Date();
    const newPrd: PRD = {
      ...prd,
      id: uuidv4(),
      createdAt: now.toUTCString(),
      updatedAt: now.toUTCString(),
    };

    db.run(
      "INSERT INTO prds (id, title, content, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?)",
      [
        newPrd.id,
        newPrd.title,
        newPrd.content,
        newPrd.createdAt,
        newPrd.updatedAt,
      ],
      function (err) {
        if (err) {
          res.status(500).json({ error: err.message });
          return;
        }
        res.status(201).json(newPrd);
      }
    );
  };

export const getPrdById =
  (db: sqlite3.Database) => (req: Request, res: Response) => {
    const { id } = req.params;
    db.get("SELECT * FROM prds WHERE id = ?", [id], (err, row) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      if (!row) {
        res.status(404).json({ error: "PRD not found" });
        return;
      }
      res.json(row);
    });
  };

export const updatePrd =
  (db: sqlite3.Database) => (req: Request, res: Response) => {
    const { id } = req.params;
    const prd: PRD = req.body;
    const now = new Date();
    const updatedPrd: PRD = {
      ...prd,
      id,
      updatedAt: now.toUTCString(),
    };

    db.run(
      "UPDATE prds SET title = ?, content = ?, updatedAt = ? WHERE id = ?",
      [updatedPrd.title, updatedPrd.content, updatedPrd.updatedAt, id],
      function (err) {
        if (err) {
          res.status(500).json({ error: err.message });
          return;
        }
        res.json(updatedPrd);
      }
    );
  };

export const deletePrd =
  (db: sqlite3.Database) => (req: Request, res: Response) => {
    const { id } = req.params;
    db.run("DELETE FROM prds WHERE id = ?", [id], function (err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.status(204).send();
    });
  };

export const generatePrdContent =
  (db: sqlite3.Database) => async (req: Request, res: Response) => {
    const { id } = req.params;
    const generateRequest: GenerateContentRequest = req.body;

    console.log("=== PRD Generation Request ===");
    console.log("PRD ID:", id);
    console.log("Request prompt:", generateRequest.prompt);
    console.log(
      "Conversation history length:",
      generateRequest.conversation_history?.length || 0
    );

    // Validate required fields
    if (!generateRequest.prompt) {
      res.status(400).json({
        message: "Missing required field: prompt",
        code: "VALIDATION_ERROR",
      });
      return;
    }

    // Check if PRD exists
    db.get("SELECT * FROM prds WHERE id = ?", [id], async (err, row) => {
      if (err) {
        res.status(500).json({
          message: err.message,
          code: "DATABASE_ERROR",
        });
        return;
      }

      if (!row) {
        res.status(404).json({
          message: "PRD not found",
          code: "PRD_NOT_FOUND",
        });
        return;
      }

      try {
        const startTime = Date.now();

        // Map the enum values to strings for our AI service
        const toneMap: Record<
          string,
          "professional" | "casual" | "technical" | "executive"
        > = {
          professional: "professional",
          casual: "casual",
          technical: "technical",
          executive: "executive",
        };

        const lengthMap: Record<
          string,
          "brief" | "standard" | "comprehensive"
        > = {
          brief: "brief",
          standard: "standard",
          detailed: "comprehensive", // Map 'detailed' to 'comprehensive'
          comprehensive: "comprehensive",
        };

        // Use real AI service instead of mock
        const aiResult = await aiService.generateContent({
          prompt: generateRequest.prompt,
          context: generateRequest.context,
          existingContent: generateRequest.existing_content,
          tone: generateRequest.tone
            ? toneMap[generateRequest.tone]
            : undefined,
          length: generateRequest.length
            ? lengthMap[generateRequest.length]
            : undefined,
          conversationHistory: generateRequest.conversation_history?.map(
            (msg) => ({
              role: msg.role === "user" ? "user" : "assistant",
              content: msg.content,
              timestamp: msg.timestamp,
            })
          ),
        });

        const endTime = Date.now();
        const generationTime = (endTime - startTime) / 1000;

        const response: GenerateContentResponse = {
          generated_content: aiResult.content,
          tokens_used: aiResult.tokensUsed,
          model_used: aiResult.modelUsed,
          generation_time: generationTime,
          suggestions: generateMockSuggestions(generateRequest),
        };

        res.json(response);
      } catch (error) {
        res.status(500).json({
          message: "AI content generation failed",
          code: "AI_GENERATION_ERROR",
          details: error instanceof Error ? error.message : "Unknown error",
        });
      }
    });
  };

// Session management for interactive PRD creation
export const getSession =
  (db: sqlite3.Database) => (req: Request, res: Response) => {
    const { prdId } = req.params;

    db.get(
      "SELECT * FROM interactive_sessions WHERE prd_id = ? ORDER BY updated_at DESC LIMIT 1",
      [prdId],
      (err, row: any) => {
        if (err) {
          res.status(500).json({ error: err.message });
          return;
        }

        if (!row) {
          res.json(null);
          return;
        }

        res.json({
          id: row.id,
          prd_id: row.prd_id,
          conversation_history: JSON.parse(row.conversation_history || "[]"),
          settings: JSON.parse(row.settings || "{}"),
          created_at: row.created_at,
          updated_at: row.updated_at,
        });
      }
    );
  };

export const saveSession =
  (db: sqlite3.Database) => (req: Request, res: Response) => {
    const { prdId } = req.params;
    const { conversation_history, settings } = req.body;
    const now = new Date().toISOString();

    // First, try to update existing session
    db.run(
      `UPDATE interactive_sessions 
       SET conversation_history = ?, settings = ?, updated_at = ?
       WHERE prd_id = ?`,
      [
        JSON.stringify(conversation_history),
        JSON.stringify(settings),
        now,
        prdId,
      ],
      function (err) {
        if (err) {
          res.status(500).json({ error: err.message });
          return;
        }

        // If no rows were updated, create a new session
        if (this.changes === 0) {
          const sessionId = require("uuid").v4();
          db.run(
            `INSERT INTO interactive_sessions (id, prd_id, conversation_history, settings, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [
              sessionId,
              prdId,
              JSON.stringify(conversation_history),
              JSON.stringify(settings),
              now,
              now,
            ],
            (insertErr) => {
              if (insertErr) {
                res.status(500).json({ error: insertErr.message });
                return;
              }
              res.json({ success: true, id: sessionId });
            }
          );
        } else {
          res.json({ success: true });
        }
      }
    );
  };

export const critiquePrdContent =
  (db: sqlite3.Database) => async (req: Request, res: Response) => {
    const { id } = req.params;
    const critiqueRequest: CritiqueRequest = req.body;

    // Check if PRD exists and get its content
    db.get("SELECT * FROM prds WHERE id = ?", [id], async (err, row: any) => {
      if (err) {
        res.status(500).json({
          message: err.message,
          code: "DATABASE_ERROR",
        });
        return;
      }

      if (!row) {
        res.status(404).json({
          message: "PRD not found",
          code: "PRD_NOT_FOUND",
        });
        return;
      }

      if (!row.content || row.content.trim() === "") {
        res.status(400).json({
          message: "PRD has no content to critique",
          code: "NO_CONTENT",
        });
        return;
      }

      try {
        const startTime = Date.now();

        // Use real AI service for critique
        const critiqueResult = await aiService.critiquePRD(
          row.content,
          critiqueRequest
        );

        const endTime = Date.now();
        const generationTime = (endTime - startTime) / 1000;

        // Add generation metadata
        const response = {
          ...critiqueResult,
          generation_time: generationTime,
          model_used: "AI Critique System",
          prd_id: id,
          prd_title: row.title,
        };

        res.json(response);
      } catch (error) {
        console.error("PRD critique failed:", error);
        res.status(500).json({
          message: "AI critique generation failed",
          code: "AI_CRITIQUE_ERROR",
          details: error instanceof Error ? error.message : "Unknown error",
        });
      }
    });
  };

// Helper function to generate mock content (replace with actual AI integration)
function generateMockContent(request: GenerateContentRequest): string {
  const {
    prompt,
    tone = "professional",
    length = "standard",
    context,
    existing_content,
  } = request;

  // Start with a base content structure based on the prompt
  let content = "Generated content based on your requirements.";

  // Analyze prompt for content type suggestions
  const promptLower = prompt.toLowerCase();

  if (
    promptLower.includes("user story") ||
    promptLower.includes("user stories")
  ) {
    content =
      "As a user, I want to [action] so that I can [benefit].\n\nAcceptance Criteria:\n- Given [context]\n- When [action]\n- Then [expected result]";
  } else if (promptLower.includes("acceptance criteria")) {
    content =
      "• The system shall [requirement]\n• The interface must [specification]\n• Performance should [metric]";
  } else if (
    promptLower.includes("technical") ||
    promptLower.includes("architecture")
  ) {
    content =
      "• Architecture: [details]\n• Technology Stack: [stack]\n• Integration Points: [APIs]\n• Security Requirements: [specifications]";
  } else if (
    promptLower.includes("business") ||
    promptLower.includes("requirements")
  ) {
    content =
      "• Business Objective: [goal]\n• Success Metrics: [KPIs]\n• Stakeholder Requirements: [needs]\n• Constraints: [limitations]";
  } else if (
    promptLower.includes("metrics") ||
    promptLower.includes("success")
  ) {
    content =
      "• User Engagement: [metric]\n• Performance: [benchmark]\n• Business Impact: [measurement]\n• Quality: [standard]";
  } else if (
    promptLower.includes("timeline") ||
    promptLower.includes("schedule")
  ) {
    content =
      "• Phase 1: [duration] - [deliverables]\n• Phase 2: [duration] - [deliverables]\n• Phase 3: [duration] - [deliverables]";
  } else if (promptLower.includes("risk") || promptLower.includes("risks")) {
    content =
      "• Risk: [description]\n  - Impact: [level]\n  - Mitigation: [strategy]\n• Risk: [description]\n  - Impact: [level]\n  - Mitigation: [strategy]";
  } else if (
    promptLower.includes("overview") ||
    promptLower.includes("summary")
  ) {
    content =
      "This section provides a high-level overview of the product requirements and objectives.";
  }

  // Modify content based on specific keywords in prompt
  if (promptLower.includes("mobile")) {
    content = content.replace("[action]", "access the mobile application");
  }
  if (promptLower.includes("api") || promptLower.includes("integration")) {
    content = content.replace(
      "[APIs]",
      "REST APIs, GraphQL endpoints, third-party integrations"
    );
  }

  // Modify content based on tone
  if (tone === "casual") {
    content = content.replace("shall", "should").replace("must", "needs to");
  } else if (tone === "technical") {
    content = content.replace(
      "[details]",
      "microservices architecture with containerization"
    );
  } else if (tone === "executive") {
    content = "Executive Summary: " + content;
  }

  // Modify content based on length
  if (length === "brief") {
    content = content.split("\n")[0]; // Return only first line
  } else if (length === "comprehensive") {
    content +=
      "\n\nAdditional detailed information and expanded requirements based on the comprehensive analysis of the provided context and prompt.";

    if (context) {
      content += `\n\nContext Analysis: ${context}`;
    }

    if (existing_content) {
      content += `\n\nBuilding upon existing content: This enhancement extends the current documentation with improved structure and additional details.`;
    }
  }

  // Include context if provided
  let finalContent = `Generated based on prompt: "${prompt}"`;
  if (context) {
    finalContent += `\nContext: ${context}`;
  }
  finalContent += `\n\n${content}`;

  return finalContent;
}

// Helper function to generate mock suggestions
function generateMockSuggestions(request: GenerateContentRequest): string[] {
  const { prompt, tone, length } = request;
  const promptLower = prompt.toLowerCase();

  // Generate suggestions based on prompt content
  const suggestions: string[] = [];

  if (
    promptLower.includes("user story") ||
    promptLower.includes("user stories")
  ) {
    suggestions.push(
      "Add more edge case scenarios",
      "Include accessibility requirements",
      "Consider mobile-specific user flows"
    );
  } else if (
    promptLower.includes("technical") ||
    promptLower.includes("architecture")
  ) {
    suggestions.push(
      "Consider scalability requirements",
      "Add monitoring and logging needs",
      "Include backup and recovery plans"
    );
  } else if (promptLower.includes("business")) {
    suggestions.push(
      "Define ROI expectations",
      "Add compliance requirements",
      "Include training needs"
    );
  } else if (
    promptLower.includes("metrics") ||
    promptLower.includes("success")
  ) {
    suggestions.push(
      "Add baseline measurements",
      "Include customer satisfaction metrics",
      "Define reporting frequency"
    );
  } else if (
    promptLower.includes("timeline") ||
    promptLower.includes("schedule")
  ) {
    suggestions.push(
      "Add buffer time for testing",
      "Include dependency management",
      "Consider resource availability"
    );
  } else if (promptLower.includes("risk")) {
    suggestions.push(
      "Add technical debt considerations",
      "Include market risks",
      "Consider resource constraints"
    );
  } else {
    // General suggestions
    suggestions.push(
      "Consider adding more detail",
      "Review for clarity",
      "Validate with stakeholders"
    );
  }

  // Add tone-specific suggestions
  if (tone === "technical") {
    suggestions.push(
      "Include implementation details",
      "Add API specifications"
    );
  } else if (tone === "executive") {
    suggestions.push("Include business impact", "Add cost-benefit analysis");
  }

  // Add length-specific suggestions
  if (length === "brief") {
    suggestions.push("Consider expanding with more examples");
  } else if (length === "comprehensive") {
    suggestions.push(
      "Review for potential redundancy",
      "Ensure all sections are cohesive"
    );
  }

  return suggestions.slice(0, 4); // Return up to 4 suggestions
}
