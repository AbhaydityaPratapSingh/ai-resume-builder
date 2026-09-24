import { matchSkills } from "./matcher.js";

const PREFERRED_HEADINGS = [
  "good to have",
  "nice to have",
  "preferred",
  "bonus",
  "bonus points",
  "plus",
  "a plus",
];

const REQUIRED_HEADINGS = [
  "requirements",
  "required",
  "must have",
  "must-have",
  "qualifications",
  "responsibilities",
  "what you'll need",
  "what you need",
  "skills",
];

// A line counts as a heading if it's short and ends without punctuation
// (or with a colon) — mirrors how JD postings actually format section titles.
function isHeadingLine(line) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.length > 60) return false;
  return /^[A-Za-z][A-Za-z0-9 /&'-]*:?$/.test(trimmed) && trimmed === trimmed.replace(/\s+/g, " ");
}

function classifyHeading(line) {
  const lower = line.trim().toLowerCase().replace(/:$/, "");
  if (PREFERRED_HEADINGS.some((h) => lower.includes(h))) return "preferred";
  if (REQUIRED_HEADINGS.some((h) => lower.includes(h))) return "required";
  return null;
}

/**
 * Splits JD text into required/preferred buckets by heading. Text before any
 * recognized heading, and any paragraph text under an unrecognized heading,
 * is treated as required — a JD with no headings at all is entirely required.
 */
function splitSections(jdText) {
  const lines = jdText.split(/\r?\n/);
  const sections = { required: [], preferred: [] };
  let current = "required";

  for (const line of lines) {
    if (isHeadingLine(line)) {
      const classified = classifyHeading(line);
      if (classified) {
        current = classified;
        continue;
      }
    }
    sections[current].push(line);
  }

  return {
    required: sections.required.join("\n"),
    preferred: sections.preferred.join("\n"),
  };
}

const BRANCH_PATTERNS = [
  { id: "cse", label: "CSE/IT", pattern: /\b(computer science|cse|information technology|\bit\b)\b/i },
  { id: "ece", label: "ECE", pattern: /\b(electronics|ece|e&tc|e&ce)\b/i },
  { id: "eee", label: "EEE/EE", pattern: /\b(electrical|eee|\bee\b)\b/i },
  { id: "mech", label: "Mechanical", pattern: /\bmechanical\b/i },
  { id: "civil", label: "Civil", pattern: /\bcivil\b/i },
];

function extractEligibility(jdText) {
  const eligibility = {};

  const cgpaMatch = jdText.match(/(\d(?:\.\d{1,2})?)\s*(?:\+|or (?:above|higher|more))?\s*cgpa/i)
    || jdText.match(/cgpa\s*(?:of|:)?\s*(\d(?:\.\d{1,2})?)/i);
  if (cgpaMatch) eligibility.minCgpa = parseFloat(cgpaMatch[1]);

  const pctMatch = jdText.match(/(\d{1,3})\s*%\s*(?:or (?:above|higher|more))?\s*(?:aggregate|marks)?/i);
  if (pctMatch) eligibility.minPercentage = parseInt(pctMatch[1], 10);

  const yearMatch = jdText.match(/(?:batch|graduat\w*|passing out)[^.\n]{0,20}?(20\d{2})/i);
  if (yearMatch) eligibility.gradYear = parseInt(yearMatch[1], 10);

  const branches = BRANCH_PATTERNS.filter((b) => b.pattern.test(jdText)).map((b) => b.id);
  if (branches.length) eligibility.branches = branches;

  return eligibility;
}

/**
 * Parses a JD into required/preferred skill ids and eligibility criteria.
 * Runs entirely on the string — no network, no API key.
 */
export function parseJD(jdText) {
  if (!jdText?.trim()) {
    return { required: [], preferred: [], eligibility: {} };
  }

  const { required: requiredText, preferred: preferredText } = splitSections(jdText);

  const requiredSkills = matchSkills(requiredText);
  const preferredSkills = matchSkills(preferredText);
  // A skill named in both buckets counts once, as required.
  for (const id of requiredSkills) preferredSkills.delete(id);

  return {
    required: [...requiredSkills],
    preferred: [...preferredSkills],
    eligibility: extractEligibility(jdText),
  };
}
