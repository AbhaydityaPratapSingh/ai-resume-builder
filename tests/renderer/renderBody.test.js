import { describe, it, expect } from "vitest";
import { renderResumeBodyHTML } from "../../shared/templates/renderBody.js";
import { emptyResume, makeBullet } from "../../shared/data/emptyResume.js";

function resumeWith(overrides) {
  return { ...emptyResume(), ...overrides };
}

describe("renderResumeBodyHTML — Indian placement fields", () => {
  it("renders a structured CGPA score", () => {
    const html = renderResumeBodyHTML(
      resumeWith({
        education: [
          {
            id: "e1",
            institution: "VIT Pune",
            degree: "B.Tech",
            branch: "Computer Science",
            score: { type: "cgpa", value: 8.6, outOf: 10 },
          },
        ],
      })
    );
    expect(html).toContain("CGPA 8.6/10");
    expect(html).toContain("B.Tech, Computer Science");
  });

  it("renders a structured percentage score", () => {
    const html = renderResumeBodyHTML(
      resumeWith({
        education: [{ id: "e1", institution: "DPS", level: "class12", board: "CBSE", score: { type: "percentage", value: 92 } }],
      })
    );
    expect(html).toContain("92%");
    expect(html).toContain("CBSE");
  });

  it("normalizes a legacy free-text CGPA/percentage score to the same display format as structured scores", () => {
    const html = renderResumeBodyHTML(
      resumeWith({ education: [{ id: "e1", institution: "VIT", degree: "B.Tech", score: "8.6/10 CGPA" }] })
    );
    expect(html).toContain("CGPA 8.6/10");
  });

  it("falls back to legacy score text verbatim when it doesn't match a known pattern", () => {
    const html = renderResumeBodyHTML(
      resumeWith({ education: [{ id: "e1", institution: "VIT", degree: "B.Tech", score: "First class with distinction" }] })
    );
    expect(html).toContain("First class with distinction");
  });

  it("renders achievements as a bullet list", () => {
    const html = renderResumeBodyHTML(
      resumeWith({ achievements: [{ id: "a1", text: "Winner, Smart India Hackathon 2025" }] })
    );
    expect(html).toContain("Achievements");
    expect(html).toContain("Winner, Smart India Hackathon 2025");
  });

  it("renders positions of responsibility with bullets", () => {
    const html = renderResumeBodyHTML(
      resumeWith({
        responsibilities: [
          {
            id: "r1",
            role: "Technical Lead",
            org: "Coding Club",
            bullets: [makeBullet("Organized a 200-student hackathon.")],
          },
        ],
      })
    );
    expect(html).toContain("Positions of Responsibility");
    expect(html).toContain("Technical Lead");
    expect(html).toContain("Coding Club");
    expect(html).toContain("Organized a 200-student hackathon.");
  });

  it("omits empty achievements/responsibilities sections", () => {
    const html = renderResumeBodyHTML(resumeWith());
    expect(html).not.toContain("Achievements");
    expect(html).not.toContain("Positions of Responsibility");
  });

  it("escapes hostile strings in the new sections", () => {
    const html = renderResumeBodyHTML(
      resumeWith({ achievements: [{ id: "a1", text: "<script>alert(1)</script>" }] })
    );
    expect(html).not.toContain("<script>alert(1)</script>");
    expect(html).toContain("&lt;script&gt;");
  });
});

describe("renderResumeBodyHTML — projects", () => {
  it("renders a project's link, dates and tech stack", () => {
    const html = renderResumeBodyHTML(
      resumeWith({
        projects: [
          {
            id: "p1",
            title: "Placement Tracker",
            link: "github.com/a/tracker",
            startDate: "Jan 2026",
            endDate: "Mar 2026",
            techStack: ["React", "Node.js"],
            bullets: [makeBullet("Tracked 40 companies.")],
          },
        ],
      })
    );
    expect(html).toContain('href="https://github.com/a/tracker"');
    expect(html).toContain("Placement Tracker");
    expect(html).toContain("Jan 2026");
    expect(html).toContain("React");
  });

  it("never shows a bare 'Present' when no start date was entered", () => {
    const html = renderResumeBodyHTML(
      resumeWith({
        projects: [{ id: "p1", title: "Solo project", bullets: [makeBullet("Built it.")] }],
      })
    );
    expect(html).not.toContain("Present");
  });

  it("never shows a bare 'Present' for experience or education with no start date", () => {
    const html = renderResumeBodyHTML(
      resumeWith({
        experience: [{ id: "e1", role: "Intern", company: "Acme", bullets: [makeBullet("Did work.")] }],
        education: [{ id: "ed1", institution: "VIT" }],
      })
    );
    expect(html).not.toContain("Present");
  });
});
