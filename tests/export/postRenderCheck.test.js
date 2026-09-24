import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { checkRenderedPDF } from "../../backend/src/services/postRenderCheck.js";
import { SAMPLE_RESUME_DATA } from "../import/fixtures/sampleResumeData.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FIXTURE_PATH = path.join(__dirname, "../import/fixtures/sample-resume.pdf");
const FIXTURE_PDF = fs.readFileSync(FIXTURE_PATH);

describe("checkRenderedPDF", () => {
  it("passes clean on a correctly rendered PDF: no warnings, name/email extractable", async () => {
    const result = await checkRenderedPDF(SAMPLE_RESUME_DATA, FIXTURE_PDF);
    expect(result.warnings).toEqual([]);
  });

  it("warns when the name is missing from the PDF's extracted text", async () => {
    const wrongData = { ...SAMPLE_RESUME_DATA, personal: { ...SAMPLE_RESUME_DATA.personal, name: "Someone Else Entirely" } };
    const result = await checkRenderedPDF(wrongData, FIXTURE_PDF);
    expect(result.warnings.some((w) => w.message.includes("name"))).toBe(true);
  });

  it("warns when the email is missing from the PDF's extracted text", async () => {
    const wrongData = { ...SAMPLE_RESUME_DATA, personal: { ...SAMPLE_RESUME_DATA.personal, email: "nobody@nowhere.test" } };
    const result = await checkRenderedPDF(wrongData, FIXTURE_PDF);
    expect(result.warnings.some((w) => w.message.includes("email"))).toBe(true);
  });

  it("adds a page-count info note only when the PDF is more than one page", async () => {
    const result = await checkRenderedPDF(SAMPLE_RESUME_DATA, FIXTURE_PDF);
    // The fixture is a short one-page resume — no page-count note expected.
    expect(result.info.some((i) => i.message.includes("pages"))).toBe(false);
  });

  it("never throws on a corrupt/non-PDF buffer — degrades to an info note", async () => {
    const result = await checkRenderedPDF(SAMPLE_RESUME_DATA, Buffer.from("not a real pdf"));
    expect(result.warnings).toEqual([]);
    expect(result.info.length).toBeGreaterThan(0);
  });

  it("never throws when resumeData has no personal info at all", async () => {
    const empty = { ...SAMPLE_RESUME_DATA, personal: {} };
    const result = await checkRenderedPDF(empty, FIXTURE_PDF);
    expect(Array.isArray(result.warnings)).toBe(true);
  });
});
