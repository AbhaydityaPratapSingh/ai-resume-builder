import { SCHEMA_VERSION, SECTION_KEYS, makeBullet, makeId } from "../data/emptyResume.js";

const LINK_KEYS = ["linkedin", "github", "portfolio"];

function migrateBullets(bullets) {
  if (!Array.isArray(bullets)) return [];
  return bullets.map((b) => (typeof b === "string" ? makeBullet(b) : b));
}

// v1 stored bullets as plain strings, skills as a flat array, and the template
// id under meta. Anything already persisted in a browser is v1, so this must
// ship in the same change as the new shapes or the app throws on load.
function v1ToV2(data) {
  const personal = { ...(data.personal || {}) };
  const links = LINK_KEYS.filter((key) => personal[key]).map((key) => ({
    type: key,
    url: personal[key],
  }));
  for (const key of LINK_KEYS) delete personal[key];

  const flatSkills = (data.skills || []).filter(Boolean);

  return {
    schemaVersion: 2,
    personal: { ...personal, links },
    summary: data.summary || "",
    experience: (data.experience || []).map((e) => ({
      ...e,
      bullets: migrateBullets(e.bullets),
    })),
    projects: (data.projects || []).map((p) => ({
      ...p,
      bullets: migrateBullets(p.bullets),
    })),
    education: data.education || [],
    skills: flatSkills.length
      ? [{ id: makeId(), group: "Skills", items: flatSkills }]
      : [],
    certifications: data.certifications || [],
    layout: {
      templateId: data.meta?.selectedTemplateId || "classic",
      sectionOrder: [...SECTION_KEYS],
      hidden: [],
    },
    meta: { targetJD: data.meta?.targetJD || "" },
  };
}

const MIGRATIONS = { 1: v1ToV2 };

function normalizeBullets(bullets) {
  if (!Array.isArray(bullets)) return [];
  return bullets
    .filter((b) => b !== null && b !== undefined)
    .map((b) => (typeof b === "string" ? makeBullet(b) : { ...makeBullet(""), ...b }));
}

function normalizeSkills(skills) {
  if (!Array.isArray(skills)) return [];
  // A flat ["Java", ...] list collapses into one group; a malformed group
  // without items is dropped rather than left to crash .join().
  const flat = skills.filter((s) => typeof s === "string" && s);
  if (flat.length) return [{ id: makeId(), group: "Skills", items: flat }];
  return skills
    .filter((g) => g && typeof g === "object")
    .map((g) => ({
      id: g.id || makeId(),
      group: g.group || "Skills",
      items: Array.isArray(g.items) ? g.items.filter(Boolean) : [],
    }));
}

// Repairs a resumeData of any vintage into the current shape. This runs on
// every load, not just on a version bump: zustand only calls migrate when the
// stored version differs from the current one, so data written mid-development
// under the current version number would otherwise never be corrected and
// would reach the components malformed.
export function normalizeResumeData(data) {
  if (!data || typeof data !== "object") return null;

  const personal = { ...(data.personal || {}) };
  const links = Array.isArray(personal.links) ? personal.links.filter(Boolean) : [];
  for (const key of LINK_KEYS) {
    if (personal[key]) {
      links.push({ type: key, url: personal[key] });
      delete personal[key];
    }
  }

  const withBullets = (items) =>
    (Array.isArray(items) ? items : [])
      .filter((i) => i && typeof i === "object")
      .map((i) => ({ ...i, id: i.id || makeId(), bullets: normalizeBullets(i.bullets) }));

  const list = (items) =>
    (Array.isArray(items) ? items : [])
      .filter((i) => i && typeof i === "object")
      .map((i) => ({ ...i, id: i.id || makeId() }));

  const layout = data.layout || {};
  return {
    schemaVersion: SCHEMA_VERSION,
    personal: { ...personal, links },
    summary: typeof data.summary === "string" ? data.summary : "",
    experience: withBullets(data.experience),
    projects: withBullets(data.projects),
    education: list(data.education),
    skills: normalizeSkills(data.skills),
    certifications: list(data.certifications),
    layout: {
      templateId: layout.templateId || data.meta?.selectedTemplateId || "classic",
      sectionOrder: Array.isArray(layout.sectionOrder) && layout.sectionOrder.length
        ? layout.sectionOrder
        : [...SECTION_KEYS],
      hidden: Array.isArray(layout.hidden) ? layout.hidden : [],
    },
    meta: { targetJD: data.meta?.targetJD || "" },
  };
}

export function migrateResumeData(data, fromVersion) {
  if (!data) return data;
  // schemaVersion only exists from v2 on. Anything without it predates
  // versioning and is v1 — including data zustand reports as version 0,
  // which is what the shipped v1 store wrote (its persist config set no
  // version). Trusting fromVersion alone would skip the migration and hand
  // v1 shapes to v2 components.
  let version = data.schemaVersion ?? 1;
  let result = data;
  while (version < SCHEMA_VERSION) {
    const migrate = MIGRATIONS[version];
    if (!migrate) break;
    result = migrate(result);
    version = result.schemaVersion;
  }
  return normalizeResumeData(result);
}
