import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import { initDB } from "./database";
import {
  createPrd,
  deletePrd,
  generatePrdContent,
  critiquePrdContent,
  getPrdById,
  getPrds,
  updatePrd,
  getSession,
  saveSession,
  testProvider,
  getOllamaModels,
  submitFeedbackHandler,
  getLangfuseHealth,
  submitFeedbackEnhanced,
} from "./handlers";
import { flushLangfuse } from "./langfuse";
import { validate } from "./middleware/validation";
import {
  PRD,
  GenerateContentRequest,
  CritiqueRequest,
} from "./generated/zod-schemas";

const app = express();
const port = 8080;

// Enable CORS for all routes
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:5174",
      "http://localhost:5175",
    ], // Support multiple Vite dev server ports
    credentials: true,
  })
);

// Parse JSON bodies
app.use(bodyParser.json());

// Test endpoint
app.get("/test", (req, res) => {
  res.json({ message: "Backend is running!" });
});

initDB("prds.db")
  .then((db) => {
    app.get("/prds", getPrds(db));
    app.post("/prds", validate(PRD), createPrd(db));
    app.get("/prds/:id", getPrdById(db));
    app.put("/prds/:id", validate(PRD), updatePrd(db));
    app.delete("/prds/:id", deletePrd(db));
    app.post(
      "/prds/:id/generate",
      validate(GenerateContentRequest),
      generatePrdContent(db)
    );
    app.post(
      "/prds/:id/critique",
      validate(CritiqueRequest),
      critiquePrdContent(db)
    );

    // Interactive session endpoints
    app.get("/prds/:prdId/session", getSession(db));
    app.post("/prds/:prdId/session", saveSession(db));

    // Provider testing endpoints
    app.post("/test-provider", testProvider);
    app.get("/ollama/models", getOllamaModels);

    // Langfuse endpoints
    app.post("/feedback", submitFeedbackHandler);
    app.get("/health/langfuse", getLangfuseHealth);

    // Enhanced feedback endpoints
    app.post("/api/feedback/enhanced", submitFeedbackEnhanced);

    app.listen(port, () => {
      console.log(`Server is running on http://localhost:${port}`);
    });

    // Graceful shutdown - flush Langfuse data
    process.on("SIGINT", async () => {
      console.log("Shutting down gracefully...");
      await flushLangfuse();
      process.exit(0);
    });

    process.on("SIGTERM", async () => {
      console.log("Shutting down gracefully...");
      await flushLangfuse();
      process.exit(0);
    });
  })
  .catch((err) => {
    console.error("Failed to initialize database:", err);
  });
