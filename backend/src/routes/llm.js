import { Router } from "express";
import * as llm from "../llm/adapter.js";
import { rateLimit } from "../middleware/rateLimit.js";
import { requireAI } from "../middleware/requireAI.js";

const router = Router();

router.use(rateLimit, requireAI);

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
