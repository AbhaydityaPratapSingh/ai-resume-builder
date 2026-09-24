const WINDOW_MS = 60_000;
const MAX_CALLS_PER_WINDOW = 15;
const callLog = new Map();

// In-memory and per-process: fine for local use, replaced by Redis before
// deploy (ARCHITECTURE.md section 11).
export function rateLimit(req, res, next) {
  const key = req.ip;
  const now = Date.now();
  const recent = (callLog.get(key) || []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= MAX_CALLS_PER_WINDOW) {
    res.setHeader("Retry-After", "60");
    return res.status(429).json({ error: "Too many requests. Wait a minute and try again." });
  }
  recent.push(now);
  callLog.set(key, recent);
  next();
}
