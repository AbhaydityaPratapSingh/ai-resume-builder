import { describe, it, expect } from "vitest";
import { parseResumeText } from "../../shared/import/parseResumeText.js";
import { bulletText } from "../../shared/data/emptyResume.js";

// A resume text shaped like a typical bulleted export (Word/LaTeX/Canva),
// where every bullet carries a literal glyph — the common real-world case.
const BULLETED_RESUME = `
Aditi Sharma
aditi.sharma@example.com | +91 98765 43210 | github.com/aditi | linkedin.com/in/aditi

SUMMARY
Final-year computer engineering student focused on backend development.

EDUCATION
VIT Pune, B.Tech Computer Science
CGPA: 8.6/10

EXPERIENCE
SDE Intern, Acme Corp (May 2025 - Jul 2025)
- Built internal REST APIs used by the reporting dashboard, cutting query time by 40%.
- Wrote unit tests covering 90% of the new endpoints.

PROJECTS
Placement Tracker - React, Node.js, MongoDB
- Tracked applications across 40 companies for 300 students.
- Deployed on AWS with Docker and CI/CD via GitHub Actions.

SKILLS
Languages: Java, Python, SQL
Frameworks: React, Express, Django

ACHIEVEMENTS
- Winner, Smart India Hackathon 2025
- Finalist, national coding contest 2024

CERTIFICATIONS
AWS Cloud Practitioner, Amazon Web Services

POSITIONS OF RESPONSIBILITY
Technical Lead, Coding Club (Aug 2024 - Present)
- Organized a 200-student hackathon.
`;

describe("parseResumeText — bulleted resume", () => {
  const draft = parseResumeText(BULLETED_RESUME);

  it("extracts contact info", () => {
    expect(draft.personal.name).toBe("Aditi Sharma");
    expect(draft.personal.email).toBe("aditi.sharma@example.com");
    expect(draft.personal.phone).toContain("98765");
    expect(draft.personal.links).toEqual(
      expect.arrayContaining([
        { type: "github", url: "github.com/aditi" },
        { type: "linkedin", url: "linkedin.com/in/aditi" },
      ])
    );
  });

  it("extracts the summary", () => {
    expect(draft.summary).toContain("backend development");
  });

  it("splits experience into an entry with its bullets", () => {
    expect(draft.experience).toHaveLength(1);
    expect(draft.experience[0].role).toContain("SDE Intern");
    expect(draft.experience[0].bullets).toHaveLength(2);
    expect(bulletText(draft.experience[0].bullets[0])).toContain("REST APIs");
  });

  it("splits projects into an entry with its bullets", () => {
    expect(draft.projects).toHaveLength(1);
    expect(draft.projects[0].title).toContain("Placement Tracker");
    expect(draft.projects[0].bullets).toHaveLength(2);
  });

  it("extracts a CGPA score from the education entry", () => {
    expect(draft.education).toHaveLength(1);
    expect(draft.education[0].institution).toContain("VIT Pune");
    expect(draft.education[0].score).toEqual({ type: "cgpa", value: 8.6, outOf: 10 });
  });

  it("parses labelled skill groups", () => {
    const languages = draft.skills.find((g) => g.group === "Languages");
    expect(languages.items).toEqual(["Java", "Python", "SQL"]);
    const frameworks = draft.skills.find((g) => g.group === "Frameworks");
    expect(frameworks.items).toEqual(["React", "Express", "Django"]);
  });

  it("extracts achievements as separate items, bullet glyphs stripped", () => {
    expect(draft.achievements).toHaveLength(2);
    expect(draft.achievements[0].text).toBe("Winner, Smart India Hackathon 2025");
  });

  it("extracts certifications", () => {
    expect(draft.certifications).toHaveLength(1);
    expect(draft.certifications[0].name).toContain("AWS Cloud Practitioner");
  });

  it("extracts positions of responsibility with bullets", () => {
    expect(draft.responsibilities).toHaveLength(1);
    expect(draft.responsibilities[0].role).toContain("Technical Lead");
    expect(draft.responsibilities[0].bullets).toHaveLength(1);
  });

  it("every bullet's text is a real form answer, not invented", () => {
    const allBullets = [
      ...draft.experience.flatMap((e) => e.bullets),
      ...draft.projects.flatMap((p) => p.bullets),
    ];
    for (const b of allBullets) {
      expect(BULLETED_RESUME).toContain(bulletText(b));
    }
  });
});

describe("parseResumeText — resilience", () => {
  it("never throws on empty input", () => {
    const draft = parseResumeText("");
    expect(draft.personal.name).toBe("");
    expect(draft.experience).toEqual([]);
  });

  it("never throws on input with no recognizable headings", () => {
    const draft = parseResumeText("Just some random text\nwith no structure at all.");
    expect(draft.experience).toEqual([]);
    expect(draft.unmatched).toBe("");
  });

  it("degrades to one entry per line when bullets carry no glyph, without crashing", () => {
    const noGlyphText = `
Aditi Sharma
aditi@example.com

EXPERIENCE
SDE Intern at Acme
Built REST APIs for the dashboard
Wrote unit tests
`;
    const draft = parseResumeText(noGlyphText);
    // Each non-bulleted line becomes its own entry — not ideal, but visible
    // and editable on the review screen rather than silently merged wrong.
    expect(draft.experience.length).toBeGreaterThan(0);
    expect(draft.experience.every((e) => Array.isArray(e.bullets))).toBe(true);
  });

  it("handles a heading with trailing colon or extra spaces", () => {
    const draft = parseResumeText("Name\nemail@example.com\n\nSKILLS:\nJava, Python");
    const languages = draft.skills.find((g) => g.group === "Skills");
    expect(languages.items).toEqual(["Java", "Python"]);
  });
});
