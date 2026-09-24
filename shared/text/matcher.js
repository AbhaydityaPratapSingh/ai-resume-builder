import { SKILLS } from "./skills.js";

// Characters that matter inside a skill alias (C++, C#, .NET, Node.js) and
// must not be treated as word boundaries.
const KEEP = "+#.";

function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Word-boundary regex that tolerates the symbol characters above appearing
// inside the alias itself (so "c++" doesn't need a boundary after "+").
function aliasPattern(alias) {
  const escaped = escapeRegExp(alias.toLowerCase());
  const leadsWithWord = /^[a-z0-9]/.test(alias);
  const endsWithWord = /[a-z0-9]$/.test(alias);
  const left = leadsWithWord ? "(?<![a-z0-9])" : `(?<![a-z0-9${KEEP}])`;
  const right = endsWithWord ? "(?![a-z0-9])" : `(?![a-z0-9${KEEP}])`;
  return new RegExp(`${left}${escaped}${right}`, "i");
}

// Longest-alias-first list of {skillId, alias, regex}, so "spring boot"
// matches before the shorter "spring" alias of a different skill.
const MATCHERS = SKILLS.flatMap((skill) =>
  skill.aliases.map((alias) => ({ skillId: skill.id, alias, regex: aliasPattern(alias) }))
).sort((a, b) => b.alias.length - a.alias.length);

const CONTEXT_WORDS = ["language", "programming", "scripting", "developer", "engineer"];

// Ambiguous short names (Go, R, C) only count when another skill or a
// supporting word appears within ~40 chars, so "go to the office" or
// "we are a great fit" don't match.
function hasContext(text, index, matchedSkillIds) {
  const windowStart = Math.max(0, index - 40);
  const windowEnd = Math.min(text.length, index + 40);
  const window = text.slice(windowStart, windowEnd);
  if (CONTEXT_WORDS.some((w) => window.includes(w))) return true;
  return matchedSkillIds.size > 0;
}

/**
 * Finds every skill mentioned in `text`. Returns a Set of skill ids.
 * Ambiguous skills (Go, R, C) are included only when `hasContext` finds
 * supporting text nearby.
 */
export function matchSkills(text) {
  if (!text) return new Set();
  const normalized = ` ${text.toLowerCase()} `;
  const found = new Set();
  const ambiguousHits = [];

  for (const { skillId, regex } of MATCHERS) {
    if (found.has(skillId)) continue;
    const skill = SKILLS.find((s) => s.id === skillId);
    const match = regex.exec(normalized);
    if (!match) continue;
    if (skill?.ambiguous) {
      ambiguousHits.push({ skillId, index: match.index });
      continue;
    }
    found.add(skillId);
  }

  for (const { skillId, index } of ambiguousHits) {
    if (hasContext(normalized, index, found)) found.add(skillId);
  }

  return found;
}
