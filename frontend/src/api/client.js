async function post(path, body) {
  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const detail = await res.json().catch(() => ({}));
    throw new Error(detail.error || `Request failed (${res.status})`);
  }
  return res.json();
}

export async function getHealth() {
  const res = await fetch("/api/health");
  if (!res.ok) throw new Error("Backend is not reachable");
  return res.json();
}

export async function downloadPDF(resumeData, templateId) {
  const res = await fetch("/api/export/pdf", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ resumeData, templateId }),
  });
  if (!res.ok) {
    const detail = await res.json().catch(() => ({}));
    throw new Error(detail.error || "PDF export failed");
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${(resumeData.personal?.name || "resume").replace(/\s+/g, "_")}.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export const validateATS = (resumeData) => post("/api/export/validate", { resumeData });

export const analyzeKeywordGap = (resumeData, jdText) =>
  post("/api/llm/keyword-gap", { resumeData, jdText });

export const tailorBullet = (bullet, jdText, context) =>
  post("/api/llm/tailor-bullet", { bullet, jdText, context });

export const scoreMatch = (resumeData, jdText) =>
  post("/api/llm/match-score", { resumeData, jdText });
