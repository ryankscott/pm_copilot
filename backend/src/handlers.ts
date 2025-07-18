import { Request, Response } from "express";
import sqlite3 from "sqlite3";
import { v4 as uuidv4 } from "uuid";
import {
  GenerateContentRequest,
  CritiqueRequest,
  QuestionRequest,
  PRD,
  Template,
  TemplateSection,
} from "./generated";
import { aiService } from "./aiService";
import {
  submitFeedback,
  LangfuseFeedback,
  getLangfuseHealthStatus,
  trackCustomEvent,
  trackPerformanceMetric,
} from "./langfuse";

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

export const createPrd =
  (db: sqlite3.Database) => (req: Request, res: Response) => {
    const { title, content, templateId } = req.body;
    const id = uuidv4();
    const now = new Date().toISOString();

    db.run(
      "INSERT INTO prds (id, title, content, template_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
      [id, title, content, templateId || null, now, now],
      function (err) {
        if (err) {
          res.status(500).json({ error: err.message });
          return;
        }
        res.json({
          id,
          title,
          content,
          templateId,
          created_at: now,
          updated_at: now,
        });
      }
    );
  };

export const updatePrd =
  (db: sqlite3.Database) => (req: Request, res: Response) => {
    const { id } = req.params;
    const { title, content, templateId } = req.body;
    const now = new Date().toISOString();

    db.run(
      "UPDATE prds SET title = ?, content = ?, template_id = ?, updated_at = ? WHERE id = ?",
      [title, content, templateId || null, now, id],
      function (err) {
        if (err) {
          res.status(500).json({ error: err.message });
          return;
        }
        if (this.changes === 0) {
          res.status(404).json({ error: "PRD not found" });
          return;
        }
        res.json({ id, title, content, templateId, updated_at: now });
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
      if (this.changes === 0) {
        res.status(404).json({ error: "PRD not found" });
        return;
      }
      res.status(204).send();
    });
  };

export const getSession =
  (db: sqlite3.Database) => (req: Request, res: Response) => {
    const { prdId } = req.params;
    db.get(
      "SELECT * FROM interactive_sessions WHERE prd_id = ?",
      [prdId],
      (err, row: any) => {
        if (err) {
          res.status(500).json({ error: err.message });
          return;
        }
        if (!row) {
          res.status(404).json({ error: "Session not found" });
          return;
        }
        res.json({
          ...row,
          conversation_history: JSON.parse(row.conversation_history || "[]"),
          settings: JSON.parse(row.settings || "{}"),
        });
      }
    );
  };

export const generatePrdContent =
  (db: sqlite3.Database) => async (req: Request, res: Response) => {
    const { id } = req.params;
    const generateRequest: GenerateContentRequest = req.body;

    const userId = (req.headers["x-user-id"] as string) || "anonymous";
    const sessionId =
      (req.headers["x-session-id"] as string) || `session-${Date.now()}`;

    console.log("=== PRD Generation Request ===");
    console.log("PRD ID:", id);
    console.log("User ID:", userId);
    console.log("Session ID:", sessionId);
    console.log("Request prompt:", generateRequest.prompt);
    console.log(
      "Conversation history length:",
      generateRequest.conversation_history?.length || 0
    );
    console.log("Provider:", generateRequest.provider?.type);
    console.log("Model:", generateRequest.model);
    console.log("Provider configured:", generateRequest.provider?.isConfigured);

    if (!generateRequest.prompt) {
      res.status(400).json({
        message: "Missing required field: prompt",
        code: "VALIDATION_ERROR",
      });
      return;
    }

    try {
      const startTime = Date.now();

      // If a template_id is provided, get the template structure
      let templateStructure = null;
      if (generateRequest.template_id) {
        templateStructure = await new Promise<Template | null>(
          (resolve, reject) => {
            db.get(
              "SELECT * FROM templates WHERE id = ?",
              [generateRequest.template_id],
              (err, templateRow: any) => {
                if (err) {
                  reject(err);
                  return;
                }

                if (!templateRow) {
                  resolve(null);
                  return;
                }

                // Get sections for this template
                db.all(
                  "SELECT * FROM template_sections WHERE template_id = ? ORDER BY order_index",
                  [generateRequest.template_id],
                  (sectionsErr, sectionRows: any[]) => {
                    if (sectionsErr) {
                      reject(sectionsErr);
                      return;
                    }

                    const sections = sectionRows.map((row) => ({
                      id: row.id,
                      name: row.name,
                      description: row.description,
                      placeholder: row.placeholder,
                      required: !!row.required,
                      order: row.order_index,
                    }));

                    resolve({
                      id: templateRow.id,
                      title: templateRow.title,
                      description: templateRow.description,
                      category: templateRow.category,
                      sections,
                      isCustom: !!templateRow.is_custom,
                      createdAt: templateRow.created_at,
                      updatedAt: templateRow.updated_at,
                    });
                  }
                );
              }
            );
          }
        );
      }

      const aiResult = await aiService.generateContent(
        generateRequest,
        id,
        userId,
        sessionId,
        templateStructure
      );

      if (!aiResult || !aiResult.generated_content) {
        throw new Error("AI service failed to generate content");
      }

      const endTime = Date.now();
      const generationTime = (endTime - startTime) / 1000;

      res.json({
        ...aiResult,
        generationTime,
        langfuseData: aiResult.langfuseData,
      });
    } catch (error) {
      res.status(500).json({
        message: "AI content generation failed",
        code: "AI_GENERATION_ERROR",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
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

    // TODO: Remove these headers
    // Extract user information from headers or body
    const userId = (req.headers["x-user-id"] as string) || "anonymous";
    const sessionId =
      (req.headers["x-session-id"] as string) ||
      `critique-session-${Date.now()}`;

    console.log("=== PRD Critique Request ===");
    console.log("PRD ID:", id);
    console.log("User ID:", userId);
    console.log("Session ID:", sessionId);
    console.log("Focus areas:", critiqueRequest.focus_areas);
    console.log("Depth:", critiqueRequest.depth);
    console.log("Provider:", critiqueRequest.provider?.type);
    console.log("Model:", critiqueRequest.model);

    try {
      // Get the PRD content from the database
      const prd = await new Promise<PRD>((resolve, reject) => {
        db.get("SELECT * FROM prds WHERE id = ?", [id], (err, row) => {
          if (err) reject(err);
          else resolve(row as PRD);
        });
      });

      if (!prd) {
        res.status(404).json({
          message: "PRD not found",
          code: "PRD_NOT_FOUND",
        });
        return;
      }

      const startTime = Date.now();

      // Use real AI service for critique
      const critiqueResult = await aiService.critiquePRD(
        critiqueRequest,
        prd.content ?? "",
        id,
        userId,
        sessionId
      );

      const endTime = Date.now();
      const generationTime = (endTime - startTime) / 1000;

      // Add generation metadata
      const response = {
        ...critiqueResult,
        generation_time: generationTime,
        model_used: critiqueRequest.model,
        prd_id: id,
        // Include Langfuse data for frontend to use for feedback
        langfuseData: critiqueResult.langfuseData,
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
  };

// New health check endpoint for Langfuse
export const getLangfuseHealth = async (req: Request, res: Response) => {
  try {
    const healthStatus = await getLangfuseHealthStatus();

    res.json({
      status: healthStatus.healthy ? "healthy" : "unhealthy",
      ...healthStatus,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Health check failed:", error);
    res.status(500).json({
      status: "error",
      enabled: false,
      healthy: false,
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString(),
    });
  }
};

// Enhanced feedback handler with performance tracking
export const submitFeedbackHandler = async (req: Request, res: Response) => {
  const { traceId, generationId, rating, comment } = req.body;
  const userId = (req.headers["x-user-id"] as string) || "anonymous";
  const sessionId = (req.headers["x-session-id"] as string) || "unknown";

  console.log("=== Feedback Submission ===");
  console.log("Trace ID:", traceId);
  console.log("Generation ID:", generationId);
  console.log("Rating:", rating);
  console.log("Comment:", comment);
  console.log("User ID:", userId);

  // Track feedback submission event
  await trackCustomEvent(
    "feedback_submitted",
    {
      traceId,
      generationId,
      rating,
      hasComment: !!comment,
      userId,
    },
    userId,
    sessionId
  );

  // Validate required fields
  if (!traceId || !generationId || rating === undefined) {
    res.status(400).json({
      message:
        "Missing required fields: traceId, generationId, and score are required",
      code: "VALIDATION_ERROR",
    });
    return;
  }

  try {
    const startTime = Date.now();

    const feedback: LangfuseFeedback = {
      traceId,
      generationId,
      rating,
      comment,
      userId,
    };

    await submitFeedback(feedback);

    const responseTime = Date.now() - startTime;

    // Track performance metric
    await trackPerformanceMetric(
      "feedback_submission_time",
      responseTime,
      "ms",
      {
        traceId,
        userId,
      }
    );

    res.json({
      success: true,
      message: "Feedback submitted successfully",
    });
  } catch (error) {
    console.error("Feedback submission failed:", error);

    // Track error event
    await trackCustomEvent(
      "feedback_submission_error",
      {
        traceId,
        error: error instanceof Error ? error.message : "Unknown error",
        userId,
      },
      userId,
      sessionId
    );

    res.status(500).json({
      message: "Failed to submit feedback",
      code: "FEEDBACK_ERROR",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const answerPrdQuestion =
  (db: sqlite3.Database) => async (req: Request, res: Response) => {
    const { id } = req.params;
    const questionRequest: QuestionRequest = req.body;

    // Extract user information from headers or body
    const userId = (req.headers["x-user-id"] as string) || "anonymous";
    const sessionId =
      (req.headers["x-session-id"] as string) ||
      `question-session-${Date.now()}`;

    console.log("=== PRD Question Request ===");
    console.log("PRD ID:", id);
    console.log("User ID:", userId);
    console.log("Session ID:", sessionId);
    console.log("Question:", questionRequest.question);
    console.log("Context:", questionRequest.context);
    console.log("Provider:", questionRequest.provider?.type);
    console.log("Model:", questionRequest.model);

    // Validate required fields
    if (!questionRequest.question) {
      res.status(400).json({
        message: "Missing required field: question",
        code: "VALIDATION_ERROR",
      });
      return;
    }

    try {
      // Get the PRD content first
      const prd = await new Promise<PRD | undefined>((resolve, reject) => {
        db.get("SELECT * FROM prds WHERE id = ?", [id], (err, row) => {
          if (err) reject(err);
          else resolve(row as PRD | undefined);
        });
      });

      if (!prd) {
        res.status(404).json({
          message: "PRD not found",
          code: "PRD_NOT_FOUND",
        });
        return;
      }

      const startTime = Date.now();

      // Use real AI service for question answering
      const questionResult = await aiService.answerQuestion(
        questionRequest,
        prd.content || "",
        id,
        userId,
        sessionId
      );

      const endTime = Date.now();
      const generationTime = (endTime - startTime) / 1000;

      // Add generation metadata
      const response = {
        ...questionResult,
        generation_time: generationTime,
        model_used: questionRequest.model,
        prd_id: id,
        // Include Langfuse data for frontend to use for feedback
        langfuseData: questionResult.langfuseData,
      };

      res.json(response);
    } catch (error) {
      console.error("PRD question answering failed:", error);
      res.status(500).json({
        message: "AI question answering failed",
        code: "AI_QUESTION_ERROR",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };

export const testProvider = async (req: Request, res: Response) => {
  const { provider, model } = req.body;

  console.log("=== Provider Test Request ===");
  console.log("Provider:", provider?.type);
  console.log("Model:", model);

  if (!provider || !provider.type) {
    res.status(400).json({
      success: false,
      error: "Provider configuration is required",
    });
    return;
  }

  try {
    const startTime = Date.now();

    const testResult = await aiService.testProvider(provider, model);

    const endTime = Date.now();
    const responseTime = (endTime - startTime) / 1000;

    console.log("Provider test successful:", provider.type);
    console.log("Response time:", responseTime, "seconds");

    res.json({
      ...testResult,
      responseTime,
      message: `Successfully connected to ${provider.type}`,
    });
  } catch (error) {
    console.error("Provider test failed:", error);
    res.status(500).json({
      success: false,
      provider: provider.type,
      model: model || "unknown",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const getOllamaModels = async (req: Request, res: Response) => {
  const baseURL = (req.query.baseURL as string) || "http://localhost:11434";

  console.log("=== Ollama Models Request ===");
  console.log("Base URL:", baseURL);

  try {
    const response = await fetch(`${baseURL}/api/tags`);

    if (!response.ok) {
      throw new Error(
        `Failed to fetch models: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();

    if (!data || !data.models || !Array.isArray(data.models)) {
      throw new Error("Invalid response format from Ollama API");
    }

    // Transform Ollama models to our LLMModel format
    const models = data.models.map((model: any) => ({
      id: model.name,
      name: model.name,
      description: `Local model - ${model.name}`,
      maxTokens: 8192, // Default, could be made configurable
      supportsStreaming: true,
      costPer1MTokens: { input: 0, output: 0 }, // Local models are free
    }));

    console.log(`Successfully fetched ${models.length} models from Ollama`);
    res.json(models);
  } catch (error) {
    console.error("Failed to fetch Ollama models:", error);
    res.status(500).json({
      message: "Failed to fetch models from Ollama",
      code: "OLLAMA_FETCH_ERROR",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Enhanced feedback submission with analytics
export const submitFeedbackEnhanced = async (req: Request, res: Response) => {
  try {
    const { traceId, generationId, rating, comment, categories } = req.body;

    if (!traceId || !generationId) {
      res.status(400).json({
        error: "Missing required fields: trac",
      });
      return;
    }

    // Validate rating if provided
    if (rating !== undefined && (rating < 1 || rating > 5)) {
      res.status(400).json({
        error: "Rating must be between 1 and 5",
      });
      return;
    }

    // Track feedback submission event
    await trackCustomEvent("feedback_submitted", {
      traceId,
      generationId,
      rating,
      comment: comment ? "provided" : "none",
      categories: categories || [],
      timestamp: new Date().toISOString(),
    });

    // Submit to Langfuse
    await submitFeedback({
      traceId,
      generationId,
      rating,
      comment,
    });

    // Track performance metrics
    await trackPerformanceMetric(
      "feedback_response_time",
      Date.now(),
      "milliseconds",
      {
        traceId,
        generationId,
      }
    );

    res.json({
      success: true,
      message: "Feedback submitted successfully",
      analytics: {
        traceId,
        generationId,
        rating,
        categoriesCount: categories?.length || 0,
      },
    });
  } catch (error) {
    console.error("Error submitting feedback:", error);

    // Track error
    if (req.body.traceId && req.body.generationId) {
      await trackCustomEvent("feedback_error", {
        traceId: req.body.traceId,
        generationId: req.body.generationId,
        error: (error as Error).message,
        timestamp: new Date().toISOString(),
      });
    }

    res.status(500).json({
      error: "Failed to submit feedback",
      details: (error as Error).message,
    });
  }
};

// Template handlers
export const getTemplates =
  (db: sqlite3.Database) => (req: Request, res: Response) => {
    const query = `
      SELECT 
        t.id,
        t.title,
        t.description,
        t.category,
        t.is_custom as isCustom,
        t.created_at as createdAt,
        t.updated_at as updatedAt
      FROM templates t
      ORDER BY t.category, t.title
    `;

    db.all(query, [], (err, templateRows: any[]) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }

      if (templateRows.length === 0) {
        res.json([]);
        return;
      }

      // Get all template sections in one query
      const templateIds = templateRows.map((row) => row.id);
      const sectionsQuery = `
        SELECT 
          ts.id,
          ts.template_id as templateId,
          ts.name,
          ts.description,
          ts.placeholder,
          ts.required,
          ts.order_index as "order"
        FROM template_sections ts
        WHERE ts.template_id IN (${templateIds.map(() => "?").join(",")})
        ORDER BY ts.template_id, ts.order_index
      `;

      db.all(sectionsQuery, templateIds, (err, sectionRows: any[]) => {
        if (err) {
          res.status(500).json({ error: err.message });
          return;
        }

        // Group sections by template ID
        const sectionsByTemplate = sectionRows.reduce((acc, section) => {
          if (!acc[section.templateId]) {
            acc[section.templateId] = [];
          }
          acc[section.templateId].push({
            id: section.id,
            name: section.name,
            description: section.description,
            placeholder: section.placeholder,
            required: !!section.required,
            order: section.order,
          });
          return acc;
        }, {} as Record<string, TemplateSection[]>);

        // Combine templates with their sections
        const templates: Template[] = templateRows.map((row) => ({
          id: row.id,
          title: row.title,
          description: row.description,
          category: row.category,
          sections: sectionsByTemplate[row.id] || [],
          isCustom: !!row.isCustom,
          createdAt: row.createdAt,
          updatedAt: row.updatedAt,
        }));

        res.json(templates);
      });
    });
  };

export const getTemplateById =
  (db: sqlite3.Database) => (req: Request, res: Response) => {
    const { id } = req.params;

    const templateQuery = `
      SELECT 
        t.id,
        t.title,
        t.description,
        t.category,
        t.is_custom as isCustom,
        t.created_at as createdAt,
        t.updated_at as updatedAt
      FROM templates t
      WHERE t.id = ?
    `;

    db.get(templateQuery, [id], (err, templateRow: any) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }

      if (!templateRow) {
        res.status(404).json({ error: "Template not found" });
        return;
      }

      // Get sections for this template
      const sectionsQuery = `
        SELECT 
          ts.id,
          ts.name,
          ts.description,
          ts.placeholder,
          ts.required,
          ts.order_index as "order"
        FROM template_sections ts
        WHERE ts.template_id = ?
        ORDER BY ts.order_index
      `;

      db.all(sectionsQuery, [id], (err, sectionRows: any[]) => {
        if (err) {
          res.status(500).json({ error: err.message });
          return;
        }

        const sections: TemplateSection[] = sectionRows.map((row) => ({
          id: row.id,
          name: row.name,
          description: row.description,
          placeholder: row.placeholder,
          required: !!row.required,
          order: row.order,
        }));

        const template: Template = {
          id: templateRow.id,
          title: templateRow.title,
          description: templateRow.description,
          category: templateRow.category,
          sections,
          isCustom: !!templateRow.isCustom,
          createdAt: templateRow.createdAt,
          updatedAt: templateRow.updatedAt,
        };

        res.json(template);
      });
    });
  };
