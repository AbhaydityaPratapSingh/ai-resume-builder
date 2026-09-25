import { useRef, useState } from "react";
import { importResumePDF } from "../../api/client.js";
import { useAppStore } from "../../state/appStore.js";

// Reused on the landing page and the template gallery — both are places
// someone decides how to start, and importing an existing resume is a
// third option next to "pick a template" / "start blank".
export default function UploadResumeButton({ className }) {
  const fileRef = useRef(null);
  const setImportDraft = useAppStore((s) => s.setImportDraft);
  const setView = useAppStore((s) => s.setView);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [dragging, setDragging] = useState(false);
  // Dragenter/dragleave fire for every child element too, so a plain
  // boolean flickers off while the pointer crosses a child's edge; a
  // counter only reaches zero once the pointer has actually left the zone.
  const dragCounter = useRef(0);

  function isPdfFile(file) {
    return file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
  }

  async function importFile(file) {
    if (!file) return;
    if (!isPdfFile(file)) {
      setError("Please choose a PDF file.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const { draft } = await importResumePDF(file);
      setImportDraft(draft);
      setView("import-review");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleFile(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    await importFile(file);
  }

  function handleDragEnter(event) {
    event.preventDefault();
    if (busy) return;
    dragCounter.current += 1;
    if (event.dataTransfer.types?.includes("Files")) setDragging(true);
  }

  function handleDragOver(event) {
    event.preventDefault();
    if (event.dataTransfer.types?.includes("Files")) event.dataTransfer.dropEffect = "copy";
  }

  function handleDragLeave(event) {
    event.preventDefault();
    dragCounter.current = Math.max(0, dragCounter.current - 1);
    if (dragCounter.current === 0) setDragging(false);
  }

  async function handleDrop(event) {
    event.preventDefault();
    dragCounter.current = 0;
    setDragging(false);
    if (busy) return;
    const file = event.dataTransfer.files?.[0];
    await importFile(file);
  }

  return (
    <div
      className={className}
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <button
        onClick={() => fileRef.current?.click()}
        disabled={busy}
        className={`rounded-md border px-5 py-3 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
          dragging
            ? "border-slate-400 bg-slate-50 text-slate-900"
            : "border-slate-300 text-slate-700 hover:bg-slate-50"
        }`}
      >
        {busy
          ? "Reading your PDF..."
          : dragging
            ? "Drop your resume to import"
            : "Upload an existing resume (PDF) — or drag & drop"}
      </button>
      <input
        ref={fileRef}
        type="file"
        accept="application/pdf,.pdf"
        className="hidden"
        onChange={handleFile}
      />
      {error ? <p className="mt-2 text-xs text-red-500">{error}</p> : null}
    </div>
  );
}
