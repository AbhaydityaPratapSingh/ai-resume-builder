import { ACTION_VERBS } from "./bulletChecks.js";

// Turns a project form (ARCHITECTURE.md section 9.1) into 2-3 draft
// bullets, picked by which fields are filled (section 9.2). Every word in
// a draft comes from a form answer or from this fixed vocabulary — nothing
// is invented, and nothing is guessed about facts the student didn't give.
// Drafts are meant to be edited: they come back as plain text, saved as an
// ordinary bullet's `original`, not as an AI "suggestion" needing accept.

function clean(text) {
  return (text || "").trim();
}

function lowerFirst(text) {
  return text ? text[0].toLowerCase() + text.slice(1) : text;
}

function upperFirst(text) {
  return text ? text[0].toUpperCase() + text.slice(1) : text;
}

// Drops a trailing period so a template can add its own punctuation
// without ever producing "..".
function stripTrailingPeriod(text) {
  return text.replace(/\.+\s*$/, "");
}

function joinTech(techStack, max) {
  const items = (techStack || []).filter(Boolean);
  if (!items.length) return "";
  const list = max ? items.slice(0, max) : items;
  if (list.length === 1) return list[0];
  if (list.length === 2) return `${list[0]} and ${list[1]}`;
  return `${list.slice(0, -1).join(", ")} and ${list[list.length - 1]}`;
}

// role usually already reads like a bullet fragment ("Built the backend
// and database") — if it opens with a real action verb, it's used as-is;
// otherwise it's given a neutral default verb rather than guessing one.
function roleAsClause(role) {
  const trimmed = clean(role);
  if (!trimmed) return "";
  const firstWord = trimmed.split(/\s+/)[0].toLowerCase().replace(/[^a-z]/g, "");
  if (ACTION_VERBS.includes(firstWord)) return upperFirst(stripTrailingPeriod(trimmed));
  return `Worked on ${lowerFirst(stripTrailingPeriod(trimmed))}`;
}

function templateBuiltUsingToAddress(form, techStack) {
  const built = clean(form.built);
  const tech = joinTech(techStack);
  const problem = clean(form.problem);
  if (!built || !tech || !problem) return null;
  return `Built ${lowerFirst(stripTrailingPeriod(built))} using ${tech} to address ${lowerFirst(stripTrailingPeriod(problem))}.`;
}

// Role is the one field with a stated default (ARCHITECTURE.md section
// 9.1): most solo student projects have no separate "role" to describe.
const DEFAULT_ROLE = "Built it solo";

function templateRoleForResult(form) {
  const role = clean(form.role) || DEFAULT_ROLE;
  const result = clean(form.result);
  if (!result) return null;
  return `${roleAsClause(role)}, ${lowerFirst(stripTrailingPeriod(result))}.`;
}

function templateKeyFeatureWithTech(form, techStack) {
  const keyFeature = clean(form.keyFeature);
  const tech = joinTech(techStack, 1);
  if (!keyFeature || !tech) return null;
  return `Implemented ${lowerFirst(stripTrailingPeriod(keyFeature))} with ${tech}.`;
}

function templateResultOnly(form) {
  const result = clean(form.result);
  if (!result) return null;
  return `Delivered ${lowerFirst(stripTrailingPeriod(result))}.`;
}

const TEMPLATES = [
  templateBuiltUsingToAddress,
  templateRoleForResult,
  templateKeyFeatureWithTech,
  templateResultOnly,
];

/**
 * Generates up to 3 draft bullets from a project form and tech stack.
 * Deterministic and side-effect free — same input, same drafts, every
 * time. Returns [] if too few fields are filled for any template to fire.
 */
export function generateProjectBullets(form, techStack) {
  if (!form) return [];
  const drafts = [];
  const seen = new Set();
  for (const template of TEMPLATES) {
    if (drafts.length >= 3) break;
    const draft = template(form, techStack);
    if (draft && !seen.has(draft)) {
      drafts.push(draft);
      seen.add(draft);
    }
  }
  return drafts;
}
