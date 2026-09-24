import { describe, it, expect } from "vitest";
import { normalizeResumeData, migrateResumeData } from "../../shared/schema/migrations.js";
import { emptyResume, SECTION_KEYS } from "../../shared/data/emptyResume.js";

describe("normalizeResumeData", () => {
  it("fills achievements, responsibilities and education placement fields on old data", () => {
    const old = {
      schemaVersion: 2,
      personal: { name: "A" },
      education: [{ id: "e1", institution: "VIT", degree: "B.Tech", score: "8.6 CGPA" }],
      layout: { sectionOrder: ["summary", "education"] },
    };
    const result = normalizeResumeData(old);
    expect(result.achievements).toEqual([]);
    expect(result.responsibilities).toEqual([]);
    expect(result.education[0]).toMatchObject({
      level: "",
      branch: "",
      board: "",
      score: "8.6 CGPA",
    });
  });

  it("appends new section keys to an existing sectionOrder rather than dropping them", () => {
    const old = {
      schemaVersion: 2,
      layout: { sectionOrder: ["summary", "education", "skills"] },
    };
    const result = normalizeResumeData(old);
    expect(result.layout.sectionOrder).toEqual([
      "summary",
      "education",
      "skills",
      ...SECTION_KEYS.filter((k) => !["summary", "education", "skills"].includes(k)),
    ]);
    // nothing lost or duplicated
    expect(new Set(result.layout.sectionOrder).size).toBe(result.layout.sectionOrder.length);
    for (const k of SECTION_KEYS) expect(result.layout.sectionOrder).toContain(k);
  });

  it("keeps a structured education score object intact", () => {
    const old = {
      schemaVersion: 2,
      education: [{ id: "e1", score: { type: "cgpa", value: 8.4, outOf: 10 } }],
    };
    const result = normalizeResumeData(old);
    expect(result.education[0].score).toEqual({ type: "cgpa", value: 8.4, outOf: 10 });
  });

  it("v1 -> v2 migration produces a shape normalizeResumeData accepts cleanly", () => {
    const v1 = {
      personal: { name: "A", linkedin: "linkedin.com/in/a" },
      skills: ["Java", "Python"],
      education: [{ id: "e1", institution: "VIT" }],
    };
    const result = migrateResumeData(v1, 0);
    expect(result.schemaVersion).toBe(2);
    expect(result.achievements).toEqual([]);
    expect(result.responsibilities).toEqual([]);
    expect(result.layout.sectionOrder).toEqual(expect.arrayContaining(SECTION_KEYS));
  });

  it("emptyResume already has the new arrays", () => {
    const r = emptyResume();
    expect(r.achievements).toEqual([]);
    expect(r.responsibilities).toEqual([]);
    expect(r.layout.sectionOrder).toEqual(SECTION_KEYS);
  });

  it("renames a project's legacy repoUrl to link, and fills the structured form", () => {
    const old = {
      schemaVersion: 2,
      projects: [{ id: "p1", title: "Tracker", repoUrl: "github.com/a/tracker", techStack: ["React", ""] }],
    };
    const result = normalizeResumeData(old);
    expect(result.projects[0].link).toBe("github.com/a/tracker");
    expect(result.projects[0].repoUrl).toBeUndefined();
    expect(result.projects[0].techStack).toEqual(["React"]);
    expect(result.projects[0].form).toEqual({
      problem: "",
      built: "",
      role: "",
      result: "",
      keyFeature: "",
      teamSize: null,
    });
  });

  it("keeps an already-structured project form and link intact", () => {
    const old = {
      schemaVersion: 2,
      projects: [
        {
          id: "p1",
          title: "Tracker",
          link: "github.com/a/tracker",
          form: { problem: "X", built: "", role: "", result: "", keyFeature: "", teamSize: 2 },
        },
      ],
    };
    const result = normalizeResumeData(old);
    expect(result.projects[0].link).toBe("github.com/a/tracker");
    expect(result.projects[0].form.problem).toBe("X");
    expect(result.projects[0].form.teamSize).toBe(2);
  });
});
