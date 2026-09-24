import { isAIEnabled } from "../config.js";

// The AI routes are only mounted when the flag is on, so this is a backstop
// rather than the main gate.
export function requireAI(req, res, next) {
  if (!isAIEnabled()) {
    return res.status(503).json({
      error: "AI features are disabled on this server (AI_ENABLED is not true).",
      aiEnabled: false,
    });
  }
  next();
}
