import { describe, it, expect } from "vitest";
import { parseJD } from "../../shared/text/parseJD.js";
import { scoreResume } from "../../shared/text/score.js";
import { emptyResume, makeBullet, makeId } from "../../shared/data/emptyResume.js";

function resumeWith({ skills = [], projects = [], education = [] } = {}) {
  const r = emptyResume();
  r.skills = skills;
  r.projects = projects;
  r.education = education;
  return r;
}

describe("scoreResume", () => {
  const jd = parseJD(`
Requirements:
- React, Node.js, MongoDB
- CGPA of 7 or above

Good to have:
- Docker
  `);

  it("scores 100 when every required and preferred skill is matched and shown in a bullet", () => {
    const resume = resumeWith({
      skills: [{ id: "s1", group: "Skills", items: ["React", "Node.js", "MongoDB", "Docker"] }],
      projects: [
        {
          id: "p1",
          title: "App",
          techStack: ["React", "Node.js", "MongoDB", "Docker"],
          bullets: [makeBullet("Built an app using React, Node.js, MongoDB and Docker to serve 500 users.")],
        },
      ],
    });
    const result = scoreResume(resume, jd);
    expect(result.score).toBe(100);
    expect(result.missingRequired).toEqual([]);
    expect(result.missingPreferred).toEqual([]);
  });

  it("scores lower when required skills are missing", () => {
    const resume = resumeWith({ skills: [{ id: "s1", group: "Skills", items: ["React"] }] });
    const result = scoreResume(resume, jd);
    expect(result.score).toBeLessThan(50);
    expect(result.missingRequired).toEqual(expect.arrayContaining(["Node.js", "MongoDB"]));
  });

  it("is deterministic: same resume and JD give the same score every time", () => {
    const resume = resumeWith({ skills: [{ id: "s1", group: "Skills", items: ["React", "MongoDB"] }] });
    const a = scoreResume(resume, jd);
    const b = scoreResume(resume, jd);
    expect(a.score).toBe(b.score);
    expect(a).toEqual(b);
  });

  it("rewards a skill shown in a bullet over one only listed", () => {
    const listedOnly = resumeWith({
      skills: [{ id: "s1", group: "Skills", items: ["React", "Node.js", "MongoDB"] }],
    });
    const shownInBullet = resumeWith({
      skills: [{ id: "s1", group: "Skills", items: ["React", "Node.js", "MongoDB"] }],
      projects: [
        {
          id: "p1",
          title: "App",
          techStack: ["React"],
          bullets: [makeBullet("Built with React, Node.js and MongoDB, cutting load time by 30%.")],
        },
      ],
    });
    expect(scoreResume(shownInBullet, jd).score).toBeGreaterThan(scoreResume(listedOnly, jd).score);
  });

  it("checks CGPA eligibility against the education section", () => {
    const below = resumeWith({ education: [{ id: "e1", degree: "B.Tech", score: "6.8 CGPA" }] });
    const above = resumeWith({ education: [{ id: "e1", degree: "B.Tech", score: "8.2/10 CGPA" }] });
    expect(scoreResume(below, jd).eligibility.find((c) => c.id === "cgpa").passed).toBe(false);
    expect(scoreResume(above, jd).eligibility.find((c) => c.id === "cgpa").passed).toBe(true);
  });

  it("suggests the section with more matched skills first", () => {
    const resume = resumeWith({
      projects: [
        { id: "p1", title: "Low match", techStack: ["Java"], bullets: [makeBullet("Wrote Java tools for internal use, saving 5 hours a week.")] },
      ],
    });
    resume.experience = [
      {
        id: "x1",
        role: "Intern",
        company: "Acme",
        bullets: [makeBullet("Built a React and Node.js dashboard used by 200 employees.")],
      },
    ];
    const result = scoreResume(resume, jd);
    expect(result.suggestedOrder[0]).toBe("experience");
  });

  it("handles a JD with no required or preferred skills without crashing", () => {
    const emptyJd = parseJD("");
    const result = scoreResume(resumeWith(), emptyJd);
    expect(result.score).toBe(100);
  });
});
