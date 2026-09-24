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

  async function handleFile(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
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

  return (
    <div className={className}>
      <button
        onClick={() => fileRef.current?.click()}
        disabled={busy}
        className="rounded-md border border-slate-300 px-5 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {busy ? "Reading your PDF..." : "Upload an existing resume (PDF)"}
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
