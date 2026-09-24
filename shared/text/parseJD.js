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

// The bare "IT" abbreviation is checked separately, case-sensitively (see
// below) — "it" lowercase is one of the most common words in English
// prose and would otherwise false-positive on almost any JD that isn't a
// dry bullet list, not just ones that actually restrict eligibility to
// IT graduates. Found via a real posting whose only uses of "it" were the
// pronoun ("you already use it daily... check it").
const BRANCH_PATTERNS = [
  { id: "cse", label: "CSE/IT", pattern: /\b(computer science|cse|information technology)\b/i },
  { id: "ece", label: "ECE", pattern: /\b(electronics|ece|e&tc|e&ce)\b/i },
  { id: "eee", label: "EEE/EE", pattern: /\b(electrical|eee|\bee\b)\b/i },
  { id: "mech", label: "Mechanical", pattern: /\bmechanical\b/i },
  { id: "civil", label: "Civil", pattern: /\bcivil\b/i },
];
// Same rationale, case-sensitive: only counts as a CSE/IT signal when
// written the way the abbreviation actually is, "IT" — never "it" or "It".
const BARE_IT_RE = /\bIT\b/;

function extractEligibility(jdText) {
  const eligibility = {};

  const cgpaMatch = jdText.match(/(\d(?:\.\d{1,2})?)\s*(?:\+|or (?:above|higher|more))?\s*cgpa/i)
    || jdText.match(/cgpa\s*(?:of|:)?\s*(\d(?:\.\d{1,2})?)/i);
  if (cgpaMatch) eligibility.minCgpa = parseFloat(cgpaMatch[1]);

  // Requires an actual eligibility-style context word, not just any bare
  // "N%" anywhere in the document — found via a real JD whose
  // "maximum of 30% occupancy of the role" (a responsibility split, not a
  // score) was being read as a 30% academic cutoff, ahead of the real
  // "minimum 73-75% aggregate" later in the same posting. The leading
  // "minimum" alternative allows up to 30 chars before the number (real
  // postings write "Minimum Academic Score: CGPA 6.0 / 60%", not always
  // "minimum" directly against the figure), bounded to one sentence so it
  // can't reach into unrelated text.
  const pctMatch =
    jdText.match(/minimum[^.\n]{0,30}?(\d{1,3}(?:\.\d{1,2})?)\s*%/i) ||
    jdText.match(
      /(\d{1,3}(?:\.\d{1,2})?)\s*%\s*(?:or (?:above|higher|more)|and above|or more|aggregate|marks|throughout|overall)/i
    );
  if (pctMatch) eligibility.minPercentage = parseFloat(pctMatch[1]);

  // Tries trigger-word-then-year first ("graduating in 2026"), then falls
  // back to year-then-trigger ("2027 graduating batch", "2027 Passout") —
  // found via two independent real postings that both write the year
  // first, which the original trigger-first-only pattern never matched.
  const yearMatch =
    jdText.match(/(?:batch|graduat\w*|passing out|passout)[^.\n]{0,20}?(20\d{2})/i) ||
    jdText.match(/(20\d{2})[^.\n]{0,20}?(?:batch|graduat\w*|passing out|passout)/i);
  if (yearMatch) eligibility.gradYear = parseInt(yearMatch[1], 10);

  const branches = BRANCH_PATTERNS.filter((b) => b.pattern.test(jdText)).map((b) => b.id);
  if (BARE_IT_RE.test(jdText) && !branches.includes("cse")) branches.push("cse");
  // A JD can name specific disciplines only to illustrate that it doesn't
  // care which one a candidate studied — found via a real posting that
  // said "we don't shortlist based on branch... whether you studied
  // Computer Science, Electronics, or something entirely different" and
  // still matched cse/ece from those very names. An explicit
  // branch-agnostic phrase anywhere overrides any branch names matched.
  const branchAgnostic = /\b(any branch|any discipline|all branches|open to all branches|regardless of branch|branch[\s-]agnostic|don'?t shortlist based on branch)\b/i;
  if (branches.length && !branchAgnostic.test(jdText)) eligibility.branches = branches;

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
