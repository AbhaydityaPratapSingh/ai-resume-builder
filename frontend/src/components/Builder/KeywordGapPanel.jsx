import { useAppStore } from "../../state/appStore.js";
import { useResumeStore } from "../../state/resumeStore.js";
import { Button } from "../shared/ui.jsx";

export default function KeywordGapPanel() {
  const keywordGap = useAppStore((s) => s.keywordGap);
  const skills = useResumeStore((s) => s.resumeData.skills);
  const setSkills = useResumeStore((s) => s.setSkills);

  if (!keywordGap) return null;

  const keywords = keywordGap.keywords || [];
  if (!keywords.length) {
    return (
      <p className="text-xs text-emerald-600">
        No obvious keyword gaps against this JD.
      </p>
    );
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-3">
      <h4 className="mb-2 text-xs font-semibold tracking-wide text-slate-700 uppercase">
        Missing keywords
      </h4>
      <ul className="space-y-2">
        {keywords.map((k) => (
          <li key={k.keyword} className="flex items-start justify-between gap-2">
            <div>
              <span className="text-xs font-medium text-slate-800">{k.keyword}</span>
              <span
                className={`ml-2 rounded px-1.5 py-0.5 text-[10px] ${
                  k.importance === "critical"
                    ? "bg-red-100 text-red-700"
                    : "bg-slate-200 text-slate-600"
                }`}
              >
                {k.importance}
              </span>
              <p className="mt-0.5 text-xs text-slate-500">{k.why}</p>
            </div>
            {!skills.includes(k.keyword) ? (
              <Button
                variant="secondary"
                className="shrink-0 px-2 py-0.5 text-[11px]"
                onClick={() => setSkills([...skills, k.keyword])}
                title="Only add it if you actually have this skill"
              >
                + Skill
              </Button>
            ) : null}
          </li>
        ))}
      </ul>
      <p className="mt-2 text-[11px] text-slate-400">
        Add a keyword only if it is genuinely true of you.
      </p>
    </div>
  );
}
