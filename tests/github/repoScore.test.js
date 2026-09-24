import { describe, it, expect } from "vitest";
import { scoreRepoAgainstJD, rankRepos } from "../../shared/text/repoScore.js";
import { parseJD } from "../../shared/text/parseJD.js";

const JD = parseJD(`
Requirements:
- React, Node.js, MongoDB

Good to have:
- Docker
`);

describe("scoreRepoAgainstJD", () => {
  it("scores 100 when every required and preferred skill is present", () => {
    const repo = { name: "Tracker", description: "", techStack: ["React", "Node.js", "MongoDB", "Docker"] };
    expect(scoreRepoAgainstJD(repo, JD).score).toBe(100);
  });

  it("weighs required skills more than preferred", () => {
    const missingRequired = { name: "A", techStack: ["Docker"] }; // only the preferred skill
    const missingPreferred = { name: "B", techStack: ["React", "Node.js", "MongoDB"] }; // all required, no preferred
    const a = scoreRepoAgainstJD(missingRequired, JD).score;
    const b = scoreRepoAgainstJD(missingPreferred, JD).score;
    expect(b).toBeGreaterThan(a);
  });

  it("scores 0 for a repo with no matching skills", () => {
    const repo = { name: "Old Project", techStack: ["COBOL"] };
    expect(scoreRepoAgainstJD(repo, JD).score).toBe(0);
  });

  it("matches skills mentioned in the description, not just techStack", () => {
    const repo = { name: "X", description: "A React app", techStack: [] };
    expect(scoreRepoAgainstJD(repo, JD).matchedRequired).toContain("React");
  });

  it("returns null when the JD has no required or preferred skills", () => {
    const emptyJD = parseJD("");
    expect(scoreRepoAgainstJD({ name: "X", techStack: ["React"] }, emptyJD)).toBeNull();
  });

  it("reports which skills matched, by label not id", () => {
    const repo = { name: "X", techStack: ["React", "MongoDB"] };
    const result = scoreRepoAgainstJD(repo, JD);
    expect(result.matchedRequired).toEqual(expect.arrayContaining(["React", "MongoDB"]));
  });
});

describe("rankRepos", () => {
  it("sorts repos by score, highest first", () => {
    const repos = [
      { name: "Low", techStack: ["COBOL"], updatedAt: "2024-01-01" },
      { name: "High", techStack: ["React", "Node.js", "MongoDB", "Docker"], updatedAt: "2024-01-01" },
      { name: "Mid", techStack: ["React"], updatedAt: "2024-01-01" },
    ];
    const ranked = rankRepos(repos, JD);
    expect(ranked.map((r) => r.repo.name)).toEqual(["High", "Mid", "Low"]);
  });

  it("breaks ties by most recently updated", () => {
    const repos = [
      { name: "Older", techStack: ["React"], updatedAt: "2023-01-01" },
      { name: "Newer", techStack: ["React"], updatedAt: "2025-01-01" },
    ];
    const ranked = rankRepos(repos, JD);
    expect(ranked.map((r) => r.repo.name)).toEqual(["Newer", "Older"]);
  });

  it("never throws on an empty repo list", () => {
    expect(rankRepos([], JD)).toEqual([]);
  });
});
