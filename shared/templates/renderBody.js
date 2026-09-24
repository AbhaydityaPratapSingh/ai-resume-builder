import { escapeHtml, joinNonEmpty } from "./escapeHtml.js";
import { safeUrl, displayUrl } from "./safeUrl.js";
import { bulletText, SECTION_KEYS } from "../data/emptyResume.js";
import { parseScoreValue } from "../text/score.js";

// Formats a structured {type, value, outOf} score, or falls back to a
// legacy free-text score string unchanged.
function formatScore(score) {
  const parsed = parseScoreValue(score);
  if (parsed) {
    return parsed.type === "percentage"
      ? `${parsed.value}%`
      : `CGPA ${parsed.value}${parsed.outOf ? `/${parsed.outOf}` : ""}`;
  }
  return typeof score === "string" ? score : "";
}

function renderBullets(bullets) {
  const items = (bullets || []).map(bulletText).filter((t) => t && t.trim());
  if (!items.length) return "";
  return `<ul class="bullets">${items
    .map((t) => `<li>${escapeHtml(t)}</li>`)
    .join("")}</ul>`;
}

// No start date means nothing was entered — never render a bare "Present"
// for an item the user gave no dates for at all.
function renderDateRange(start, end) {
  if (!start) return "";
  const range = joinNonEmpty([start, end || "Present"], " – ");
  return range ? `<span class="dates">${range}</span>` : "";
}

function renderSummary(resumeData) {
  const text = resumeData.summary;
  if (!text || !text.trim()) return "";
  return `<section class="section"><h2>Summary</h2><p class="summary">${escapeHtml(
    text
  )}</p></section>`;
}

function renderExperience(experience) {
  const items = (experience || []).filter((e) => e.company || e.role);
  if (!items.length) return "";
  return `
    <section class="section">
      <h2>Experience</h2>
      ${items
        .map(
          (e) => `
        <div class="entry">
          <div class="entry-head">
            <span class="entry-title">${escapeHtml(e.role)}${
            e.role && e.company ? " · " : ""
          }${escapeHtml(e.company)}</span>
            ${renderDateRange(e.startDate, e.endDate)}
          </div>
          ${renderBullets(e.bullets)}
        </div>`
        )
        .join("")}
    </section>`;
}

function renderEducation(education) {
  const items = (education || []).filter((e) => e.institution || e.degree);
  if (!items.length) return "";
  return `
    <section class="section">
      <h2>Education</h2>
      ${items
        .map((e) => {
          const degreeLine = joinNonEmpty([e.degree, e.branch], ", ");
          const score = formatScore(e.score);
          const subParts = [score, e.board].filter(Boolean).map(escapeHtml);
          return `
        <div class="entry">
          <div class="entry-head">
            <span class="entry-title">${escapeHtml(e.institution)}${
            e.institution && degreeLine ? " · " : ""
          }${escapeHtml(degreeLine)}</span>
            ${renderDateRange(e.startDate, e.endDate)}
          </div>
          ${subParts.length ? `<div class="entry-sub">${subParts.join("  |  ")}</div>` : ""}
        </div>`;
        })
        .join("")}
    </section>`;
}

function renderAchievements(achievements) {
  const items = (achievements || []).filter((a) => a.text?.trim());
  if (!items.length) return "";
  return `
    <section class="section">
      <h2>Achievements</h2>
      <ul class="bullets">${items.map((a) => `<li>${escapeHtml(a.text)}</li>`).join("")}</ul>
    </section>`;
}

function renderResponsibilities(responsibilities) {
  const items = (responsibilities || []).filter((r) => r.role || r.org);
  if (!items.length) return "";
  return `
    <section class="section">
      <h2>Positions of Responsibility</h2>
      ${items
        .map(
          (r) => `
        <div class="entry">
          <div class="entry-head">
            <span class="entry-title">${escapeHtml(r.role)}${
            r.role && r.org ? " · " : ""
          }${escapeHtml(r.org)}</span>
            ${renderDateRange(r.startDate, r.endDate)}
          </div>
          ${renderBullets(r.bullets)}
        </div>`
        )
        .join("")}
    </section>`;
}

function renderProjects(projects) {
  const items = (projects || []).filter((p) => p.title);
  if (!items.length) return "";
  return `
    <section class="section">
      <h2>Projects</h2>
      ${items
        .map((p) => {
          const linkHref = safeUrl(p.link);
          const titleLine = linkHref
            ? `<a href="${escapeHtml(linkHref)}">${escapeHtml(p.title)}</a>`
            : escapeHtml(p.title);
          return `
        <div class="entry">
          <div class="entry-head">
            <span class="entry-title">${titleLine}</span>
            ${renderDateRange(p.startDate, p.endDate)}
          </div>
          ${
            p.techStack && p.techStack.filter(Boolean).length
              ? `<div class="entry-sub">${joinNonEmpty(p.techStack)}</div>`
              : ""
          }
          ${renderBullets(p.bullets)}
        </div>`;
        })
        .join("")}
    </section>`;
}

function renderSkills(skills) {
  const groups = (skills || []).filter((g) => g.items?.filter(Boolean).length);
  if (!groups.length) return "";
  const single = groups.length === 1 && groups[0].group === "Skills";
  return `
    <section class="section">
      <h2>Skills</h2>
      ${groups
        .map((g) =>
          single
            ? `<div class="skills-line">${joinNonEmpty(g.items)}</div>`
            : `<div class="skills-line"><span class="skills-group">${escapeHtml(
                g.group
              )}:</span> ${joinNonEmpty(g.items)}</div>`
        )
        .join("")}
    </section>`;
}

function renderCertifications(certifications) {
  const items = (certifications || []).filter((c) => c.name);
  if (!items.length) return "";
  return `
    <section class="section">
      <h2>Certifications</h2>
      ${items
        .map(
          (c) => `
        <div class="entry">
          <div class="entry-head">
            <span class="entry-title">${escapeHtml(c.name)}${
            c.issuer ? " · " + escapeHtml(c.issuer) : ""
          }</span>
            ${c.date ? `<span class="dates">${escapeHtml(c.date)}</span>` : ""}
          </div>
        </div>`
        )
        .join("")}
    </section>`;
}

const SECTION_RENDERERS = {
  summary: renderSummary,
  experience: (d) => renderExperience(d.experience),
  projects: (d) => renderProjects(d.projects),
  education: (d) => renderEducation(d.education),
  skills: (d) => renderSkills(d.skills),
  achievements: (d) => renderAchievements(d.achievements),
  responsibilities: (d) => renderResponsibilities(d.responsibilities),
  certifications: (d) => renderCertifications(d.certifications),
};

function renderContactLine(personal) {
  const parts = [];
  if (personal.email) {
    const href = safeUrl(`mailto:${personal.email}`);
    parts.push(
      href
        ? `<a href="${escapeHtml(href)}">${escapeHtml(personal.email)}</a>`
        : escapeHtml(personal.email)
    );
  }
  if (personal.phone) parts.push(escapeHtml(personal.phone));
  if (personal.location) parts.push(escapeHtml(personal.location));

  for (const link of personal.links || []) {
    const href = safeUrl(link.url);
    if (!href) continue;
    parts.push(
      `<a href="${escapeHtml(href)}">${escapeHtml(displayUrl(link.url))}</a>`
    );
  }
  return parts.join("  |  ");
}

export function renderResumeBodyHTML(resumeData) {
  const personal = resumeData.personal || {};
  const layout = resumeData.layout || {};
  const order = layout.sectionOrder?.length ? layout.sectionOrder : SECTION_KEYS;
  const hidden = new Set(layout.hidden || []);
  const contactLine = renderContactLine(personal);

  const sections = order
    .filter((key) => !hidden.has(key) && SECTION_RENDERERS[key])
    .map((key) => SECTION_RENDERERS[key](resumeData))
    .join("");

  return `
    <header class="resume-header">
      <h1>${escapeHtml(personal.name) || "Your Name"}</h1>
      ${contactLine ? `<div class="contact-line">${contactLine}</div>` : ""}
    </header>
    ${sections}
  `;
}
