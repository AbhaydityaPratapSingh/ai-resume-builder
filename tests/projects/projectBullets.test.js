import { describe, it, expect } from "vitest";
import { generateProjectBullets } from "../../shared/text/projectBullets.js";
import { emptyProjectForm } from "../../shared/data/emptyResume.js";

// Every word in a draft must trace to a form answer or to this fixed,
// meaning-neutral template vocabulary — the Phase 3 exit test in
// ARCHITECTURE.md section 13. Anything else means a template invented a
// claim the student never made.
const TEMPLATE_VOCAB = new Set(
  [
    "built", "using", "to", "address", "and", "for", "worked", "on",
    "implemented", "with", "delivered", "a", "an", "the",
    // "Built it solo" is the documented default for a blank role
    // (ARCHITECTURE.md section 9.1), not a guess about the student's work.
    "it", "solo",
  ].map((w) => w.toLowerCase())
);

function tokenize(text) {
  return text
    .toLowerCase()
    .replace(/[.,]/g, "")
    .split(/\s+/)
    .filter(Boolean);
}

function sourceTokens(form, techStack) {
  const source = [form.built, form.problem, form.role, form.result, form.keyFeature, ...(techStack || [])]
    .filter(Boolean)
    .join(" ");
  return new Set(tokenize(source));
}

describe("generateProjectBullets — template selection", () => {
  it("returns [] when nothing is filled", () => {
    expect(generateProjectBullets(emptyProjectForm(), [])).toEqual([]);
  });

  it("fires the built/tech/problem template when all three are filled", () => {
    const form = {
      ...emptyProjectForm(),
      built: "a web app for students to file and track complaints",
      problem: "hostel complaints were tracked on paper and often lost",
    };
    const drafts = generateProjectBullets(form, ["Node.js", "Express", "MongoDB"]);
    expect(drafts[0]).toBe(
      "Built a web app for students to file and track complaints using Node.js, Express and MongoDB to address hostel complaints were tracked on paper and often lost."
    );
  });

  it("fires the role/result template, using the role's own verb", () => {
    const form = { ...emptyProjectForm(), role: "Built the backend and database", result: "used by 300 students in my hostel" };
    const drafts = generateProjectBullets(form, []);
    expect(drafts).toContain("Built the backend and database, used by 300 students in my hostel.");
  });

  it("gives a neutral default verb when the role has none", () => {
    const form = { ...emptyProjectForm(), role: "the backend and database", result: "served 300 students" };
    const drafts = generateProjectBullets(form, []);
    expect(drafts).toContain("Worked on the backend and database, served 300 students.");
  });

  it("fires the key-feature/tech template with one tech item", () => {
    const form = { ...emptyProjectForm(), keyFeature: "email alerts when a complaint is resolved" };
    const drafts = generateProjectBullets(form, ["Node.js", "Express"]);
    expect(drafts).toContain("Implemented email alerts when a complaint is resolved with Node.js.");
  });

  it("fires the result-only template as a last resort", () => {
    const form = { ...emptyProjectForm(), result: "ranked top 10 in the college hackathon" };
    const drafts = generateProjectBullets(form, []);
    expect(drafts).toContain("Delivered ranked top 10 in the college hackathon.");
  });

  it("defaults a blank role to 'Built it solo' when only result is filled", () => {
    const form = { ...emptyProjectForm(), result: "ranked top 10 in the college hackathon" };
    const drafts = generateProjectBullets(form, []);
    expect(drafts).toContain("Built it solo, ranked top 10 in the college hackathon.");
  });

  it("returns at most 3 drafts and never a duplicate", () => {
    const form = {
      built: "a dashboard",
      problem: "manual tracking was slow",
      role: "Built the dashboard",
      result: "cut reporting time by half",
      keyFeature: "real-time charts",
    };
    const drafts = generateProjectBullets(form, ["React"]);
    expect(drafts.length).toBeLessThanOrEqual(3);
    expect(new Set(drafts).size).toBe(drafts.length);
  });

  it("handles a null/undefined form without throwing", () => {
    expect(generateProjectBullets(null, [])).toEqual([]);
    expect(generateProjectBullets(undefined, ["React"])).toEqual([]);
  });
});

describe("generateProjectBullets — no fabrication", () => {
  const cases = [
    {
      built: "a complaint-tracking web app",
      problem: "complaints were lost on paper",
      role: "Designed the backend and database",
      result: "serving 300 hostel students",
      keyFeature: "email alerts on resolution",
      techStack: ["Node.js", "Express", "MongoDB"],
    },
    {
      built: "a placement tracker",
      problem: "students missed application deadlines",
      role: "led frontend development",
      result: "adopted by 40 companies",
      keyFeature: "",
      techStack: ["React"],
    },
  ];

  for (const [i, c] of cases.entries()) {
    it(`every word in every draft traces to the form or the fixed vocabulary (case ${i + 1})`, () => {
      const form = { ...emptyProjectForm(), ...c };
      const drafts = generateProjectBullets(form, c.techStack);
      const allowed = sourceTokens(form, c.techStack);
      for (const draft of drafts) {
        for (const token of tokenize(draft)) {
          expect(TEMPLATE_VOCAB.has(token) || allowed.has(token), `unexpected word "${token}" in: ${draft}`).toBe(true);
        }
      }
    });
  }

  it("never adds an evaluative adjective not present in the source", () => {
    const form = {
      ...emptyProjectForm(),
      built: "a chat app",
      problem: "students had no group study tool",
      techStack: ["React", "Node.js"],
    };
    const drafts = generateProjectBullets(form, form.techStack).join(" ").toLowerCase();
    for (const banned of ["scalable", "high-performance", "robust", "cutting-edge", "innovative"]) {
      expect(drafts).not.toContain(banned);
    }
  });
});
