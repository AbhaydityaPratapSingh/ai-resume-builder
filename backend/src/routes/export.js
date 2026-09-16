import { Router } from "express";
import { renderResumePDF } from "../services/pdfRenderer.js";
import { validateForATS } from "../services/atsValidator.js";

const router = Router();

function safeFilename(name) {
  const base = (name || "resume").replace(/[^a-zA-Z0-9-_ ]/g, "").trim() || "resume";
  return `${base.replace(/\s+/g, "_")}.pdf`;
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
    const pdf = await renderResumePDF(resumeData, templateId);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${safeFilename(resumeData.personal?.name)}"`
    );
    res.send(Buffer.from(pdf));
  } catch (err) {
    console.error("PDF render failed:", err);
    res.status(500).json({ error: "Could not render the PDF." });
  }
});

export default router;
