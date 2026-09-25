import { describe, it, expect } from "vitest";
import { parseResumeText } from "../../shared/import/parseResumeText.js";
import { bulletText } from "../../shared/data/emptyResume.js";

// Hand-labelled expectations for three real student resumes, written from the
// extracted text alone (not from parser output). Personal details are
// anonymized; layout (line breaks, column spacing, glyphs, icon words, trailing
// spaces) is kept exactly as pdf text extraction produced it.
// A run of 3+ spaces marks a right-aligned column (dates/location).

// LaTeX resume.
const RESUME_LATEX = `

Test Student
+91 9000000000 | student@example.com | github.com/teststudent
Education
Example Institute of Technology   Sampletown, TN
B.Tech, Computer Science and Engineering (Big Data Analytics); CGPA: 8.35/10.0   Expected May 2027
• Relevant Coursework: Data Structures & Algorithms, Object-Oriented Programming, Database Management
Systems, Machine Learning.
Technical Skills
Languages:  C++, Python, JavaScript (ES6+), SQL, HTML/CSS
Frameworks & Libraries:  React, Node.js, Express.js, Flask, PyTorch, NumPy, Pandas, Scikit-learn
Tools & Platforms:  Git, GitHub, Linux, MongoDB Atlas, Firebase, Postman, REST APIs, Gemini AI API
CS Fundamentals:  Data Structures & Algorithms, Object-Oriented Design, Algorithm Design, Complexity Analysis,
Databases, Machine Learning, Deep Learning
Projects
BudgetGuardian | Node.js, Express, React, MongoDB Atlas, Setu Account Aggregator API, Gemini AI
• Built a full-stack personal finance platform that consolidates multi-bank transaction data and surfaces real-time
spending analytics through an interactive React dashboard.
• Designed a RESTful Node.js/Express API with JWT authentication, centralizing authorization in a single reusable
middleware layer to prevent unauthorized access to financial records.
• Integrated the Setu Account Aggregator API end to end, implementing the OAuth consent flow and encrypted token
storage to securely fetch data across banking institutions.
• Engineered a Gemini AI insights pipeline with request batching and response caching, lowering per-request LLM cost
while generating personalized budgeting recommendations.
• Modeled MongoDB schemas with compound indexes on user and date fields, cutting dashboard aggregation query
latency and eliminating full-collection scans.
Microplastic Detection via Hyperspectral Imaging | Python, PyTorch, NumPy, 1D-CNN
• Developed a 1D-CNN spectral classifier in PyTorch that distinguishes microplastic polymer types from their
hyperspectral signatures.
• Built an end-to-end preprocessing pipeline that normalizes, denoises, and augments raw spectral data, replacing
loop-based transforms with vectorized NumPy operations to speed up training runs.
• Ran systematic experiments across model architectures and hyperparameters, tracking accuracy and F1-score to select
the final configuration and documenting results for reproducibility.
• Applied deep learning to an environmental sustainability problem, validating a lower-cost alternative to manual
laboratory water sampling.
Campus Automated Printing Platform | React, Firebase, Cloudinary
• Architected a web platform that lets students upload documents and track print-queue status in real time, replacing an
entirely manual walk-in process at campus print shops.
• Implemented Firebase real-time listeners to push live queue state to both students and vendors, removing the need for
students to physically wait in line.
• Secured document handling with Cloudinary signed uploads and auto-expiring storage so files are purged shortly after
each print job completes.
• Gathered requirements directly from campus vendors and iterated on the workflow based on their feedback to drive
real-world adoption.`;

// Word resume; Experience uses a LinkedIn-style layout (company + total
// duration, then role lines with date ranges, then a "Skills:" line).
const RESUME_WORD = `

Sample Person 
Pune , Maharashtra | sample.person@example.com | +91 9111111111 | LinkedIn Username: sample-person 
Github Username: samplep 
About Me 
     Myself  Sample  Person,  a Third-year  Computer  Science  student  at  Sample  Institute  of  Engineering  and Technology, 
Mumbai,  India. I  am  a  highly  motivated,  responsible,  and  dedicated  individual  with  a  strong passion  for 
learning. I thrive on tackling new challenges and continuously seek opportunities for growth. I am particularly 
interested in the field of data analytics and aspire to build a career in this domain by working on impactful and 
real-world projects. 
Education 
Sample Institue Of Engineering And Technology, B.Tech in Computer Science    Aug 2023 – May 2027 
• CGPA: 9.78 
Example Public School, Grade 12 , CBSE Board    March 2022 
• Percentage : 88.4 
Example Public School, Grade 10 , CBSE Board    March 2020 
• Percentage : 89.0 
Technical Skills  
Languages: C++, C, Python, Java, SQL, HTML, CSS, Javascipt 
Technologies: Microsoft Excel, PowerBi 
Soft  Skills  
Strategic Outreach, Sponsorship Coordination, Effective Communication, Decision-Making, Operational Efficiency, 
Crisis Management 
Experience  
Aaruush, Example University                                                                                                                                                                   2 years 
PPCH                                                                                                                                                            April 2025 – Present · 5 months  
Committee Member                                                                                                                                   Sep 2024 – April 2025 · 1 year 
Volunteer                                                                                                                                            Sep 2023 – Sep 2024 · 1 yr 1 month 
Skills: Operations, Resource Management , Crisis Management , Crowd Control  
 
Qwiklabs Developer Club EXU                                                                                                                                    1 yr 7 months 
Joint Secretary                                                                                                                                               Jul 2025 – Present · 2 months 
Associate Lead                                                                                                                                         Sep 2024 – Jul 2025 · 11 months 
Member                                                                                                                                                      Feb 2024 – Sep 2024 · 8 months 
Skills: Corporate Finance, Public Relations, Team Management 
 
Team Example Hackathon                                                                                                                                                                  11 months 
Member                                                                                                                                                       Oct 2024 – Present · 11 months 
Skills: Logistics, Public Relations 
 `;

// LaTeX resume with icon-font labels in the contact line.
const RESUME_ICONS = `

Test Student
Phone-Alt 9000000000 | Envelope student@example.com | Github @teststudent
Education
Example Institute of Technology   Sampletown, TN
Bachelor of Technology in Computer Science and Engineering(Specialization in Big Data Analytics)   Expected 2027
• Current CGPA: 8.29 / 10.0
• Relevant Coursework: Data Structures & Algorithms, Object Oriented Programming, Database Management
Systems, Machine Learning.
A.B Sample Public School   [Nagpur, Maharashtra]
Class XII (CBSE)   2022
• Percentage: 66%
A.B Sample Public School   [Nagpur, Maharashtra]
Class X (CBSE)   2020
• Percentage: 88.4%
Projects
BudgetGuardian | MERN Stack, Setu API, Gemini AI
• Developed a comprehensive financial monitoring application using the MERN stack to help users monitor spending
habits in real-time.
• Integrated the Setu Account Aggregator API to securely fetch and consolidate user financial data from multiple
banking institutions.
• Implemented Gemini AI to provide personalized financial insights and automated budgeting advice based on
transaction history.
• Built a responsive UI with React and managed a secure backend using Node.js and MongoDB Atlas.
Microplastic Detection in Water Bodies | Python, PyTorch, 1D-CNN
• Designed a research project using Hyperspectral Imaging to identify microplastics in water samples with high
accuracy.
• Engineered a 1D-CNN spectral model to classify materials based on their unique hyperspectral signatures.
• Handled complex data engineering phases, transforming raw spectral data into a format suitable for deep learning
training.
• Demonstrated the application of Deep Learning in environmental sustainability and spectral analysis.
Campus Automated Printing Solution | React, Firebase, Cloudinary
• Architected a web platform for EXU students to upload documents and manage printing queues at campus shops.
• Utilized Firebase for real-time status updates and Cloudinary for secure, temporary document storage.
• Streamlined the manual printing process, reducing student wait times and improving vendor efficiency.
Technical Skills
Languages: Python, JavaScript (ES6+), C++, HTML/CSS, SQL
Frameworks/Libraries: React, Node.js, Express.js, Flask, PyTorch, NumPy, Pandas, Scikit-learn
Developer Tools: Git, MongoDB Atlas, Postman, Firebase, Linux, Gemini AI API, Setu API
Core Concepts: Data Structures & Algorithms (DSA), RESTful APIs, Machine Learning, Deep Learning`;

const allBullets = (draft) => [
  ...draft.experience.flatMap((e) => e.bullets || []),
  ...draft.projects.flatMap((p) => p.bullets || []),
];

function expectNoStrayGlyphs(draft) {
  for (const p of draft.projects) expect(p.title).not.toContain("•");
  for (const e of draft.experience) {
    expect(e.role || "").not.toContain("•");
    expect(e.company || "").not.toContain("•");
  }
  for (const b of allBullets(draft)) expect(bulletText(b)).not.toContain("•");
}

function linkUrl(draft, type) {
  const link = (draft.personal.links || []).find((l) => l.type === type);
  return link ? link.url : undefined;
}

describe("real resume: LaTeX (r)", () => {
  const draft = parseResumeText(RESUME_LATEX);

  it("extracts name, email and phone", () => {
    expect(draft.personal.name).toBe("Test Student");
    expect(draft.personal.email).toBe("student@example.com");
    expect(draft.personal.phone).toContain("9000000000");
    expect(draft.personal.phone).not.toContain("|");
  });

  it("extracts the GitHub link", () => {
    expect(linkUrl(draft, "github")).toMatch(/github\.com\/teststudent$/);
  });

  it("has exactly one education entry (the coursework bullet is not a new entry)", () => {
    expect(draft.education).toHaveLength(1);
  });

  it("extracts the institution without the date", () => {
    expect(draft.education[0].institution).toContain("Example Institute of Technology");
    expect(draft.education[0].institution).not.toMatch(/Expected|2027|CGPA/);
  });

  it("keeps the degree text but not the score or date", () => {
    const { degree } = draft.education[0];
    expect(degree).toContain("B.Tech, Computer Science and Engineering (Big Data Analytics)");
    expect(degree).not.toMatch(/CGPA|8\.35|Expected/);
  });

  it("extracts the CGPA score", () => {
    expect(draft.education[0].score).toEqual({ type: "cgpa", value: 8.35, outOf: 10 });
  });

  it("extracts the expected graduation date", () => {
    expect(draft.education[0].endDate).toBe("May 2027");
  });

  it("extracts the skill group names", () => {
    expect(draft.skills.map((g) => g.group)).toEqual([
      "Languages",
      "Frameworks & Libraries",
      "Tools & Platforms",
      "CS Fundamentals",
    ]);
  });

  it("extracts skill items", () => {
    const byGroup = Object.fromEntries(draft.skills.map((g) => [g.group, g.items]));
    expect(byGroup["Languages"]).toEqual(["C++", "Python", "JavaScript (ES6+)", "SQL", "HTML/CSS"]);
    expect(byGroup["Frameworks & Libraries"]).toEqual([
      "React", "Node.js", "Express.js", "Flask", "PyTorch", "NumPy", "Pandas", "Scikit-learn",
    ]);
    expect(byGroup["Tools & Platforms"]).toEqual([
      "Git", "GitHub", "Linux", "MongoDB Atlas", "Firebase", "Postman", "REST APIs", "Gemini AI API",
    ]);
  });

  it("merges the wrapped CS Fundamentals line into its group", () => {
    const cs = draft.skills.find((g) => g.group === "CS Fundamentals");
    expect(cs.items).toEqual([
      "Data Structures & Algorithms",
      "Object-Oriented Design",
      "Algorithm Design",
      "Complexity Analysis",
      "Databases",
      "Machine Learning",
      "Deep Learning",
    ]);
  });

  it("finds exactly three projects", () => {
    expect(draft.projects).toHaveLength(3);
  });

  it("extracts project titles", () => {
    expect(draft.projects[0].title).toMatch(/^BudgetGuardian/);
    expect(draft.projects[1].title).toMatch(/^Microplastic Detection via Hyperspectral Imaging/);
    expect(draft.projects[2].title).toMatch(/^Campus Automated Printing Platform/);
  });

  it("gives each project the right number of bullets", () => {
    expect(draft.projects.map((p) => p.bullets.length)).toEqual([5, 4, 4]);
  });

  it("merges a wrapped bullet into one sentence", () => {
    expect(bulletText(draft.projects[0].bullets[0])).toBe(
      "Built a full-stack personal finance platform that consolidates multi-bank transaction data and surfaces real-time spending analytics through an interactive React dashboard."
    );
  });

  it("merges a wrap that starts with a hyphenated word", () => {
    expect(bulletText(draft.projects[1].bullets[1])).toBe(
      "Built an end-to-end preprocessing pipeline that normalizes, denoises, and augments raw spectral data, replacing loop-based transforms with vectorized NumPy operations to speed up training runs."
    );
  });

  it("merges the wrapped last bullet at end of text", () => {
    expect(bulletText(draft.projects[2].bullets[3])).toBe(
      "Gathered requirements directly from campus vendors and iterated on the workflow based on their feedback to drive real-world adoption."
    );
  });

  it("every project bullet is a complete sentence (all wraps merged)", () => {
    for (const b of draft.projects.flatMap((p) => p.bullets)) {
      expect(bulletText(b)).toMatch(/\.$/);
    }
  });

  it("has no experience entries", () => {
    expect(draft.experience).toEqual([]);
  });

  it("leaves no stray bullet glyph in titles or bullets", () => {
    expectNoStrayGlyphs(draft);
  });
});

describe("real resume: Word with LinkedIn-style experience (r1)", () => {
  const draft = parseResumeText(RESUME_WORD);

  it("extracts name, email and phone", () => {
    expect(draft.personal.name).toBe("Sample Person");
    expect(draft.personal.email).toBe("sample.person@example.com");
    expect(draft.personal.phone).toContain("9111111111");
    expect(draft.personal.phone).not.toContain("|");
  });

  it("extracts the location", () => {
    expect(draft.personal.location).toBe("Pune, Maharashtra");
  });

  it("builds the LinkedIn link from 'LinkedIn Username:'", () => {
    expect(linkUrl(draft, "linkedin")).toMatch(/linkedin\.com\/in\/sample-person$/);
  });

  it("builds the GitHub link from 'Github Username:'", () => {
    expect(linkUrl(draft, "github")).toMatch(/github\.com\/samplep$/);
  });

  it("extracts the summary with whitespace collapsed", () => {
    expect(draft.summary).toContain(
      "Myself Sample Person, a Third-year Computer Science student at Sample Institute of Engineering and Technology, Mumbai, India."
    );
    expect(draft.summary).toContain("a strong passion for learning.");
    expect(draft.summary).toMatch(/real-world projects\.$/);
    expect(draft.summary).not.toMatch(/\s{2,}/);
    expect(draft.summary).toBe(draft.summary.trim());
  });

  it("has three education entries", () => {
    expect(draft.education).toHaveLength(3);
  });

  it("extracts the degree entry: institution, degree, dates, CGPA", () => {
    const e = draft.education[0];
    expect(e.institution).toContain("Sample Institue Of Engineering And Technology");
    expect(e.institution).not.toMatch(/B\.Tech|2027/);
    expect(e.degree).toContain("B.Tech in Computer Science");
    expect(e.degree).not.toMatch(/CGPA|9\.78|2023|2027/);
    expect(e.startDate).toBe("Aug 2023");
    expect(e.endDate).toBe("May 2027");
    expect(e.score).toEqual({ type: "cgpa", value: 9.78, outOf: 10 });
  });

  it("extracts the Grade 12 entry with its percentage", () => {
    const e = draft.education[1];
    expect(e.institution).toContain("Example Public School");
    expect(e.institution).not.toContain("Grade");
    expect(e.degree).toContain("Grade 12");
    expect(e.degree).not.toMatch(/Percentage|88\.4|2022/);
    expect(e.endDate).toBe("March 2022");
    expect(e.score).toEqual({ type: "percentage", value: 88.4 });
  });

  it("extracts the Grade 10 entry with its percentage", () => {
    const e = draft.education[2];
    expect(e.institution).toContain("Example Public School");
    expect(e.degree).toContain("Grade 10");
    expect(e.degree).not.toMatch(/Percentage|89\.0|2020/);
    expect(e.endDate).toBe("March 2020");
    expect(e.score).toEqual({ type: "percentage", value: 89 });
  });

  it("extracts skill groups including Soft Skills as its own group", () => {
    expect(draft.skills.map((g) => g.group)).toEqual(["Languages", "Technologies", "Soft Skills"]);
  });

  it("extracts Languages and Technologies items", () => {
    const byGroup = Object.fromEntries(draft.skills.map((g) => [g.group, g.items]));
    expect(byGroup["Languages"]).toEqual(["C++", "C", "Python", "Java", "SQL", "HTML", "CSS", "Javascipt"]);
    expect(byGroup["Technologies"]).toEqual(["Microsoft Excel", "PowerBi"]);
  });

  it("merges the wrapped Soft Skills line into one group", () => {
    const soft = draft.skills.find((g) => g.group === "Soft Skills");
    expect(soft.items).toEqual([
      "Strategic Outreach",
      "Sponsorship Coordination",
      "Effective Communication",
      "Decision-Making",
      "Operational Efficiency",
      "Crisis Management",
    ]);
  });

  it("makes one experience entry per role", () => {
    expect(draft.experience.map((e) => e.role)).toEqual([
      "PPCH",
      "Committee Member",
      "Volunteer",
      "Joint Secretary",
      "Associate Lead",
      "Member",
      "Member",
    ]);
  });

  it("gives each role its organisation as the company", () => {
    expect(draft.experience.map((e) => e.company)).toEqual([
      "Aaruush, Example University",
      "Aaruush, Example University",
      "Aaruush, Example University",
      "Qwiklabs Developer Club EXU",
      "Qwiklabs Developer Club EXU",
      "Qwiklabs Developer Club EXU",
      "Team Example Hackathon",
    ]);
  });

  it("extracts role dates without the duration suffix", () => {
    expect(draft.experience.map((e) => [e.startDate, e.endDate])).toEqual([
      ["April 2025", "Present"],
      ["Sep 2024", "April 2025"],
      ["Sep 2023", "Sep 2024"],
      ["Jul 2025", "Present"],
      ["Sep 2024", "Jul 2025"],
      ["Feb 2024", "Sep 2024"],
      ["Oct 2024", "Present"],
    ]);
  });

  it("attaches each 'Skills:' line as a bullet of the role above it", () => {
    // Entries with no bullets carry one empty placeholder for the form.
    const texts = draft.experience.map((e) => e.bullets.map(bulletText).filter(Boolean));
    expect(texts.map((t) => t.length)).toEqual([0, 0, 1, 0, 0, 1, 1]);
    expect(texts[2][0]).toMatch(/^Skills: Operations, Resource Management\s?, Crisis Management\s?, Crowd Control$/);
    expect(texts[5][0]).toBe("Skills: Corporate Finance, Public Relations, Team Management");
    expect(texts[6][0]).toBe("Skills: Logistics, Public Relations");
  });

  it("never makes a 'Skills:' line its own entry", () => {
    for (const e of draft.experience) {
      expect(e.role).not.toMatch(/^Skills:/);
      expect(e.company || "").not.toMatch(/^Skills:/);
    }
  });

  it("no role is a giant merged title", () => {
    for (const e of draft.experience) expect(e.role.length).toBeLessThanOrEqual(60);
  });

  it("has no projects", () => {
    expect(draft.projects).toEqual([]);
  });

  it("leaves no stray bullet glyph in titles or bullets", () => {
    expectNoStrayGlyphs(draft);
  });
});

describe("real resume: LaTeX with icon-font labels (r2)", () => {
  const draft = parseResumeText(RESUME_ICONS);

  it("extracts the name", () => {
    expect(draft.personal.name).toBe("Test Student");
  });

  it("extracts the email without the icon word", () => {
    expect(draft.personal.email).toBe("student@example.com");
  });

  it("extracts the phone without the icon word", () => {
    expect(draft.personal.phone).toContain("9000000000");
    expect(draft.personal.phone).not.toMatch(/Phone|Alt|\|/);
  });

  it("builds the GitHub link from 'Github @handle'", () => {
    expect(linkUrl(draft, "github")).toMatch(/github\.com\/teststudent$/);
  });

  it("has three education entries", () => {
    expect(draft.education).toHaveLength(3);
  });

  it("extracts the degree entry", () => {
    const e = draft.education[0];
    expect(e.institution).toContain("Example Institute of Technology");
    expect(e.institution).not.toMatch(/Bachelor|2027/);
    expect(e.degree).toContain("Bachelor of Technology in Computer Science and Engineering");
    expect(e.degree).not.toMatch(/CGPA|8\.29|Expected/);
    expect(e.score).toEqual({ type: "cgpa", value: 8.29, outOf: 10 });
    expect(e.endDate).toBe("2027");
  });

  it("extracts the Class XII entry", () => {
    const e = draft.education[1];
    expect(e.institution).toContain("A.B Sample Public School");
    expect(e.institution).not.toContain("Class");
    expect(e.degree).toContain("Class XII");
    expect(e.degree).not.toMatch(/Percentage|66/);
    expect(e.endDate).toBe("2022");
    expect(e.score).toEqual({ type: "percentage", value: 66 });
  });

  it("extracts the Class X entry", () => {
    const e = draft.education[2];
    expect(e.institution).toContain("A.B Sample Public School");
    expect(e.degree).toMatch(/Class X(?!I)/);
    expect(e.degree).not.toMatch(/Percentage|88\.4/);
    expect(e.endDate).toBe("2020");
    expect(e.score).toEqual({ type: "percentage", value: 88.4 });
  });

  it("finds exactly three projects", () => {
    expect(draft.projects).toHaveLength(3);
  });

  it("extracts project titles", () => {
    expect(draft.projects[0].title).toMatch(/^BudgetGuardian/);
    expect(draft.projects[1].title).toMatch(/^Microplastic Detection in Water Bodies/);
    expect(draft.projects[2].title).toMatch(/^Campus Automated Printing Solution/);
  });

  it("gives each project the right number of bullets", () => {
    expect(draft.projects.map((p) => p.bullets.length)).toEqual([4, 4, 3]);
  });

  it("merges a bullet whose wrap is a single word", () => {
    expect(bulletText(draft.projects[1].bullets[0])).toBe(
      "Designed a research project using Hyperspectral Imaging to identify microplastics in water samples with high accuracy."
    );
  });

  it("merges another wrapped bullet into one sentence", () => {
    expect(bulletText(draft.projects[0].bullets[0])).toBe(
      "Developed a comprehensive financial monitoring application using the MERN stack to help users monitor spending habits in real-time."
    );
  });

  it("every project bullet is a complete sentence (all wraps merged)", () => {
    for (const b of draft.projects.flatMap((p) => p.bullets)) {
      expect(bulletText(b)).toMatch(/\.$/);
    }
  });

  it("extracts skill groups (skills section comes after projects)", () => {
    expect(draft.skills.map((g) => g.group)).toEqual([
      "Languages",
      "Frameworks/Libraries",
      "Developer Tools",
      "Core Concepts",
    ]);
  });

  it("extracts skill items", () => {
    const byGroup = Object.fromEntries(draft.skills.map((g) => [g.group, g.items]));
    expect(byGroup["Languages"]).toEqual(["Python", "JavaScript (ES6+)", "C++", "HTML/CSS", "SQL"]);
    expect(byGroup["Frameworks/Libraries"]).toEqual([
      "React", "Node.js", "Express.js", "Flask", "PyTorch", "NumPy", "Pandas", "Scikit-learn",
    ]);
    expect(byGroup["Developer Tools"]).toEqual([
      "Git", "MongoDB Atlas", "Postman", "Firebase", "Linux", "Gemini AI API", "Setu API",
    ]);
    expect(byGroup["Core Concepts"]).toEqual([
      "Data Structures & Algorithms (DSA)", "RESTful APIs", "Machine Learning", "Deep Learning",
    ]);
  });

  it("has no experience entries", () => {
    expect(draft.experience).toEqual([]);
  });

  it("leaves no stray bullet glyph in titles or bullets", () => {
    expectNoStrayGlyphs(draft);
  });
});
