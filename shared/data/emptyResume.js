export const SCHEMA_VERSION = 2;

export const SECTION_KEYS = [
  "summary",
  "experience",
  "projects",
  "education",
  "skills",
  "achievements",
  "responsibilities",
  "certifications",
];

// Indian placement forms distinguish schooling from degree programs — branch
// only applies to a degree, board only to Class X/XII.
export const EDUCATION_LEVELS = [
  { id: "btech", label: "B.Tech / B.E." },
  { id: "mtech", label: "M.Tech / M.E." },
  { id: "bsc", label: "B.Sc / BCA / Other UG" },
  { id: "class12", label: "Class XII" },
  { id: "class10", label: "Class X" },
  { id: "other", label: "Other" },
];

export const DEGREE_LEVELS = ["btech", "mtech", "bsc", "other"];
export const SCHOOL_LEVELS = ["class10", "class12"];

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
    achievements: [],
    responsibilities: [],
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
