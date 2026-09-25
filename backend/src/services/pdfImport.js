// Importing "pdf-parse" (its package index.js) runs a debug self-test on
// load when required as a dependency rather than executed directly — a
// known quirk of the package (github.com/modesty/pdf2json-style
// `!module.parent` check misfiring under ESM interop). Importing its
// internal module directly skips that file.
import pdf from "pdf-parse/lib/pdf-parse.js";

const PDF_MAGIC = "%PDF-";

// Wider than any word space, so it can mark a right-aligned column
// (dates, location) for the parser to split on.
export const COLUMN_GAP = "   ";

// pdf-parse's default renderer drops the space wherever a font changes or
// text is positioned rather than flowed ("using theMERN stackto",
// "TechnologyKattankulathur, TN"), so the gaps are rebuilt from item x/y
// positions instead.
async function renderPage(page) {
  const content = await page.getTextContent({ normalizeWhitespace: false, disableCombineTextItems: false });
  let out = "";
  let last = null;
  for (const item of content.items) {
    const [, , , scaleY, x, y] = item.transform;
    const height = Math.abs(scaleY) || item.height || 10;
    const sameLine = last && Math.abs(y - last.y) <= height * 0.5;
    // Some templates draw the same text several times at one spot (e.g. an
    // icon label behind a link); keep it once.
    if (sameLine && item.str === last.str && Math.abs(x - last.x) < 1) continue;
    if (!last) {
      out += item.str;
    } else if (!sameLine) {
      out += `\n${item.str}`;
    } else {
      const gap = x - last.end;
      const spaced = /\s$/.test(out) || /^\s/.test(item.str);
      const sep = gap > height * 1.5 ? COLUMN_GAP : gap > height * 0.15 && !spaced ? " " : "";
      out += sep + item.str;
    }
    last = { x, y, end: x + item.width, str: item.str };
  }
  return out;
}

export class NotAPdfError extends Error {}
export class EmptyPdfTextError extends Error {}

/**
 * Extracts plain text from a PDF buffer. Throws NotAPdfError if the bytes
 * don't look like a PDF, EmptyPdfTextError if extraction succeeds but finds
 * no text (most likely a scanned image with no text layer — OCR is out of
 * scope for now).
 */
export async function extractPdfText(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length < PDF_MAGIC.length) {
    throw new NotAPdfError("Not a PDF file.");
  }
  if (buffer.subarray(0, PDF_MAGIC.length).toString("latin1") !== PDF_MAGIC) {
    throw new NotAPdfError("Not a PDF file.");
  }

  const data = await pdf(buffer, { pagerender: renderPage });
  const text = data.text || "";
  if (!text.trim()) {
    throw new EmptyPdfTextError(
      "Could not read any text from that PDF. It may be a scanned image."
    );
  }
  return text;
}
