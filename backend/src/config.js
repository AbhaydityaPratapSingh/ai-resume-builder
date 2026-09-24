// Deliberately dependency-free: this is imported on every boot, including when
// the AI layer is off, and must never pull in an LLM SDK.

export function isAIEnabled() {
  return process.env.AI_ENABLED === "true" && Boolean(apiKey());
}

// AI_ENABLED=true with no key is a misconfiguration worth naming rather than
// silently treating as "off".
export function aiConfigProblem() {
  if (process.env.AI_ENABLED !== "true") return null;
  if (!apiKey()) return "AI_ENABLED=true but LLM_API_KEY is not set";
  return null;
}

export function apiKey() {
  return process.env.LLM_API_KEY || process.env.ANTHROPIC_API_KEY || "";
}
