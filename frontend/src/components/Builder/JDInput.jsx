import { useResumeStore } from "../../state/resumeStore.js";
import { useAppStore, hashResume } from "../../state/appStore.js";
import { parseJD, scoreResume } from "@resume-maker/shared";
import { Button, TextArea } from "../shared/ui.jsx";
import AnalysisPanel from "./AnalysisPanel.jsx";

export default function JDInput() {
  const resumeData = useResumeStore((s) => s.resumeData);
  const setTargetJD = useResumeStore((s) => s.setTargetJD);
  const jdText = resumeData.meta.targetJD;

  const setAnalysis = useAppStore((s) => s.setAnalysis);
  const analysisHash = useAppStore((s) => s.analysisHash);
  const hasAnalysis = useAppStore((s) => Boolean(s.analysis));

  const currentHash = hashResume(resumeData);
  const isStale = hasAnalysis && analysisHash !== currentHash;

  // Runs entirely in the browser — no network call, no API key, well under a
  // second even on a long JD. See shared/text for the analysis engine.
  function handleAnalyze() {
    const parsedJD = parseJD(jdText);
    const analysis = scoreResume(resumeData, parsedJD);
    setAnalysis({ analysis, analysisHash: hashResume(resumeData) });
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

      <TextArea
        rows={6}
        placeholder="Paste the full job description here..."
        value={jdText}
        onChange={(e) => setTargetJD(e.target.value)}
      />

      <p className="text-xs text-slate-500">
        Runs in your browser — no account, no API key, nothing sent anywhere.
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
