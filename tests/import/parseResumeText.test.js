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

// A real bug: PDF text extraction wraps a long bullet sentence across two
// lines with no marker on the continuation line — indistinguishable, by
// glyph alone, from a brand-new entry's header. Before this fix, every
// wrapped continuation became its own fake entry, so a resume with 2-3 real
// projects could come back reporting dozens of "projects" — reported
// against a real PDF resume (see shared/import/parseResumeText.js).
describe("parseResumeText — wrapped-line continuations don't fragment into fake entries", () => {
  it("merges a bullet whose sentence wraps across two lines into one bullet, one project", () => {
    const draft = parseResumeText(`
Aditi Sharma
aditi@example.com

PROJECTS
Placement Tracker - React, Node.js, MongoDB
- Tracked applications across 40 companies for 300 students and sent automated
reminders before every deadline.
- Deployed on AWS with Docker and CI/CD via GitHub Actions, cutting release time
by half.
    `);
    expect(draft.projects).toHaveLength(1);
    expect(draft.projects[0].title).toBe("Placement Tracker - React, Node.js, MongoDB");
    expect(draft.projects[0].bullets).toHaveLength(2);
    expect(bulletText(draft.projects[0].bullets[0])).toBe(
      "Tracked applications across 40 companies for 300 students and sent automated reminders before every deadline."
    );
    expect(bulletText(draft.projects[0].bullets[1])).toBe(
      "Deployed on AWS with Docker and CI/CD via GitHub Actions, cutting release time by half."
    );
  });

  it("merges a lone punctuation fragment left over from a wrap, instead of making it its own entry", () => {
    const draft = parseResumeText(`
Aditi Sharma
aditi@example.com

PROJECTS
Tracker
- Built a system for tracking things across many teams and departments in the
org
.
    `);
    expect(draft.projects).toHaveLength(1);
    expect(bulletText(draft.projects[0].bullets[0])).toBe(
      "Built a system for tracking things across many teams and departments in the org."
    );
  });

  it("merges a wrapped achievement into one item instead of two", () => {
    const draft = parseResumeText(`
Aditi Sharma
aditi@example.com

ACHIEVEMENTS
- Winner, Smart India Hackathon 2025, selected among 4000 teams across the
country for the final round
- Finalist, national coding contest 2024
    `);
    expect(draft.achievements).toHaveLength(2);
    expect(draft.achievements[0].text).toBe(
      "Winner, Smart India Hackathon 2025, selected among 4000 teams across the country for the final round"
    );
    expect(draft.achievements[1].text).toBe("Finalist, national coding contest 2024");
  });

  it("still starts a new entry when a completed sentence is followed by a genuinely new header", () => {
    const draft = parseResumeText(`
Aditi Sharma
aditi@example.com

PROJECTS
First Project
- Did the first thing well.
Second Project
- Did the second thing too.
    `);
    expect(draft.projects).toHaveLength(2);
    expect(draft.projects[0].title).toBe("First Project");
    expect(draft.projects[1].title).toBe("Second Project");
  });

  it("does not fragment a resume with several real, unrelated wrapped bullets across projects", () => {
    const draft = parseResumeText(`
Aditi Sharma
aditi@example.com

PROJECTS
Placement Tracker - React, Node.js, MongoDB
- Tracked applications across 40 companies for 300 students and sent automated
reminders before every deadline.
- Deployed on AWS with Docker and CI/CD via GitHub Actions, cutting release time
by half.

Study Buddy - Flutter, Firebase
- Built a peer-matching app used by 200 students preparing for placement
season together.
- Added a real-time chat feature backed by Firebase, which cut response time
for study groups significantly.
    `);
    expect(draft.projects).toHaveLength(2);
    expect(draft.projects[0].bullets).toHaveLength(2);
    expect(draft.projects[1].bullets).toHaveLength(2);
  });

  it("keeps a 'Relevant Coursework:' line as part of the institution above it, not a new education entry", () => {
    // The line right before this one (a CGPA line) ends in a period, so by
    // isContinuationLine alone it looks like a completed sentence — without
    // recognizing the labeled-field shape too, the real field after it read
    // as a brand-new institution.
    const draft = parseResumeText(`
Aditi Sharma
aditi@example.com

EDUCATION
SRM Institute of Science and TechnologyKattankulathur, TN
CGPA 8.35/10.
Relevant Coursework:Data Structures & Algorithms, Object-Oriented Programming, Database Management
Systems, Machine Learning.
    `);
    expect(draft.education).toHaveLength(1);
    expect(draft.education[0].score).toEqual({ type: "cgpa", value: 8.35, outOf: 10 });
    // The wrapped continuation ("Systems, Machine Learning.") is the same
    // phrase as "Database Management" split by the PDF's line break, so it
    // joins with a space, not the ", " used between genuinely separate
    // fields — "Database Management Systems" is one course name.
    expect(draft.education[0].degree).toContain("Database Management Systems, Machine Learning.");
  });
});

describe("parseResumeText — bullet glyph extracted on its own line", () => {
  const draft = parseResumeText(`
Aditi Sharma
aditi@example.com

PROJECTS
Placement Tracker - React, Node.js
•
Tracked applications across 40 companies for 300 students.
•
Deployed on AWS with Docker.
Study Buddy - Flutter
•Built a peer-matching app.

ACHIEVEMENTS
•
Winner, Smart India Hackathon 2025
•
Finalist, national coding contest 2024
  `);

  it("attaches the text after a glyph-only line as a bullet of the right project", () => {
    expect(draft.projects.map((p) => p.title)).toEqual([
      "Placement Tracker - React, Node.js",
      "Study Buddy - Flutter",
    ]);
    expect(draft.projects[0].bullets.map(bulletText)).toEqual([
      "Tracked applications across 40 companies for 300 students.",
      "Deployed on AWS with Docker.",
    ]);
    expect(draft.projects[1].bullets.map(bulletText)).toEqual(["Built a peer-matching app."]);
  });

  it("never leaves a stray glyph in titles or achievements", () => {
    expect(draft.achievements.map((a) => a.text)).toEqual([
      "Winner, Smart India Hackathon 2025",
      "Finalist, national coding contest 2024",
    ]);
    for (const p of draft.projects) expect(p.title).not.toContain("•");
  });

  it("doesn't treat a leading hyphen without a space as a bullet", () => {
    const d = parseResumeText("Name\nx@example.com\n\nACHIEVEMENTS\n-5% churn after redesign");
    expect(d.achievements[0].text).toBe("-5% churn after redesign");
  });
});

// Shapes taken from a real pdf-parse extraction of a LaTeX resume: location
// and dates glued onto the previous text with no space, degree sharing a
// line with the CGPA, and a skills line wrapped after a trailing comma.
describe("parseResumeText — real pdf-parse education/skills shapes", () => {
  const draft = parseResumeText(`
Aditi Sharma
aditi@example.com
Education
VIT Institute of TechnologyVellore, TN
B.Tech, Computer Science and Engineering (AI); CGPA: 8.35/10.0Expected May 2027
•
Relevant Coursework:Operating Systems, Computer Networks
Technical Skills
Languages:  C++, Python, SQL
CS Fundamentals:  Data Structures & Algorithms, Operating Systems,
Databases, Machine Learning
  `);

  it("keeps the degree that shares a line with the CGPA, and extracts score and date", () => {
    const edu = draft.education;
    expect(edu).toHaveLength(1);
    expect(edu[0].institution).toBe("VIT Institute of Technology, Vellore, TN");
    expect(edu[0].degree).toContain("B.Tech, Computer Science and Engineering (AI)");
    expect(edu[0].degree).toContain("Relevant Coursework:Operating Systems");
    expect(edu[0].degree).not.toMatch(/CGPA|8\.35|Expected/);
    expect(edu[0].score).toEqual({ type: "cgpa", value: 8.35, outOf: 10 });
    expect(edu[0].endDate).toBe("May 2027");
  });

  it("merges a skills line wrapped after a trailing comma into its group", () => {
    expect(draft.skills.map((g) => g.group)).toEqual(["Languages", "CS Fundamentals"]);
    expect(draft.skills[1].items).toEqual([
      "Data Structures & Algorithms",
      "Operating Systems",
      "Databases",
      "Machine Learning",
    ]);
  });
});

// SCORE_TEXT_RE must only strip a number that's actually a score (adjacent
// to a cgpa/gpa/percentage keyword). A bare "N/10" or "N%" elsewhere in the
// degree text is real content, not a score, and must not be silently deleted.
describe("parseResumeText — doesn't strip a bare N% or N/10 that isn't a score", () => {
  it("keeps a class rank shaped like a fraction", () => {
    const d = parseResumeText(
      "Name\ne@e.com\nEducation\nMIT\nB.Tech (Batch of 2027), rank 5/10 in dept."
    );
    expect(d.education[0].degree).toBe("B.Tech (Batch of 2027), rank 5/10 in dept.");
  });

  it("keeps a percentage that isn't a score", () => {
    const d = parseResumeText(
      "Name\ne@e.com\nEducation\nMIT\nB.Tech, thesis improved model accuracy by 15% overall."
    );
    expect(d.education[0].degree).toBe("B.Tech, thesis improved model accuracy by 15% overall.");
  });

  it("still strips a real percentage score", () => {
    const d = parseResumeText(
      "Name\ne@e.com\nEducation\nMIT\nB.Tech, Percentage: 92%"
    );
    expect(d.education[0].degree).not.toMatch(/92|Percentage/);
    expect(d.education[0].score).toEqual({ type: "percentage", value: 92 });
  });
});
