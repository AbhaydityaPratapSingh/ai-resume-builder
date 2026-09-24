// The resumeData that sample-resume.pdf was rendered from (see
// generate.mjs). Kept separate so tests that need to check a real PDF's
// text against the data it came from — not just against reasonable-looking
// values — use the exact same object generate.mjs does, no drift possible.
import { emptyResume, makeBullet } from "../../../shared/data/emptyResume.js";

export const SAMPLE_RESUME_DATA = {
  ...emptyResume(),
  personal: {
    name: "Aditi Sharma",
    email: "aditi.sharma@example.com",
    phone: "+91 98765 43210",
    location: "Pune, India",
    links: [
      { type: "github", url: "github.com/aditi" },
      { type: "linkedin", url: "linkedin.com/in/aditi" },
    ],
  },
  summary: "Final-year computer engineering student focused on backend development.",
  education: [
    {
      id: "1",
      institution: "VIT Pune",
      degree: "B.Tech",
      branch: "Computer Science",
      startDate: "2022",
      endDate: "2026",
      score: { type: "cgpa", value: 8.6, outOf: 10 },
    },
  ],
  experience: [
    {
      id: "1",
      role: "SDE Intern",
      company: "Acme Corp",
      startDate: "May 2025",
      endDate: "Jul 2025",
      bullets: [
        makeBullet("Built internal REST APIs used by the reporting dashboard, cutting query time by 40%."),
        makeBullet("Wrote unit tests covering 90% of the new endpoints."),
      ],
    },
  ],
  projects: [
    {
      id: "1",
      title: "Placement Tracker",
      techStack: ["React", "Node.js", "MongoDB"],
      bullets: [
        makeBullet("Tracked applications across 40 companies for 300 students."),
        makeBullet("Deployed on AWS with Docker and CI/CD via GitHub Actions."),
      ],
    },
  ],
  skills: [
    { id: "s1", group: "Languages", items: ["Java", "Python", "SQL"] },
    { id: "s2", group: "Frameworks", items: ["React", "Express", "Django"] },
  ],
  achievements: [{ id: "a1", text: "Winner, Smart India Hackathon 2025" }],
  certifications: [
    { id: "c1", name: "AWS Cloud Practitioner", issuer: "Amazon Web Services", date: "Mar 2025" },
  ],
};
