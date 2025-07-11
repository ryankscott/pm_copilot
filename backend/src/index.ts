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
} from "./handlers";
import { initLangfuse } from "./langfuseService"; // Import Langfuse initialization

const app = express();
const port = 8080;

// Initialize Langfuse
initLangfuse();

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

app.use(bodyParser.json());

// Provider testing endpoint (doesn't require database)
app.post("/test-provider", testProvider);

// Ollama models endpoint (doesn't require database)
app.get("/ollama/models", getOllamaModels);

initDB("prds.db")
  .then((db) => {
    app.get("/prds", getPrds(db));
    app.post("/prds", createPrd(db));
    app.get("/prds/:id", getPrdById(db));
    app.put("/prds/:id", updatePrd(db));
    app.delete("/prds/:id", deletePrd(db));
    app.post("/prds/:id/generate", generatePrdContent(db));
    app.post("/prds/:id/critique", critiquePrdContent(db));

    // Interactive session endpoints
    app.get("/prds/:prdId/session", getSession(db));
    app.post("/prds/:prdId/session", saveSession(db));

    app.listen(port, () => {
      console.log(`Server is running on http://localhost:${port}`);
    });
  })
  .catch((err) => {
    console.error("Failed to initialize database:", err);
  });
