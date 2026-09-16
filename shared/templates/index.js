import { renderResumeBodyHTML } from "./renderBody.js";
import { TEMPLATE_STYLES } from "./styles.js";

export const TEMPLATES = [
  {
    id: "classic",
    name: "Classic",
    description: "Serif, navy accents. Safe default for most campus placements.",
  },
  {
    id: "modern",
    name: "Modern",
    description: "Sans-serif, green accents. Cleaner look, same ATS-safe structure.",
  },
];

export function getTemplateStyles(templateId) {
  return TEMPLATE_STYLES[templateId] || TEMPLATE_STYLES.classic;
}

export function renderResumeHTML(resumeData, templateId = "classic") {
  return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>${(resumeData.personal && resumeData.personal.name) || "Resume"}</title>
<style>${getTemplateStyles(templateId)}</style>
</head>
<body>
<div class="page">${renderResumeBodyHTML(resumeData)}</div>
</body>
</html>`;
}

export { renderResumeBodyHTML };
