import { Button } from "../shared/ui.jsx";

export default function SuggestionCard({
  bullet,
  onAccept,
  onRevert,
  onDismiss,
}) {
  const { suggestion, accepted } = bullet;
  if (!suggestion) return null;

  const isAccepted = accepted === "suggestion";
  const flagged = suggestion.guard?.flagged || [];

  return (
    <div
      className={`rounded-md border p-2.5 text-xs ${
        flagged.length
          ? "border-red-300 bg-red-50/60"
          : isAccepted
            ? "border-emerald-300 bg-emerald-50/60"
            : "border-slate-300 bg-white"
      }`}
    >
      <div className="mb-2 flex items-center justify-between">
        <span className="font-medium text-slate-700">
          {isAccepted ? "Using the suggestion" : "Suggested rewrite"}
        </span>
        <button
          onClick={onDismiss}
          className="text-[11px] text-slate-400 hover:text-slate-700"
        >
          Dismiss
        </button>
      </div>

      <div className="space-y-2">
        <div className={isAccepted ? "opacity-50" : ""}>
          <span className="block text-[10px] tracking-wide text-slate-400 uppercase">
            Your words
          </span>
          <p className="text-slate-700">{bullet.original}</p>
        </div>
        <div className={isAccepted ? "" : "opacity-90"}>
          <span className="block text-[10px] tracking-wide text-slate-400 uppercase">
            Suggestion
          </span>
          <p className="text-slate-900">{suggestion.text}</p>
        </div>
      </div>

      {suggestion.note ? (
        <p className="mt-2 text-[11px] text-slate-500 italic">{suggestion.note}</p>
      ) : null}

      {flagged.length ? (
        <p className="mt-2 rounded bg-red-100 px-2 py-1 text-[11px] text-red-700">
          Not in your original: <strong>{flagged.join(", ")}</strong>. Only accept if
          this is genuinely true of your work.
        </p>
      ) : null}

      <div className="mt-2.5 flex gap-2">
        {isAccepted ? (
          <Button variant="secondary" className="px-2 py-1 text-xs" onClick={onRevert}>
            Revert to my words
          </Button>
        ) : (
          <Button className="px-2 py-1 text-xs" onClick={onAccept}>
            Use this
          </Button>
        )}
      </div>
    </div>
  );
}
