// Importing "pdf-parse" (its package index.js) runs a debug self-test on
// load when required as a dependency rather than executed directly — a
// known quirk of the package (github.com/modesty/pdf2json-style
// `!module.parent` check misfiring under ESM interop). Importing its
// internal module directly skips that file.
import pdf from "pdf-parse/lib/pdf-parse.js";

const PDF_MAGIC = "%PDF-";

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

  const data = await pdf(buffer);
  const text = data.text || "";
  if (!text.trim()) {
    throw new EmptyPdfTextError(
      "Could not read any text from that PDF. It may be a scanned image."
    );
  }
  return text;
}
