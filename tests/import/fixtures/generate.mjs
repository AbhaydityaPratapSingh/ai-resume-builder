// Regenerates sample-resume.pdf from the current renderer, so the fixture
// always matches what renderResumeHTML actually produces. Run manually with
// `node tests/import/fixtures/generate.mjs` if the renderer's output shape
// changes and the import tests need a fresh fixture; not run by the test
// suite itself. Needs Chromium — pass PUPPETEER_EXECUTABLE_PATH if
// Puppeteer's own download isn't available (see the README's Chrome note).
import { renderResumeHTML } from "../../../shared/templates/index.js";
import { SAMPLE_RESUME_DATA } from "./sampleResumeData.js";
import puppeteer from "puppeteer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const html = renderResumeHTML(SAMPLE_RESUME_DATA, "classic");
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
