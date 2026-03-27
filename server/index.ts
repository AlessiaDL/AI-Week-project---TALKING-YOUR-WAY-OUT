import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // API routes
  app.use(express.json());

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.post("/api/chat", async (req, res) => {
    const { gameState, userMessage, personality } = req.body;
    const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;

    console.log("API Key present:", !!apiKey, "Length:", apiKey?.length);

    if (!apiKey || apiKey === "YOUR_API_KEY" || apiKey === "" || apiKey === "undefined") {
      return res.status(500).json({ error: "GEMINI_API_KEY non configurata correttamente sul server" });
    }

    try {
      const { callGemini } = await import("./gemini.js");
      const result = await callGemini(apiKey, gameState, userMessage, personality, gameState.mode);
      res.json(result);
    } catch (error) {
      console.error("Server Gemini Error:", error);
      res.status(500).json({ error: "Failed to call Gemini" });
    }
  });

  app.post("/api/generate-scenario", async (req, res) => {
    const { prompt } = req.body;
    const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;

    if (!apiKey || apiKey === "YOUR_API_KEY" || apiKey === "") {
      return res.status(500).json({ error: "GEMINI_API_KEY non configurata correttamente sul server" });
    }

    try {
      const { generateCustomScenario } = await import("./gemini.js");
      const result = await generateCustomScenario(apiKey, prompt);
      res.json(result);
    } catch (error) {
      console.error("Server Scenario Generation Error:", error);
      res.status(500).json({ error: "Failed to generate scenario" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    console.log("Starting Vite in development mode...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
      root: path.join(process.cwd(), "client"),
      configFile: path.join(process.cwd(), "vite.config.ts"),
    });
    app.use(vite.middlewares);
    console.log("Vite middleware attached.");
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
