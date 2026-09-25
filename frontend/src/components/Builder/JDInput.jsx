import { useRef, useState } from "react";
import { useResumeStore } from "../../state/resumeStore.js";
import { useAppStore, hashResume } from "../../state/appStore.js";
import { parseJD, scoreResume } from "@resume-maker/shared";
import { importJDPDF } from "../../api/client.js";
import { Button, TextArea } from "../shared/ui.jsx";
import AnalysisPanel from "./AnalysisPanel.jsx";

function readTextFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Could not read that file."));
    reader.readAsText(file);
  });
}

export default function JDInput() {
  const resumeData = useResumeStore((s) => s.resumeData);
  const setTargetJD = useResumeStore((s) => s.setTargetJD);
  const jdText = resumeData.meta.targetJD;

  const setAnalysis = useAppStore((s) => s.setAnalysis);
  const analysisHash = useAppStore((s) => s.analysisHash);
  const hasAnalysis = useAppStore((s) => Boolean(s.analysis));

  const currentHash = hashResume(resumeData);
  const isStale = hasAnalysis && analysisHash !== currentHash;

  const fileRef = useRef(null);
  const dragCounter = useRef(0);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [fileError, setFileError] = useState(null);

  // Runs entirely in the browser — no network call, no API key, well under a
  // second even on a long JD. See shared/text for the analysis engine.
  function handleAnalyze() {
    const parsedJD = parseJD(jdText);
    const analysis = scoreResume(resumeData, parsedJD);
    setAnalysis({ analysis, analysisHash: hashResume(resumeData) });
  }

  async function importFile(file) {
    if (!file) return;
    const name = file.name.toLowerCase();
    const isPdf = file.type === "application/pdf" || name.endsWith(".pdf");
    const isText = file.type === "text/plain" || name.endsWith(".txt");
    if (!isPdf && !isText) {
      setFileError("Please choose a PDF or .txt file.");
      return;
    }
    setBusy(true);
    setFileError(null);
    try {
      const text = isPdf ? (await importJDPDF(file)).text : await readTextFile(file);
      setTargetJD(text);
    } catch (err) {
      setFileError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleFilePicked(event) {
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
    await importFile(event.dataTransfer.files?.[0]);
  }

  return (
    <div className="space-y-3 border-b border-slate-200 bg-white px-5 py-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold tracking-wide text-slate-900 uppercase">
          Target job description
        </h3>
        <Button
          onClick={handleAnalyze}
          disabled={!jdText.trim()}
          className="px-3 py-1.5 text-xs"
        >
          {isStale ? "Re-run Analyse" : "Analyse"}
        </Button>
      </div>

      <div
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative rounded-md ${dragging ? "ring-2 ring-slate-400" : ""}`}
      >
        <TextArea
          rows={6}
          placeholder="Paste the full job description here, or upload a PDF/.txt file..."
          value={jdText}
          onChange={(e) => setTargetJD(e.target.value)}
        />
        {dragging ? (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-md bg-slate-900/5 text-sm font-medium text-slate-700">
            Drop the JD file to import
          </div>
        ) : null}
      </div>

      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={busy}
          className="text-xs font-medium text-slate-600 underline decoration-dotted hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy ? "Reading file..." : "Upload JD file (PDF or .txt) — or drag & drop above"}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/pdf,.pdf,text/plain,.txt"
          className="hidden"
          onChange={handleFilePicked}
        />
      </div>
      {fileError ? <p className="text-xs text-red-500">{fileError}</p> : null}

      <p className="text-xs text-slate-500">
        Analysis runs in your browser — no account, no API key, no AI service involved.
        {" "}A PDF upload is only sent to this app's own server to extract its text.
      </p>

      {isStale ? (
        <p className="rounded border border-amber-300 bg-amber-50 px-2 py-1.5 text-xs text-amber-700">
          Outdated: the resume changed since this analysis. Re-run Analyse.
        </p>
      ) : null}

      <div className={isStale ? "opacity-50" : ""}>
        <AnalysisPanel />
      </div>
    </div>
  );
}
