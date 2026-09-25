import { describe, it, expect } from "vitest";
import { describeMatchOutcome } from "../../frontend/src/components/Builder/FormPanel/GithubImportPanel.jsx";

const REPO = (name) => ({ name, updatedAt: "2026-01-01" });

describe("describeMatchOutcome", () => {
  it("says nothing when no JD was pasted", () => {
    const ranked = [{ repo: REPO("a"), match: { score: 0, matchedRequired: [], matchedPreferred: [] } }];
    expect(describeMatchOutcome("", ranked)).toBeNull();
    expect(describeMatchOutcome("   ", ranked)).toBeNull();
  });

  it("says nothing when there are no repos to rank", () => {
    expect(describeMatchOutcome("Looking for a React developer", [])).toBeNull();
    expect(describeMatchOutcome("Looking for a React developer", null)).toBeNull();
  });

  it("says nothing when at least one repo scored above zero", () => {
    const ranked = [
      { repo: REPO("a"), match: { score: 40, matchedRequired: ["react"], matchedPreferred: [] } },
      { repo: REPO("b"), match: { score: 0, matchedRequired: [], matchedPreferred: [] } },
    ];
    expect(describeMatchOutcome("Looking for a React developer", ranked)).toBeNull();
  });

  it("flags a JD the parser found no skills in", () => {
    const ranked = [
      { repo: REPO("a"), match: null },
      { repo: REPO("b"), match: null },
    ];
    expect(describeMatchOutcome("A great opportunity to grow with us!", ranked)).toMatch(
      /couldn't find any required or preferred skills/i
    );
  });

  it("flags a JD with skills where every repo scored zero", () => {
    const ranked = [
      { repo: REPO("a"), match: { score: 0, matchedRequired: [], matchedPreferred: [] } },
      { repo: REPO("b"), match: { score: 0, matchedRequired: [], matchedPreferred: [] } },
    ];
    expect(describeMatchOutcome("Looking for a React developer", ranked)).toMatch(
      /none of your repos match/i
    );
  });
});
