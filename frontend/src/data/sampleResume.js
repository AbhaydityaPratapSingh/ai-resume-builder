import { makeBullet } from "@resume-maker/shared";

// Used by the template gallery and landing page previews. Kept in v2 shape so
// it renders correctly with the current renderer (bullet objects, skill
// groups) rather than the v1 shape the landing branch was built against.
export const SAMPLE_RESUME = {
  schemaVersion: 2,
  personal: {
    name: "Aditi Sharma",
    email: "aditi@example.com",
    phone: "+91 98765 43210",
    location: "Pune",
    links: [{ type: "github", url: "github.com/aditi" }],
  },
  summary: "Final-year computer engineering student focused on backend development.",
  experience: [
    {
      id: "1",
      role: "SDE Intern",
      company: "Acme Corp",
      startDate: "May 2025",
      endDate: "Jul 2025",
      bullets: [makeBullet("Built internal REST APIs used by the reporting dashboard.")],
    },
  ],
  projects: [
    {
      id: "1",
      title: "Placement Tracker",
      techStack: ["React", "Node.js"],
      bullets: [makeBullet("Tracked applications across 40 companies for 300 students.")],
    },
  ],
  education: [
    {
      id: "1",
      institution: "VIT Pune",
      degree: "B.Tech CSE",
      startDate: "2022",
      endDate: "2026",
      score: "CGPA 8.6/10",
    },
  ],
  skills: [
    { id: "s1", group: "Languages", items: ["Java", "Python", "SQL"] },
    { id: "s2", group: "Frameworks", items: ["React", "Express"] },
  ],
  certifications: [],
  layout: { templateId: "classic", sectionOrder: undefined, hidden: [] },
};
