import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import { initDB } from "./database";
import {
  createPrd,
  deletePrd,
  generatePrdContent,
  critiquePrdContent,
  answerPrdQuestion,
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
  getTemplates,
  getTemplateById,
} from "./handlers";
import { flushLangfuse } from "./langfuse";

const app = express();
const port = 8080;

// Enable CORS for all routes
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);

      // Allow any localhost port for development
      if (origin.match(/^http:\/\/localhost:\d+$/)) {
        return callback(null, true);
      }

      // Reject other origins
      callback(new Error("Not allowed by CORS"));
    },
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
    app.post("/prds", createPrd(db));
    app.get("/prds/:id", getPrdById(db));
    app.put("/prds/:id", updatePrd(db));
    app.delete("/prds/:id", deletePrd(db));
    app.post("/prds/:id/generate", generatePrdContent(db));
    app.post("/prds/:id/critique", critiquePrdContent(db));
    app.post("/prds/:id/question", answerPrdQuestion(db));

    // Interactive session endpoints
    app.get("/prds/:prdId/session", getSession(db));
    app.post("/prds/:prdId/session", saveSession(db));

    // Template endpoints
    app.get("/templates", getTemplates(db));
    app.get("/templates/:id", getTemplateById(db));

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
