import { useAppStore } from "../../state/appStore.js";

function scoreColor(score) {
  if (score >= 86) return "text-emerald-600";
  if (score >= 71) return "text-lime-600";
  if (score >= 41) return "text-amber-600";
  return "text-red-500";
}

export default function MatchScorePanel() {
  const matchScore = useAppStore((s) => s.matchScore);
  if (!matchScore) return null;

  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-3">
      <div className="flex items-baseline gap-2">
        <span className={`text-2xl font-semibold ${scoreColor(matchScore.score)}`}>
          {matchScore.score}
        </span>
        <span className="text-xs text-slate-400">/ 100 match</span>
      </div>
      <p className="mt-1 text-xs text-slate-600">{matchScore.summary}</p>

      {matchScore.strengths?.length ? (
        <p className="mt-2 text-xs text-slate-500">
          <span className="font-medium text-emerald-700">Strengths: </span>
          {matchScore.strengths.join(", ")}
        </p>
      ) : null}
      {matchScore.gaps?.length ? (
        <p className="mt-1 text-xs text-slate-500">
          <span className="font-medium text-red-600">Gaps: </span>
          {matchScore.gaps.join(", ")}
        </p>
      ) : null}
    </div>
  );
}
