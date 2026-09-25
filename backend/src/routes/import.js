import { Router } from "express";
import express from "express";
import { parseResumeText } from "@resume-maker/shared";
import { extractPdfText, NotAPdfError, EmptyPdfTextError } from "../services/pdfImport.js";
import { rateLimit } from "../middleware/rateLimit.js";

const router = Router();
const MAX_BYTES = 8 * 1024 * 1024;

// Only this route needs a raw body — the global express.json() in
// server.js skips any request whose Content-Type it doesn't recognize, so
// this doesn't affect other routes.
const rawPdfBody = express.raw({
  type: (req) => /pdf|octet-stream/i.test(req.headers["content-type"] || ""),
  limit: "8mb",
});

router.post("/pdf", rateLimit, rawPdfBody, async (req, res) => {
  const buffer = req.body;
  if (!Buffer.isBuffer(buffer) || !buffer.length) {
    return res.status(400).json({ error: "No PDF file received." });
  }
  if (buffer.length > MAX_BYTES) {
    return res.status(413).json({ error: "PDF is too large (max 8MB)." });
  }

  try {
    const text = await extractPdfText(buffer);
    const draft = parseResumeText(text);
    res.json({ draft });
  } catch (err) {
    if (err instanceof NotAPdfError) {
      return res.status(400).json({ error: "That doesn't look like a PDF file." });
    }
    if (err instanceof EmptyPdfTextError) {
      return res.status(422).json({ error: err.message });
    }
    console.error("PDF import failed:", err);
    res.status(500).json({ error: "Could not read that PDF. Try exporting it again." });
  }
});

// A target job description is plain text used only for local, in-browser
// matching (shared/text/parseJD.js) — never parsed into a resumeData draft,
// so this just returns the extracted text for the caller to drop into the
// JD textarea.
router.post("/jd-pdf", rateLimit, rawPdfBody, async (req, res) => {
  const buffer = req.body;
  if (!Buffer.isBuffer(buffer) || !buffer.length) {
    return res.status(400).json({ error: "No PDF file received." });
  }
  if (buffer.length > MAX_BYTES) {
    return res.status(413).json({ error: "PDF is too large (max 8MB)." });
  }

  try {
    const text = await extractPdfText(buffer);
    res.json({ text });
  } catch (err) {
    if (err instanceof NotAPdfError) {
      return res.status(400).json({ error: "That doesn't look like a PDF file." });
    }
    if (err instanceof EmptyPdfTextError) {
      return res.status(422).json({ error: err.message });
    }
    console.error("JD PDF import failed:", err);
    res.status(500).json({ error: "Could not read that PDF. Try exporting it again." });
  }
});

export default router;
