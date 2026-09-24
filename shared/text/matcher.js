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
  // Global so every occurrence can be checked against already-claimed spans,
  // not just the first.
  return new RegExp(`${left}${escaped}${right}`, "gi");
}

// Longest-alias-first list of {skillId, alias, regex}, so "spring boot"
// matches before the shorter "spring" alias of a different skill, and so a
// short alias belonging to one skill (e.g. "js") can be excluded when it
// falls inside a span a longer alias of a DIFFERENT skill already claimed
// (e.g. "js" inside "Node.js" must not also count as JavaScript).
const MATCHERS = SKILLS.flatMap((skill) =>
  skill.aliases.map((alias) => ({ skillId: skill.id, alias, regex: aliasPattern(alias) }))
).sort((a, b) => b.alias.length - a.alias.length);

function overlaps(start, end, claimed) {
  return claimed.some(([s, e]) => start < e && end > s);
}

// First match of `regex` in `text` whose span doesn't overlap anything in
// `claimed`, or null. Resets the shared global regex's lastIndex each call.
function firstUnclaimedMatch(regex, text, claimed) {
  regex.lastIndex = 0;
  let match;
  while ((match = regex.exec(text))) {
    const start = match.index;
    const end = start + match[0].length;
    if (!overlaps(start, end, claimed)) return { index: start, end };
    if (regex.lastIndex === match.index) regex.lastIndex++; // guard zero-width
  }
  return null;
}

const CONTEXT_WORDS = ["language", "programming", "scripting", "developer", "engineer"];
const CONTEXT_WINDOW = 40;

// Ambiguous short names (Go, R, C) only count when another skill or a
// supporting word appears within ~40 chars of THIS occurrence — not merely
// anywhere in the document, or "Python developer... R&D team" would count
// bare "R" as the R language just because Python was matched elsewhere.
function hasContext(text, index, matchedPositions) {
  const windowStart = Math.max(0, index - CONTEXT_WINDOW);
  const windowEnd = Math.min(text.length, index + CONTEXT_WINDOW);
  const window = text.slice(windowStart, windowEnd);
  if (CONTEXT_WORDS.some((w) => window.includes(w))) return true;
  return matchedPositions.some((pos) => pos >= windowStart && pos <= windowEnd);
}

/**
 * Finds every skill mentioned in `text`. Returns a Set of skill ids.
 * Ambiguous skills (Go, R, C) are included only when `hasContext` finds
 * supporting text nearby the specific occurrence being considered.
 */
export function matchSkills(text) {
  if (!text) return new Set();
  const normalized = ` ${text.toLowerCase()} `;
  const found = new Set();
  const matchedPositions = [];
  const claimed = [];
  const ambiguousHits = [];

  for (const { skillId, regex } of MATCHERS) {
    if (found.has(skillId)) continue;
    const skill = SKILLS.find((s) => s.id === skillId);
    const match = firstUnclaimedMatch(regex, normalized, claimed);
    if (!match) continue;
    if (skill?.ambiguous) {
      ambiguousHits.push({ skillId, index: match.index, end: match.end });
      continue;
    }
    found.add(skillId);
    matchedPositions.push(match.index);
    claimed.push([match.index, match.end]);
  }

  for (const { skillId, index, end } of ambiguousHits) {
    if (hasContext(normalized, index, matchedPositions)) {
      found.add(skillId);
      claimed.push([index, end]);
    }
  }

  return found;
}
