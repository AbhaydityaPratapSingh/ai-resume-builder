import { describe, it, expect } from "vitest";
import { checkBullet, jdAwareTip } from "../../shared/text/bulletChecks.js";
import { makeBullet } from "../../shared/data/emptyResume.js";

describe("checkBullet", () => {
  it("flags a weak opener", () => {
    const tips = checkBullet("Responsible for maintaining the backend service for 3 years.");
    expect(tips.map((t) => t.code)).toContain("weak-opener");
  });

  it("flags a bullet with no measurable result", () => {
    const tips = checkBullet("Built a dashboard for the operations team to track things.");
    expect(tips.map((t) => t.code)).toContain("no-result");
  });

  it("does not flag no-result when a number is present", () => {
    const tips = checkBullet("Reduced page load time by 40% across the product.");
    expect(tips.map((t) => t.code)).not.toContain("no-result");
  });

  it("flags passive voice", () => {
    const tips = checkBullet("The API was developed to serve 10,000 requests per minute.");
    expect(tips.map((t) => t.code)).toContain("passive-voice");
  });

  it("flags a bullet that's too short", () => {
    const tips = checkBullet("Built an app.");
    expect(tips.map((t) => t.code)).toContain("too-short");
  });

  it("a well-formed bullet gets no complaints", () => {
    const tips = checkBullet(
      "Built a Node.js REST API handling 10,000 requests/day, cutting average response time by 35%."
    );
    expect(tips).toEqual([]);
  });

  it("returns no tips for empty text", () => {
    expect(checkBullet("")).toEqual([]);
    expect(checkBullet(undefined)).toEqual([]);
  });
});

describe("jdAwareTip", () => {
  it("suggests mentioning a stack skill missing from the bullets", () => {
    const item = {
      techStack: ["Docker", "React"],
      bullets: [makeBullet("Built a React dashboard used by 50 students.")],
    };
    const tip = jdAwareTip(item, ["docker", "react"]);
    expect(tip.code).toBe("unshown-jd-skill");
    expect(tip.message).toContain("Docker");
  });

  it("returns null when every stack skill is already in a bullet", () => {
    const item = {
      techStack: ["React"],
      bullets: [makeBullet("Built a React dashboard used by 50 students.")],
    };
    expect(jdAwareTip(item, ["react"])).toBeNull();
  });

  it("returns null when there's no tech stack or no JD skills", () => {
    expect(jdAwareTip({ techStack: [], bullets: [] }, ["react"])).toBeNull();
    expect(jdAwareTip({ techStack: ["React"], bullets: [] }, [])).toBeNull();
  });
});
