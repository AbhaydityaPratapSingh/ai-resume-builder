import { describe, it, expect } from "vitest";
import { parseJD } from "../../shared/text/parseJD.js";

// A small, hand-labelled set of realistic SDE JDs. Each JD names the skills
// it requires (word by word, not the canonical dictionary label) and what
// this parser must recover as required vs. preferred. Grows whenever a real
// JD is found that the parser gets wrong (see ARCHITECTURE.md section 13.1).
const JDS = [
  {
    name: "SDE intern, explicit Requirements/Good to have",
    text: `
We are hiring a Software Engineer Intern.

Requirements:
- Strong knowledge of Java or Python
- Experience with React and Node.js
- Familiarity with REST APIs and Git
- CGPA of 7.5 or above

Good to have:
- Experience with Docker
- Knowledge of AWS
    `,
    required: ["java", "python", "react", "nodejs", "restapi", "git"],
    preferred: ["docker", "aws"],
    eligibility: { minCgpa: 7.5 },
  },
  {
    name: "No headings at all — everything required",
    text: `Looking for a backend engineer with strong Python and PostgreSQL skills, comfortable with Docker and CI/CD pipelines.`,
    required: ["python", "postgresql", "docker", "cicd"],
    preferred: [],
    eligibility: {},
  },
  {
    name: "Must-have / Bonus headings",
    text: `
Must-have skills:
- TypeScript, React, GraphQL
- Experience with MongoDB

Bonus:
- Kubernetes
- Next.js
    `,
    required: ["typescript", "react", "graphql", "mongodb"],
    preferred: ["kubernetes", "nextjs"],
    eligibility: {},
  },
  {
    name: "Ambiguous Go and C don't false-match casual text",
    text: `We're a great team looking to go far. C you at the interview!`,
    required: [],
    preferred: [],
    eligibility: {},
  },
  {
    name: "Ambiguous Go matches with programming context",
    text: `Requirements: Proficiency in the Go programming language and Kubernetes.`,
    required: ["go", "kubernetes"],
    preferred: [],
    eligibility: {},
  },
  {
    // Regression: an ambiguous skill must not match just because some other,
    // unrelated skill was matched anywhere in the document — only when a
    // real skill or context word sits near THIS occurrence. Almost every
    // real JD mentions at least one real skill, so without this the "R" in
    // "R&D" or the "c" would false-match on nearly every JD.
    name: "Ambiguous R doesn't false-match a distant unrelated mention",
    text: `We are looking for a Python developer. Our company invests heavily in R&D and innovation.`,
    required: ["python"],
    preferred: [],
    eligibility: {},
  },
  {
    name: "Symbols in skill names (C++, C#, .NET)",
    text: `Requirements: C++ or C# experience; familiarity with .NET is a plus... wait, actually required too.`,
    required: ["cpp", "csharp", "dotnet"],
    preferred: [],
    eligibility: {},
  },
  {
    name: "Branch and graduation-year eligibility",
    text: `
Eligibility: CSE/IT branch only, graduating batch 2026, minimum 70% aggregate.

Requirements:
- Java, Spring Boot, MySQL
    `,
    required: ["java", "springboot", "mysql"],
    preferred: [],
    eligibility: { branches: ["cse"], gradYear: 2026, minPercentage: 70 },
  },
  {
    name: "Preferred section with 'Nice to have' heading",
    text: `
Qualifications:
- Solid understanding of data structures and algorithms
- SQL and Linux

Nice to have:
- Redis
- Elasticsearch
    `,
    required: ["dsa", "sql", "linux"],
    preferred: ["redis", "elasticsearch"],
    eligibility: {},
  },
];

describe("parseJD recall", () => {
  for (const jd of JDS) {
    it(jd.name, () => {
      const parsed = parseJD(jd.text);
      for (const id of jd.required) {
        expect(parsed.required, `expected "${id}" in required`).toContain(id);
      }
      for (const id of jd.preferred) {
        expect(parsed.preferred, `expected "${id}" in preferred`).toContain(id);
      }
      for (const [key, value] of Object.entries(jd.eligibility)) {
        expect(parsed.eligibility[key]).toEqual(value);
      }
    });
  }

  it("overall required-skill recall is at least 90%", () => {
    let total = 0;
    let recalled = 0;
    for (const jd of JDS) {
      const parsed = parseJD(jd.text);
      for (const id of jd.required) {
        total++;
        if (parsed.required.includes(id)) recalled++;
      }
    }
    expect(recalled / total).toBeGreaterThanOrEqual(0.9);
  });

  it("empty JD yields empty result, no crash", () => {
    expect(parseJD("")).toEqual({ required: [], preferred: [], eligibility: {} });
  });

  it("no JD in the set false-matches an ambiguous skill it doesn't list", () => {
    for (const jd of JDS) {
      const parsed = parseJD(jd.text);
      const unexpected = [...parsed.required, ...parsed.preferred].filter(
        (id) => !jd.required.includes(id) && !jd.preferred.includes(id)
      );
      expect(unexpected, `${jd.name} matched unexpected skills`).toEqual([]);
    }
  });
});
