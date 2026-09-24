import "dotenv/config";
import express from "express";
import cors from "cors";

import exportRoutes from "./routes/export.js";
import { isAIEnabled, aiConfigProblem } from "./config.js";
import { closeBrowser } from "./services/pdfRenderer.js";

const app = express();
const PORT = process.env.PORT || 3001;
const aiEnabled = isAIEnabled();

app.use(cors({ origin: process.env.FRONTEND_ORIGIN || "http://localhost:5173" }));
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (req, res) => {
  res.json({ ok: true, aiEnabled });
});

app.use("/api/export", exportRoutes);

// The LLM routes are imported only when the flag is on, so with AI disabled
// nothing under src/llm/ is loaded and the provider SDK is never touched.
if (aiEnabled) {
  const { default: llmRoutes } = await import("./routes/llm.js");
  app.use("/api/llm", llmRoutes);
} else {
  app.use("/api/llm", (req, res) =>
    res.status(503).json({
      error: "AI features are disabled on this server (AI_ENABLED is not true).",
      aiEnabled: false,
    })
  );
}

const server = app.listen(PORT, () => {
  console.log(`Backend listening on http://localhost:${PORT}`);
  console.log(`AI features: ${aiEnabled ? "enabled" : "disabled (AI_ENABLED is not true)"}`);
  const problem = aiConfigProblem();
  if (problem) console.warn(`Warning: ${problem} — AI features stay off.`);
});

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, async () => {
    await closeBrowser();
    server.close(() => process.exit(0));
  });
}
