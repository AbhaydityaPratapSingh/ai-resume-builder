import puppeteer from "puppeteer";
import { renderResumeHTML } from "@resume-maker/shared";

let browserPromise = null;

function getBrowser() {
  if (!browserPromise) {
    browserPromise = puppeteer.launch({
      // "shell" uses the lightweight chrome-headless-shell build instead of
      // full Chrome — sufficient for HTML->PDF rendering, no GUI needed.
      headless: "shell",
      ...(process.env.PUPPETEER_EXECUTABLE_PATH
        ? { executablePath: process.env.PUPPETEER_EXECUTABLE_PATH }
        : {}),
      args: ["--no-sandbox", "--disable-dev-shm-usage"],
    });
  }
  return browserPromise;
}

export async function renderResumePDF(resumeData, templateId) {
  const html = renderResumeHTML(resumeData, templateId);
  const browser = await getBrowser();
  const page = await browser.newPage();
  try {
    await page.setContent(html, { waitUntil: "load" });
    return await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "0mm", right: "0mm", bottom: "0mm", left: "0mm" },
    });
  } finally {
    await page.close();
  }
}

export async function closeBrowser() {
  if (browserPromise) {
    const browser = await browserPromise;
    browserPromise = null;
    await browser.close();
  }
}
