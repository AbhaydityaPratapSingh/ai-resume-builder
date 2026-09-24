import { matchSkills } from "./matcher.js";
import { findSkill } from "./skills.js";
import { bulletText } from "../data/emptyResume.js";

const WEAK_OPENERS = [
  "worked on",
  "responsible for",
  "helped",
  "helped with",
  "involved in",
  "assisted",
  "assisted with",
  "tasked with",
];

export const ACTION_VERBS = [
  "built", "designed", "developed", "implemented", "created", "led", "reduced",
  "improved", "increased", "automated", "optimized", "launched", "architected",
  "deployed", "wrote", "refactored", "integrated", "migrated", "scaled",
  "debugged", "fixed", "shipped", "delivered", "managed", "coordinated",
  "analyzed", "tested", "configured", "mentored", "trained", "researched",
];

const PASSIVE_PATTERNS = [/\bwas (built|developed|created|designed|implemented)\b/i, /\bwere (built|developed|created|designed|implemented)\b/i];

const HAS_NUMBER = /\d/;

/**
 * Checks a single bullet's text against fixed writing rules. Every tip is
 * either a fixed rule or built from the user's own data — nothing invented.
 * Returns a list of { code, message } tips; empty list means no complaints.
 */
export function checkBullet(text) {
  const trimmed = (text || "").trim();
  const tips = [];
  if (!trimmed) return tips;

  const lower = trimmed.toLowerCase();
  const firstWord = lower.split(/\s+/)[0]?.replace(/[^a-z]/g, "");

  if (WEAK_OPENERS.some((opener) => lower.startsWith(opener))) {
    tips.push({ code: "weak-opener", message: "Start with an action verb: Built, Designed, Reduced, Automated" });
  } else if (firstWord && !ACTION_VERBS.includes(firstWord)) {
    tips.push({ code: "no-action-verb", message: "Lead with what you did" });
  }

  if (!HAS_NUMBER.test(trimmed) && !/%/.test(trimmed)) {
    tips.push({ code: "no-result", message: "Add a number: users, time saved, accuracy, size of data" });
  }

  if (PASSIVE_PATTERNS.some((p) => p.test(trimmed))) {
    tips.push({ code: "passive-voice", message: "Say who did it: \"Developed…\"" });
  }

  if (trimmed.length < 60) {
    tips.push({ code: "too-short", message: "Keep it to one or two lines — add what it did or its impact" });
  } else if (trimmed.length > 220) {
    tips.push({ code: "too-long", message: "Keep it to one or two lines" });
  }

  return tips;
}

/**
 * JD-aware tip: a skill named in this item's tech stack that the JD asks
 * for but that no bullet on the item mentions. Built entirely from the
 * user's own techStack and bullets, never invented.
 */
export function jdAwareTip(item, jdSkillIds) {
  if (!jdSkillIds?.length || !item.techStack?.length) return null;
  const stackSkills = matchSkills(item.techStack.join(", "));
  const bulletSkills = matchSkills((item.bullets || []).map(bulletText).join("\n"));

  for (const id of jdSkillIds) {
    if (stackSkills.has(id) && !bulletSkills.has(id)) {
      const skill = findSkill(id);
      if (!skill) continue;
      return {
        code: "unshown-jd-skill",
        message: `This project's tech stack lists ${skill.name}, which the JD requires. Mention it if you used it.`,
      };
    }
  }
  return null;
}
