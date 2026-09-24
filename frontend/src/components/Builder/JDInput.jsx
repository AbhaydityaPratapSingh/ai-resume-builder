import { useState } from "react";
import { useResumeStore } from "../../state/resumeStore.js";
import { useAppStore, hashResume } from "../../state/appStore.js";
import { analyzeKeywordGap, scoreMatch } from "../../api/client.js";
import { Button, TextArea } from "../shared/ui.jsx";
import KeywordGapPanel from "./KeywordGapPanel.jsx";
import MatchScorePanel from "./MatchScorePanel.jsx";

export default function JDInput() {
  const resumeData = useResumeStore((s) => s.resumeData);
  const setTargetJD = useResumeStore((s) => s.setTargetJD);
  const jdText = resumeData.meta.targetJD;

  const aiEnabled = useAppStore((s) => s.aiEnabled);
  const setAnalysis = useAppStore((s) => s.setAnalysis);
  const analysisHash = useAppStore((s) => s.analysisHash);
  const hasAnalysis = useAppStore((s) => Boolean(s.matchScore || s.keywordGap));

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const currentHash = hashResume(resumeData);
  const isStale = hasAnalysis && analysisHash !== currentHash;

  async function handleAnalyze() {
    setBusy(true);
    setError(null);
    try {
      const [keywordGap, matchScore] = await Promise.all([
        analyzeKeywordGap(resumeData, jdText),
        scoreMatch(resumeData, jdText),
      ]);
      setAnalysis({ keywordGap, matchScore, analysisHash: hashResume(resumeData) });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3 border-b border-slate-200 bg-white px-5 py-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold tracking-wide text-slate-900 uppercase">
          Target job description
        </h3>
        {aiEnabled ? (
          <Button
            onClick={handleAnalyze}
            disabled={busy || !jdText.trim()}
            className="px-3 py-1.5 text-xs"
          >
            {busy ? "Analysing..." : isStale ? "Re-run Analyse" : "Analyse"}
          </Button>
        ) : null}
      </div>

      <TextArea
        rows={6}
        placeholder="Paste the full job description here..."
        value={jdText}
        onChange={(e) => setTargetJD(e.target.value)}
      />

      {!aiEnabled ? (
        <p className="text-xs text-slate-500">
          Saved with your resume. Rule-based JD matching — score, missing skills and
          eligibility — is the next thing being built; it will run here with no API key
          needed.
        </p>
      ) : null}
      {error ? <p className="text-xs text-red-500">{error}</p> : null}

      {isStale ? (
        <p className="rounded border border-amber-300 bg-amber-50 px-2 py-1.5 text-xs text-amber-700">
          Outdated: the resume changed since this analysis. Re-run Analyse.
        </p>
      ) : null}

      <div className={isStale ? "opacity-50" : ""}>
        <MatchScorePanel />
        <KeywordGapPanel />
      </div>
    </div>
  );
}
