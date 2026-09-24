import { matchSkills } from "./matcher.js";
import { findSkill } from "./skills.js";

function skillLabels(ids) {
  return [...ids].map((id) => findSkill(id)?.name || id);
}

/**
 * Scores one GitHub repo against a parsed JD (shared/text/parseJD.js), the
 * same way scoreResume() scores a whole resume — required skills count
 * double, preferred skills count once. `repo.techStack` is a list of skill
 * names already mapped from the repo's manifest deps and languages (see
 * backend/src/services/githubRepos.js); this function itself makes no
 * network call and knows nothing about GitHub.
 *
 * Returns null when the JD has no required/preferred skills to match
 * against — there's nothing to rank by, so every repo would tie at 0.
 */
export function scoreRepoAgainstJD(repo, parsedJD) {
  const { required = [], preferred = [] } = parsedJD || {};
  if (!required.length && !preferred.length) return null;

  const text = [repo.name, repo.description, (repo.techStack || []).join(" ")]
    .filter(Boolean)
    .join("\n");
  const repoSkills = matchSkills(text);

  const matchedRequired = required.filter((id) => repoSkills.has(id));
  const matchedPreferred = preferred.filter((id) => repoSkills.has(id));

  const weightTotal = required.length * 2 + preferred.length;
  const weightMatched = matchedRequired.length * 2 + matchedPreferred.length;
  const score = weightTotal ? Math.round((weightMatched / weightTotal) * 100) : 0;

  return {
    score,
    matchedRequired: skillLabels(matchedRequired),
    matchedPreferred: skillLabels(matchedPreferred),
  };
}

/**
 * Ranks repos by score against a parsed JD, highest first, ties broken by
 * most recently updated. Repos that scored null (nothing to match against)
 * or 0 are still included — the caller decides whether to hide them — but
 * are always ranked after any repo with a positive score.
 */
export function rankRepos(repos, parsedJD) {
  return repos
    .map((repo) => ({ repo, match: scoreRepoAgainstJD(repo, parsedJD) }))
    .sort((a, b) => {
      const scoreA = a.match?.score ?? -1;
      const scoreB = b.match?.score ?? -1;
      if (scoreB !== scoreA) return scoreB - scoreA;
      return (b.repo.updatedAt || "").localeCompare(a.repo.updatedAt || "");
    });
}
