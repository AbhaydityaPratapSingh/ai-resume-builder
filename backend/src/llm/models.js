// Model ids live here alone so a provider or tier change is a one-file edit.
// Both are unverified against a live API — see ARCHITECTURE.md section 13.2.
export const MODELS = {
  fast: process.env.LLM_MODEL_FAST || "claude-haiku-4-5",
  strong: process.env.LLM_MODEL_STRONG || "claude-opus-5",
};
