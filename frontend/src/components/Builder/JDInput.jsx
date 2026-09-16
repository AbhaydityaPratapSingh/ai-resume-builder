import { useState } from "react";
import { useResumeStore } from "../../state/resumeStore.js";
import { useAppStore } from "../../state/appStore.js";
import { analyzeKeywordGap, scoreMatch } from "../../api/client.js";
import { Button, TextArea } from "../shared/ui.jsx";
import KeywordGapPanel from "./KeywordGapPanel.jsx";
import MatchScorePanel from "./MatchScorePanel.jsx";

export default function JDInput() {
  const resumeData = useResumeStore((s) => s.resumeData);
  const setTargetJD = useResumeStore((s) => s.setTargetJD);
  const jdText = resumeData.meta.targetJD;

  const aiEnabled = useAppStore((s) => s.aiEnabled);
  const setKeywordGap = useAppStore((s) => s.setKeywordGap);
  const setMatchScore = useAppStore((s) => s.setMatchScore);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  async function handleAnalyze() {
    setBusy(true);
    setError(null);
    try {
      const [gap, score] = await Promise.all([
        analyzeKeywordGap(resumeData, jdText),
        scoreMatch(resumeData, jdText),
      ]);
      setKeywordGap(gap);
      setMatchScore(score);
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
        <Button
          onClick={handleAnalyze}
          disabled={busy || !aiEnabled || !jdText.trim()}
          className="px-3 py-1.5 text-xs"
          title={aiEnabled ? undefined : "Backend has no ANTHROPIC_API_KEY"}
        >
          {busy ? "Analysing..." : "Analyse"}
        </Button>
      </div>

      <TextArea
        rows={6}
        placeholder="Paste the full job description here..."
        value={jdText}
        onChange={(e) => setTargetJD(e.target.value)}
      />

      {!aiEnabled ? (
        <p className="text-xs text-amber-600">
          AI features are off — set ANTHROPIC_API_KEY in backend/.env and restart the
          backend.
        </p>
      ) : null}
      {error ? <p className="text-xs text-red-500">{error}</p> : null}

      <MatchScorePanel />
      <KeywordGapPanel />
    </div>
  );
}
