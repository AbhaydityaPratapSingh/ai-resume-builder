import puppeteer from "puppeteer";
import { renderResumeHTML } from "@resume-maker/shared";

const MAX_CONCURRENT = 2;
const MAX_QUEUE = 20;
const SET_CONTENT_TIMEOUT = 10_000;
const PDF_TIMEOUT = 15_000;

let browserPromise = null;
let active = 0;
const queue = [];

export class QueueFullError extends Error {
  constructor() {
    super("PDF queue is full");
    this.name = "QueueFullError";
  }
}

async function launchBrowser() {
  const browser = await puppeteer.launch({
    // chrome-headless-shell is enough for HTML->PDF and avoids the full
    // Chrome download.
    headless: "shell",
    ...(process.env.PUPPETEER_EXECUTABLE_PATH
      ? { executablePath: process.env.PUPPETEER_EXECUTABLE_PATH }
      : {}),
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
  });
  // A crashed browser must not poison every later request.
  browser.on("disconnected", () => {
    if (browserPromise) browserPromise = null;
  });
  return browser;
}

function getBrowser() {
  if (!browserPromise) browserPromise = launchBrowser();
  return browserPromise;
}

function pump() {
  while (active < MAX_CONCURRENT && queue.length) {
    const job = queue.shift();
    active++;
    job.run().then(job.resolve, job.reject).finally(() => {
      active--;
      pump();
    });
  }
}

function enqueue(run) {
  if (queue.length >= MAX_QUEUE) return Promise.reject(new QueueFullError());
  return new Promise((resolve, reject) => {
    queue.push({ run, resolve, reject });
    pump();
  });
}

async function renderOnce(resumeData, templateId) {
  const html = renderResumeHTML(resumeData, templateId);
  const browser = await getBrowser();
  const page = await browser.newPage();
  try {
    // The document is fully self-contained: no scripts, no network. Anything
    // that tries to reach out is a bug or an injection attempt.
    await page.setJavaScriptEnabled(false);
    await page.setRequestInterception(true);
    page.on("request", (req) => {
      const url = req.url();
      if (url.startsWith("data:") || url === "about:blank") req.continue();
      else req.abort();
    });

    await page.setContent(html, {
      waitUntil: "load",
      timeout: SET_CONTENT_TIMEOUT,
    });
    return await page.pdf({
      preferCSSPageSize: true,
      printBackground: true,
      timeout: PDF_TIMEOUT,
    });
  } finally {
    await page.close().catch(() => {});
  }
}

export function renderResumePDF(resumeData, templateId) {
  return enqueue(() => renderOnce(resumeData, templateId));
}

export async function closeBrowser() {
  if (browserPromise) {
    const browser = await browserPromise;
    browserPromise = null;
    await browser.close().catch(() => {});
  }
}
