import { Router } from "express";
import {
  fetchUserRepos,
  GithubUserNotFoundError,
  GithubRateLimitError,
} from "../services/githubRepos.js";
import { rateLimit } from "../middleware/rateLimit.js";

const router = Router();
const USERNAME_RE = /^[a-zA-Z0-9-]{1,39}$/;

router.get("/repos/:username", rateLimit, async (req, res) => {
  const { username } = req.params;
  if (!USERNAME_RE.test(username)) {
    return res.status(400).json({ error: "That doesn't look like a GitHub username." });
  }
  try {
    const repos = await fetchUserRepos(username);
    res.json({ repos });
  } catch (err) {
    if (err instanceof GithubUserNotFoundError) {
      return res.status(404).json({ error: `No GitHub user found: ${username}` });
    }
    if (err instanceof GithubRateLimitError) {
      res.setHeader("Retry-After", "3600");
      return res.status(429).json({ error: err.message });
    }
    console.error("GitHub repo fetch failed:", err);
    res.status(502).json({ error: "Could not reach GitHub. Try again shortly." });
  }
});

export default router;
