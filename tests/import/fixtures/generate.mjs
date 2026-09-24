// Regenerates sample-resume.pdf from the current renderer, so the fixture
// always matches what renderResumeHTML actually produces. Run manually with
// `node tests/import/fixtures/generate.mjs` if the renderer's output shape
// changes and the import tests need a fresh fixture; not run by the test
// suite itself. Needs Chromium — pass PUPPETEER_EXECUTABLE_PATH if
// Puppeteer's own download isn't available (see the README's Chrome note).
import { renderResumeHTML } from "../../../shared/templates/index.js";
import { emptyResume, makeBullet } from "../../../shared/data/emptyResume.js";
import puppeteer from "puppeteer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const resume = {
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

const html = renderResumeHTML(resume, "classic");
const browser = await puppeteer.launch({
  headless: true,
  executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
  args: ["--no-sandbox"],
});
const page = await browser.newPage();
await page.setContent(html);
const buffer = await page.pdf({ format: "A4" });
await browser.close();

fs.writeFileSync(path.join(__dirname, "sample-resume.pdf"), buffer);
console.log("Wrote sample-resume.pdf,", buffer.length, "bytes");
