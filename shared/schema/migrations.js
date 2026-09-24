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

export function migrateResumeData(data, fromVersion) {
  if (!data) return data;
  let version = fromVersion ?? data.schemaVersion ?? 1;
  let result = data;
  while (version < SCHEMA_VERSION) {
    const migrate = MIGRATIONS[version];
    if (!migrate) break;
    result = migrate(result);
    version = result.schemaVersion;
  }
  return result;
}
