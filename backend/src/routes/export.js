import { Router } from "express";
import { renderResumePDF, QueueFullError } from "../services/pdfRenderer.js";
import { validateForATS } from "../services/atsValidator.js";
import { checkRenderedPDF } from "../services/postRenderCheck.js";

const router = Router();

// A name in Devanagari or Tamil sanitizes to an empty string, so fall back
// rather than emitting a nameless attachment.
function safeFilename(name) {
  const base = (name || "")
    .normalize("NFKD")
    .replace(/[^a-zA-Z0-9-_ ]/g, "")
    .trim()
    .replace(/\s+/g, "_");
  return base ? `${base}.pdf` : "resume.pdf";
}

router.post("/validate", (req, res) => {
  const { resumeData } = req.body || {};
  if (!resumeData) return res.status(400).json({ error: "resumeData is required" });
  res.json(validateForATS(resumeData));
});

router.post("/pdf", async (req, res) => {
  const { resumeData, templateId } = req.body || {};
  if (!resumeData) return res.status(400).json({ error: "resumeData is required" });

  try {
    const pdf = await renderResumePDF(
      resumeData,
      templateId || resumeData.layout?.templateId
    );

    // Never let a bug in the post-render check itself block a download the
    // student is actively waiting on.
    const postRenderReport = await checkRenderedPDF(resumeData, pdf).catch((err) => {
      console.error("Post-render PDF check failed:", err);
      return { warnings: [], info: [] };
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${safeFilename(resumeData.personal?.name)}"`
    );
    // HTTP headers are ISO-8859-1; base64 keeps this safe regardless of
    // what characters end up in a warning message.
    res.setHeader(
      "X-Ats-Post-Render",
      Buffer.from(JSON.stringify(postRenderReport)).toString("base64")
    );
    res.setHeader("Access-Control-Expose-Headers", "X-Ats-Post-Render");
    res.send(Buffer.from(pdf));
  } catch (err) {
    if (err instanceof QueueFullError) {
      res.setHeader("Retry-After", "10");
      return res.status(503).json({ error: "Export queue is busy. Try again shortly." });
    }
    console.error("PDF render failed:", err);
    res.status(500).json({ error: "Could not render the PDF." });
  }
});

export default router;
