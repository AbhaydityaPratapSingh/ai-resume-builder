export const SCHEMA_VERSION = 2;

export const SECTION_KEYS = [
  "summary",
  "experience",
  "projects",
  "education",
  "skills",
  "certifications",
];

export function makeId() {
  return Math.random().toString(36).slice(2, 10);
}

export function makeBullet(original = "") {
  return { id: `b_${makeId()}`, original, suggestion: null, accepted: "original" };
}

// The renderer and any text extraction must agree on which version of a bullet
// is live, so every reader goes through this.
export function bulletText(bullet) {
  if (!bullet) return "";
  if (typeof bullet === "string") return bullet;
  if (bullet.accepted === "suggestion" && bullet.suggestion) {
    return bullet.suggestion.text || "";
  }
  return bullet.original || "";
}

export function hasPendingSuggestion(bullet) {
  return Boolean(bullet?.suggestion) && bullet.accepted !== "suggestion";
}

export function emptyResume() {
  return {
    schemaVersion: SCHEMA_VERSION,
    personal: {
      name: "",
      email: "",
      phone: "",
      location: "",
      links: [],
    },
    summary: "",
    experience: [],
    education: [],
    skills: [],
    projects: [],
    certifications: [],
    layout: {
      templateId: "classic",
      sectionOrder: [...SECTION_KEYS],
      hidden: [],
    },
    meta: {
      targetJD: "",
    },
  };
}
