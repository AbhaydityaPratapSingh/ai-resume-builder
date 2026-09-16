import { Router } from "express";
import * as llm from "../services/llmService.js";

const router = Router();

const WINDOW_MS = 60_000;
const MAX_CALLS_PER_WINDOW = 15;
const callLog = new Map();

function rateLimit(req, res, next) {
  const key = req.ip;
  const now = Date.now();
  const recent = (callLog.get(key) || []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= MAX_CALLS_PER_WINDOW) {
    return res.status(429).json({ error: "Too many AI requests. Wait a minute and try again." });
  }
  recent.push(now);
  callLog.set(key, recent);
  next();
}

function requireConfigured(req, res, next) {
  if (!llm.isConfigured()) {
    return res.status(503).json({
      error: "ANTHROPIC_API_KEY is not set on the backend — AI features are disabled.",
    });
  }
  next();
}

router.use(rateLimit, requireConfigured);

function handleError(res, err, label) {
  console.error(`${label} failed:`, err);
  const status = err?.status === 429 ? 429 : 500;
  res.status(status).json({ error: `${label} failed. Try again.` });
}

router.post("/keyword-gap", async (req, res) => {
  const { resumeData, jdText } = req.body || {};
  if (!resumeData || !jdText?.trim()) {
    return res.status(400).json({ error: "resumeData and jdText are required" });
  }
  try {
    res.json(await llm.analyzeKeywordGap(resumeData, jdText));
  } catch (err) {
    handleError(res, err, "Keyword gap analysis");
  }
});

router.post("/tailor-bullet", async (req, res) => {
  const { bullet, jdText, context } = req.body || {};
  if (!bullet?.trim() || !jdText?.trim()) {
    return res.status(400).json({ error: "bullet and jdText are required" });
  }
  try {
    res.json(await llm.tailorBullet(bullet, jdText, context));
  } catch (err) {
    handleError(res, err, "Bullet tailoring");
  }
});

router.post("/match-score", async (req, res) => {
  const { resumeData, jdText } = req.body || {};
  if (!resumeData || !jdText?.trim()) {
    return res.status(400).json({ error: "resumeData and jdText are required" });
  }
  try {
    res.json(await llm.scoreMatch(resumeData, jdText));
  } catch (err) {
    handleError(res, err, "Match scoring");
  }
});

export default router;
