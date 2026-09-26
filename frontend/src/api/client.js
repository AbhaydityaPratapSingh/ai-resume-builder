// Empty by default, so a relative "/api/..." fetch keeps working exactly as
// before for local dev (Vite's dev-server proxy) and for a single-service
// deploy where the frontend and backend share an origin. Set VITE_API_BASE
// at build time (e.g. "https://your-backend.onrender.com") only when the
// frontend and backend are deployed as separate services with different
// origins.
const API_BASE = import.meta.env.VITE_API_BASE || "";

function apiUrl(path) {
  return `${API_BASE}${path}`;
}

async function post(path, body) {
  const res = await fetch(apiUrl(path), {
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
  const res = await fetch(apiUrl("/api/health"));
  if (!res.ok) throw new Error("Backend is not reachable");
  return res.json();
}

// Decodes the post-render ATS report the backend attaches as a response
// header (base64 JSON — headers must be ISO-8859-1-safe, see
// backend/src/routes/export.js). Returns { warnings: [], info: [] } if the
// header is missing or unreadable, never throws.
function decodePostRenderReport(res) {
  const raw = res.headers.get("X-Ats-Post-Render");
  if (!raw) return { warnings: [], info: [] };
  try {
    return JSON.parse(atob(raw));
  } catch {
    return { warnings: [], info: [] };
  }
}

export async function downloadPDF(resumeData, templateId) {
  const res = await fetch(apiUrl("/api/export/pdf"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ resumeData, templateId }),
  });
  if (!res.ok) {
    const detail = await res.json().catch(() => ({}));
    throw new Error(detail.error || "PDF export failed");
  }
  const postRenderReport = decodePostRenderReport(res);
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${(resumeData.personal?.name || "resume").replace(/\s+/g, "_")}.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  return postRenderReport;
}

export const validateATS = (resumeData) => post("/api/export/validate", { resumeData });

export async function importResumePDF(file) {
  const res = await fetch(apiUrl("/api/import/pdf"), {
    method: "POST",
    headers: { "Content-Type": file.type || "application/pdf" },
    body: file,
  });
  if (!res.ok) {
    const detail = await res.json().catch(() => ({}));
    throw new Error(detail.error || `Import failed (${res.status})`);
  }
  return res.json();
}

export async function importJDPDF(file) {
  const res = await fetch(apiUrl("/api/import/jd-pdf"), {
    method: "POST",
    headers: { "Content-Type": file.type || "application/pdf" },
    body: file,
  });
  if (!res.ok) {
    const detail = await res.json().catch(() => ({}));
    throw new Error(detail.error || `Import failed (${res.status})`);
  }
  return res.json();
}

export async function fetchGithubRepos(username) {
  const res = await fetch(apiUrl(`/api/github/repos/${encodeURIComponent(username)}`));
  if (!res.ok) {
    const detail = await res.json().catch(() => ({}));
    throw new Error(detail.error || `Could not fetch repos (${res.status})`);
  }
  return res.json();
}

export const analyzeKeywordGap = (resumeData, jdText) =>
  post("/api/llm/keyword-gap", { resumeData, jdText });

export const tailorBullet = (bullet, jdText, context) =>
  post("/api/llm/tailor-bullet", { bullet, jdText, context });

export const scoreMatch = (resumeData, jdText) =>
  post("/api/llm/match-score", { resumeData, jdText });
