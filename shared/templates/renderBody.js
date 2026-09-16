import { escapeHtml, joinNonEmpty } from "./escapeHtml.js";

function renderBullets(bullets) {
  const items = (bullets || []).filter((b) => b && b.trim());
  if (!items.length) return "";
  return `<ul class="bullets">${items
    .map((b) => `<li>${escapeHtml(b)}</li>`)
    .join("")}</ul>`;
}

function renderDateRange(start, end) {
  const range = joinNonEmpty([start, end || "Present"], " – ");
  return range ? `<span class="dates">${range}</span>` : "";
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
        .map(
          (e) => `
        <div class="entry">
          <div class="entry-head">
            <span class="entry-title">${escapeHtml(e.institution)}${
            e.institution && e.degree ? " · " : ""
          }${escapeHtml(e.degree)}</span>
            ${renderDateRange(e.startDate, e.endDate)}
          </div>
          ${e.score ? `<div class="entry-sub">${escapeHtml(e.score)}</div>` : ""}
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
        .map(
          (p) => `
        <div class="entry">
          <div class="entry-head">
            <span class="entry-title">${escapeHtml(p.title)}</span>
          </div>
          ${
            p.techStack && p.techStack.filter(Boolean).length
              ? `<div class="entry-sub">${joinNonEmpty(p.techStack)}</div>`
              : ""
          }
          ${renderBullets(p.bullets)}
        </div>`
        )
        .join("")}
    </section>`;
}

function renderSkills(skills) {
  const items = (skills || []).filter(Boolean);
  if (!items.length) return "";
  return `
    <section class="section">
      <h2>Skills</h2>
      <div class="skills-line">${joinNonEmpty(items)}</div>
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

export function renderResumeBodyHTML(resumeData) {
  const p = resumeData.personal || {};
  const contactLine = joinNonEmpty(
    [p.email, p.phone, p.location, p.linkedin, p.github, p.portfolio],
    "  |  "
  );

  return `
    <header class="resume-header">
      <h1>${escapeHtml(p.name) || "Your Name"}</h1>
      ${contactLine ? `<div class="contact-line">${contactLine}</div>` : ""}
    </header>
    ${
      resumeData.summary && resumeData.summary.trim()
        ? `<section class="section"><h2>Summary</h2><p class="summary">${escapeHtml(
            resumeData.summary
          )}</p></section>`
        : ""
    }
    ${renderExperience(resumeData.experience)}
    ${renderProjects(resumeData.projects)}
    ${renderEducation(resumeData.education)}
    ${renderSkills(resumeData.skills)}
    ${renderCertifications(resumeData.certifications)}
  `;
}
