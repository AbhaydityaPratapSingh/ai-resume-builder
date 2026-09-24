import { matchSkills } from "./matcher.js";
import { findSkill } from "./skills.js";
import { bulletText } from "../data/emptyResume.js";

function resumeSkillListText(resumeData) {
  return (resumeData.skills || []).flatMap((g) => g.items || []).join(", ");
}

function bulletsBySection(resumeData) {
  const experience = resumeData.experience || [];
  const projects = resumeData.projects || [];
  return { experience, projects };
}

function allBulletText(resumeData) {
  const { experience, projects } = bulletsBySection(resumeData);
  const items = [...experience, ...projects];
  return items.flatMap((item) => (item.bullets || []).map(bulletText)).join("\n");
}

function fullResumeText(resumeData) {
  const summary = typeof resumeData.summary === "string" ? resumeData.summary : (resumeData.summary?.text || "");
  return [resumeSkillListText(resumeData), summary, allBulletText(resumeData)].join("\n");
}

function skillLabels(ids) {
  return ids.map((id) => findSkill(id)?.name || id);
}

function parseScoreValue(score) {
  if (!score) return null;
  if (typeof score === "object" && typeof score.value === "number") return score;
  if (typeof score === "string") {
    const cgpaMatch = score.match(/(\d(?:\.\d{1,2})?)\s*(?:\/\s*10)?\s*cgpa/i);
    if (cgpaMatch) return { type: "cgpa", value: parseFloat(cgpaMatch[1]), outOf: 10 };
    const pctMatch = score.match(/(\d{1,3}(?:\.\d{1,2})?)\s*%/);
    if (pctMatch) return { type: "percentage", value: parseFloat(pctMatch[1]) };
  }
  return null;
}

function checkEligibility(resumeData, eligibility) {
  const checks = [];
  const education = resumeData.education || [];

  if (eligibility.minCgpa != null) {
    const best = education
      .map((e) => parseScoreValue(e.score))
      .filter((s) => s && s.type === "cgpa")
      .sort((a, b) => b.value - a.value)[0];
    if (best) {
      checks.push({
        id: "cgpa",
        label: `CGPA ${eligibility.minCgpa}+ required`,
        passed: best.value >= eligibility.minCgpa,
        detail: `Your highest listed CGPA is ${best.value}.`,
      });
    } else {
      checks.push({
        id: "cgpa",
        label: `CGPA ${eligibility.minCgpa}+ required`,
        passed: null,
        detail: "No CGPA found in your education section to check against.",
      });
    }
  }

  if (eligibility.minPercentage != null) {
    const best = education
      .map((e) => parseScoreValue(e.score))
      .filter((s) => s && s.type === "percentage")
      .sort((a, b) => b.value - a.value)[0];
    if (best) {
      checks.push({
        id: "percentage",
        label: `${eligibility.minPercentage}%+ required`,
        passed: best.value >= eligibility.minPercentage,
        detail: `Your highest listed percentage is ${best.value}%.`,
      });
    }
  }

  if (eligibility.gradYear != null) {
    const endYears = education
      .map((e) => parseInt(String(e.end ?? e.endDate ?? "").match(/\d{4}/)?.[0], 10))
      .filter((y) => Number.isFinite(y));
    if (endYears.length) {
      const matches = endYears.includes(eligibility.gradYear);
      checks.push({
        id: "gradYear",
        label: `Graduating in ${eligibility.gradYear} required`,
        passed: matches,
        detail: matches
          ? `Matches your listed graduation year.`
          : `Your listed graduation year(s): ${endYears.join(", ")}.`,
      });
    }
  }

  if (eligibility.branches?.length) {
    const degreeText = education.map((e) => `${e.degree || ""} ${e.branch || ""}`).join(" ").toLowerCase();
    const matched = eligibility.branches.some((b) => {
      if (b === "cse") return /computer|information technology|\bit\b/.test(degreeText);
      if (b === "ece") return /electronics/.test(degreeText);
      if (b === "eee") return /electrical/.test(degreeText);
      if (b === "mech") return /mechanical/.test(degreeText);
      if (b === "civil") return /civil/.test(degreeText);
      return false;
    });
    checks.push({
      id: "branch",
      label: "Branch eligibility",
      passed: degreeText.trim() ? matched : null,
      detail: degreeText.trim()
        ? (matched ? "Your branch matches the JD's allowed branches." : "Your listed branch doesn't match the JD's allowed branches.")
        : "No branch/degree found in your education section to check against.",
    });
  }

  return checks;
}

function suggestSectionOrder(resumeData, requiredIds, preferredIds) {
  const relevantIds = new Set([...requiredIds, ...preferredIds]);
  const { experience, projects } = bulletsBySection(resumeData);

  function countMatches(item) {
    const text = [(item.techStack || []).join(" "), (item.bullets || []).map(bulletText).join(" ")].join(" ");
    const found = matchSkills(text);
    let n = 0;
    for (const id of found) if (relevantIds.has(id)) n++;
    return n;
  }

  const scored = [];
  if (experience.length) scored.push({ key: "experience", count: experience.reduce((s, e) => s + countMatches(e), 0) });
  if (projects.length) scored.push({ key: "projects", count: projects.reduce((s, p) => s + countMatches(p), 0) });

  return scored.sort((a, b) => b.count - a.count).map((s) => s.key);
}

/**
 * Scores a resume against a parsed JD. Deterministic: the same resume and
 * parsed JD always produce the same score. See ARCHITECTURE.md section 7.3
 * for the weighting rationale.
 */
export function scoreResume(resumeData, parsedJD) {
  const { required = [], preferred = [] } = parsedJD;
  const text = fullResumeText(resumeData);
  const resumeSkills = matchSkills(text);
  const bulletSkills = matchSkills(allBulletText(resumeData));

  const matchedRequired = required.filter((id) => resumeSkills.has(id));
  const missingRequired = required.filter((id) => !resumeSkills.has(id));
  const matchedPreferred = preferred.filter((id) => resumeSkills.has(id));
  const missingPreferred = preferred.filter((id) => !resumeSkills.has(id));

  const matchedAny = [...matchedRequired, ...matchedPreferred];
  const shownInBullet = matchedAny.filter((id) => bulletSkills.has(id));

  const requiredPct = required.length ? matchedRequired.length / required.length : 1;
  const preferredPct = preferred.length ? matchedPreferred.length / preferred.length : 1;
  // No matched skills to show anywhere means nothing to penalize — full
  // credit, same as the required/preferred terms above when the JD asks
  // for nothing in that bucket.
  const bonusPct = matchedAny.length ? shownInBullet.length / matchedAny.length : 1;

  const score = Math.round(70 * requiredPct + 20 * preferredPct + 10 * bonusPct);

  return {
    score,
    breakdown: {
      requiredPct: Math.round(requiredPct * 100),
      preferredPct: Math.round(preferredPct * 100),
      bonusPct: Math.round(bonusPct * 100),
    },
    matchedRequired: skillLabels(matchedRequired),
    missingRequired: skillLabels(missingRequired),
    matchedPreferred: skillLabels(matchedPreferred),
    missingPreferred: skillLabels(missingPreferred),
    eligibility: checkEligibility(resumeData, parsedJD.eligibility || {}),
    suggestedOrder: suggestSectionOrder(resumeData, required, preferred),
  };
}
