import { Request, Response } from "express";
import sqlite3 from "sqlite3";
import { v4 as uuidv4 } from "uuid";
import { PRD, GenerateContentRequest, CritiqueRequest } from "./generated";
import { aiService } from "./aiService";

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
    console.log("Provider:", generateRequest.provider?.type);
    console.log("Model:", generateRequest.model);
    console.log("Provider configured:", generateRequest.provider?.isConfigured);

    // Validate required fields
    if (!generateRequest.prompt) {
      res.status(400).json({
        message: "Missing required field: prompt",
        code: "VALIDATION_ERROR",
      });
      return;
    }

    try {
      const startTime = Date.now();

      // Use real AI service instead of mock
      const aiResult = await aiService.generateContent({
        prompt: generateRequest.prompt,
        context: generateRequest.context,
        existing_content: generateRequest.existing_content,
        tone: generateRequest.tone,
        length: generateRequest.length,
        conversation_history: generateRequest.conversation_history,
        provider: generateRequest.provider,
        model: generateRequest.model,
      });

      const endTime = Date.now();
      const generationTime = (endTime - startTime) / 1000;

      res.json({ ...aiResult, generationTime });
    } catch (error) {
      res.status(500).json({
        message: "AI content generation failed",
        code: "AI_GENERATION_ERROR",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
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

    console.log("=== PRD Critique Request ===");
    console.log("PRD ID:", id);
    console.log("Focus areas:", critiqueRequest.focus_areas);
    console.log("Depth:", critiqueRequest.depth);
    console.log("Provider:", critiqueRequest.provider?.type);
    console.log("Model:", critiqueRequest.model);
    console.log("Has existing content:", !!critiqueRequest.existing_content);

    // Validate required fields
    if (!critiqueRequest.existing_content) {
      res.status(400).json({
        message: "Missing required field: existing_content",
        code: "VALIDATION_ERROR",
      });
      return;
    }

    try {
      const startTime = Date.now();

      // Use real AI service for critique
      const critiqueResult = await aiService.critiquePRD(critiqueRequest);

      const endTime = Date.now();
      const generationTime = (endTime - startTime) / 1000;

      // Add generation metadata
      const response = {
        ...critiqueResult,
        generation_time: generationTime,
        model_used: critiqueRequest.model,
        prd_id: id,
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

    // Use the AI service to test a simple generation
    const testResult = await aiService.generateContent({
      prompt:
        "Test connection. Please respond with exactly: 'Connection successful'",
      provider,
      model,
    });

    const endTime = Date.now();
    const responseTime = (endTime - startTime) / 1000;

    console.log("Provider test successful:", provider.type);
    console.log("Response time:", responseTime, "seconds");

    res.json({
      success: true,
      provider: provider.type,
      model: testResult.model_used,
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
