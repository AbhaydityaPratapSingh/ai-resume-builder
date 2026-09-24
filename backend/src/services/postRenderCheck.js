// ARCHITECTURE.md section 8.3, "After render" stage: the pre-render
// content rules (atsValidator.js) check what went INTO the renderer; this
// checks what actually came OUT of it — the real PDF bytes, after
// Puppeteer, CSS and page breaks have all had their say. It never blocks
// the download; everything here is a warning or an info note next to it.
import pdf from "pdf-parse/lib/pdf-parse.js";
import { renderResumeBodyHTML } from "@resume-maker/shared";

// The renderer's <h2> section headings are always one of a fixed set of
// English words (see shared/templates/renderBody.js) — never user text —
// so a plain regex over server-controlled HTML is safe here.
function expectedHeadingOrder(resumeData) {
  const html = renderResumeBodyHTML(resumeData);
  return [...html.matchAll(/<h2>([^<]*)<\/h2>/g)].map((m) => m[1]);
}

// Same headings, in the order they actually appear in the PDF's extracted
// text — a mismatch means the render pipeline (not this code) reordered
// something, e.g. a CSS or page-break bug.
function actualHeadingOrder(pdfText, headings) {
  const positions = headings
    .map((h) => ({ h, i: pdfText.indexOf(h) }))
    .filter((x) => x.i !== -1)
    .sort((a, b) => a.i - b.i);
  return positions.map((x) => x.h);
}

/**
 * Checks a rendered PDF's actual text against what resumeData/templateId
 * were supposed to produce. resumeData and templateId must be the exact
 * values the PDF was rendered from, or this checks the wrong thing.
 */
export async function checkRenderedPDF(resumeData, pdfBuffer) {
  const warnings = [];
  const info = [];

  let data;
  try {
    data = await pdf(Buffer.from(pdfBuffer));
  } catch (err) {
    // A PDF that Puppeteer produced but pdf-parse can't read is itself
    // worth flagging, but it's this app's job to know, not the student's —
    // so it's an info note, and the download still proceeds.
    info.push({ field: "pdf", message: "Could not verify the rendered PDF's text — the file still downloads normally." });
    return { warnings, info };
  }

  const text = data.text || "";
  const personal = resumeData.personal || {};

  if (personal.name?.trim() && !text.includes(personal.name.trim())) {
    warnings.push({
      field: "pdf",
      message: "Your name doesn't appear as extractable text in the PDF — some ATS parsers may not read it.",
    });
  }
  if (personal.email?.trim() && !text.includes(personal.email.trim())) {
    warnings.push({
      field: "pdf",
      message: "Your email doesn't appear as extractable text in the PDF — some ATS parsers may not read it.",
    });
  }

  const expected = expectedHeadingOrder(resumeData);
  const actual = actualHeadingOrder(text, expected);
  const expectedPresent = expected.filter((h) => actual.includes(h));
  if (JSON.stringify(expectedPresent) !== JSON.stringify(actual) && expected.length > 1) {
    warnings.push({
      field: "pdf",
      message: "Section order in the downloaded PDF doesn't match the preview — try exporting again.",
    });
  }

  if (data.numpages > 1) {
    info.push({
      field: "pdf",
      message: `This PDF is ${data.numpages} pages. Most campus placement resumes read best on one page.`,
    });
  }

  return { warnings, info };
}
