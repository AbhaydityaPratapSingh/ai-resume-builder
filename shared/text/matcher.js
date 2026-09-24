import { SKILLS } from "./skills.js";

// Characters that matter inside a skill alias (C++, C#, .NET, Node.js) and
// must not be treated as word boundaries.
//
// Left and right use different sets: a leading "." (".NET") needs guarding
// on the left so it isn't read as a continuation of a preceding token, but
// a trailing "." after a symbol-ending alias (a bullet ending "...C++.")
// is virtually always sentence punctuation, never part of the skill name —
// including "." in the right-side set silently dropped that match.
const KEEP_LEFT = "+#.";
const KEEP_RIGHT = "+#";

function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Word-boundary regex that tolerates the symbol characters above appearing
// inside the alias itself (so "c++" doesn't need a boundary after "+").
function aliasPattern(alias) {
  const escaped = escapeRegExp(alias.toLowerCase());
  const leadsWithWord = /^[a-z0-9]/.test(alias);
  const endsWithWord = /[a-z0-9]$/.test(alias);
  const left = leadsWithWord ? "(?<![a-z0-9])" : `(?<![a-z0-9${KEEP_LEFT}])`;
  const right = endsWithWord ? "(?![a-z0-9])" : `(?![a-z0-9${KEEP_RIGHT}])`;
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

// A candidate span only loses to an already-claimed span when it's glued to
// the rest of that span by punctuation, not real whitespace — "js" stuck to
// "node.js" via "." is a fragment of one compound token and must not also
// count as JavaScript, but "Ruby" in "Ruby on Rails" is a genuine standalone
// word (space on both sides) and must still count as Ruby even though "Ruby
// on Rails" already claimed the whole phrase for the Rails skill. Same
// distinction the aliasPattern boundary already draws for symbol characters.
function overlapsGlued(start, end, text, claimed) {
  for (const [s, e] of claimed) {
    if (start >= e || end <= s) continue; // no overlap with this span at all
    const leftGlued = start <= s || KEEP_LEFT.includes(text[start - 1] || "");
    const rightGlued = end >= e || KEEP_RIGHT.includes(text[end] || "");
    if (leftGlued && rightGlued) return true;
  }
  return false;
}

// Every match of `regex` in `text` that isn't glue-overlapping anything
// already in `claimed`. A skill mentioned more than once (e.g. "Next.js" in
// both a title and a requirements line) must have EVERY occurrence claimed —
// stopping after the first leaves later ones open for a shorter, different
// skill's alias to match inside (e.g. "js" inside the second "Next.js").
function allUnclaimedMatches(regex, text, claimed) {
  regex.lastIndex = 0;
  const matches = [];
  let match;
  while ((match = regex.exec(text))) {
    const start = match.index;
    const end = start + match[0].length;
    if (!overlapsGlued(start, end, text, claimed)) matches.push({ index: start, end });
    if (regex.lastIndex === match.index) regex.lastIndex++; // guard zero-width
  }
  return matches;
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
    const matches = allUnclaimedMatches(regex, normalized, claimed);
    if (!matches.length) continue;
    if (skill?.ambiguous) {
      for (const m of matches) ambiguousHits.push({ skillId, index: m.index, end: m.end });
      continue;
    }
    found.add(skillId);
    // Claim every occurrence, not just the first, so a repeated skill
    // mention doesn't leave a later one open to a different, shorter alias.
    for (const m of matches) {
      matchedPositions.push(m.index);
      claimed.push([m.index, m.end]);
    }
  }

  for (const { skillId, index, end } of ambiguousHits) {
    if (found.has(skillId)) {
      claimed.push([index, end]);
      continue;
    }
    if (hasContext(normalized, index, matchedPositions)) {
      found.add(skillId);
      claimed.push([index, end]);
    }
  }

  return found;
}
