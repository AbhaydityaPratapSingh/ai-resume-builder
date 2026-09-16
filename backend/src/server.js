import "dotenv/config";
import express from "express";
import cors from "cors";

import exportRoutes from "./routes/export.js";
import llmRoutes from "./routes/llm.js";
import { isConfigured } from "./services/llmService.js";
import { closeBrowser } from "./services/pdfRenderer.js";

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: process.env.FRONTEND_ORIGIN || "http://localhost:5173" }));
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (req, res) => {
  res.json({ ok: true, aiEnabled: isConfigured() });
});

app.use("/api/export", exportRoutes);
app.use("/api/llm", llmRoutes);

const server = app.listen(PORT, () => {
  console.log(`Backend listening on http://localhost:${PORT}`);
  console.log(`AI features: ${isConfigured() ? "enabled" : "disabled (no ANTHROPIC_API_KEY)"}`);
});

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, async () => {
    await closeBrowser();
    server.close(() => process.exit(0));
  });
}
