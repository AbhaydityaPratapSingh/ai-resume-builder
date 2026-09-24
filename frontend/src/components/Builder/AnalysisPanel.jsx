import { useAppStore } from "../../state/appStore.js";
import { useResumeStore } from "../../state/resumeStore.js";
import { makeId } from "@resume-maker/shared";
import { Button } from "../shared/ui.jsx";

function scoreColor(score) {
  if (score >= 86) return "text-emerald-600";
  if (score >= 71) return "text-lime-600";
  if (score >= 41) return "text-amber-600";
  return "text-red-500";
}

const SECTION_LABEL = { experience: "Experience", projects: "Projects" };

function SkillChip({ label, tone }) {
  const toneClass =
    tone === "critical"
      ? "bg-red-100 text-red-700"
      : tone === "nice"
      ? "bg-slate-200 text-slate-600"
      : "bg-emerald-100 text-emerald-700";
  return <span className={`rounded px-1.5 py-0.5 text-[11px] ${toneClass}`}>{label}</span>;
}

function EligibilityRow({ check }) {
  const icon = check.passed === true ? "✓" : check.passed === false ? "✗" : "?";
  const color =
    check.passed === true ? "text-emerald-600" : check.passed === false ? "text-red-500" : "text-slate-400";
  return (
    <li className="flex items-start gap-2 text-xs">
      <span className={`font-semibold ${color}`}>{icon}</span>
      <div>
        <span className="font-medium text-slate-700">{check.label}</span>
        <p className="text-slate-500">{check.detail}</p>
      </div>
    </li>
  );
}

export default function AnalysisPanel() {
  const analysis = useAppStore((s) => s.analysis);
  const skills = useResumeStore((s) => s.resumeData.skills);
  const setSkillGroups = useResumeStore((s) => s.setSkillGroups);
  const setSectionOrder = useResumeStore((s) => s.setSectionOrder);

  if (!analysis) return null;

  const {
    score,
    breakdown,
    matchedRequired,
    missingRequired,
    matchedPreferred,
    missingPreferred,
    eligibility,
    suggestedOrder,
  } = analysis;

  const allSkills = skills.flatMap((g) => g.items);

  function addSkill(label) {
    if (!skills.length) {
      setSkillGroups([{ id: makeId(), group: "Skills", items: [label] }]);
      return;
    }
    setSkillGroups(
      skills.map((g, i) => (i === 0 ? { ...g, items: [...g.items, label] } : g))
    );
  }

  const missing = [
    ...missingRequired.map((label) => ({ label, importance: "critical" })),
    ...missingPreferred.map((label) => ({ label, importance: "nice" })),
  ];

  return (
    <div className="mt-3 space-y-3">
      <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-3">
        <div className="flex items-baseline gap-2">
          <span className={`text-2xl font-semibold ${scoreColor(score)}`}>{score}</span>
          <span className="text-xs text-slate-400">/ 100 match</span>
        </div>
        <p className="mt-1 text-xs text-slate-500">
          Required {breakdown.requiredPct}% · Preferred {breakdown.preferredPct}% · Shown in
          your bullets {breakdown.bonusPct}%
        </p>
      </div>

      {matchedRequired.length || matchedPreferred.length ? (
        <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-3">
          <h4 className="mb-2 text-xs font-semibold tracking-wide text-slate-700 uppercase">
            Matched skills
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {matchedRequired.map((label) => (
              <SkillChip key={label} label={label} tone="matched" />
            ))}
            {matchedPreferred.map((label) => (
              <SkillChip key={label} label={label} tone="matched" />
            ))}
          </div>
        </div>
      ) : null}

      {missing.length ? (
        <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-3">
          <h4 className="mb-2 text-xs font-semibold tracking-wide text-slate-700 uppercase">
            Missing keywords
          </h4>
          <ul className="space-y-2">
            {missing.map((k) => (
              <li key={k.label} className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-slate-800">{k.label}</span>
                  <SkillChip label={k.importance === "critical" ? "critical" : "nice to have"} tone={k.importance} />
                </div>
                {!allSkills.includes(k.label) ? (
                  <Button
                    variant="secondary"
                    className="shrink-0 px-2 py-0.5 text-[11px]"
                    onClick={() => addSkill(k.label)}
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
      ) : (
        <p className="text-xs text-emerald-600">No obvious keyword gaps against this JD.</p>
      )}

      {eligibility.length ? (
        <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-3">
          <h4 className="mb-2 text-xs font-semibold tracking-wide text-slate-700 uppercase">
            Eligibility
          </h4>
          <ul className="space-y-2">
            {eligibility.map((check) => (
              <EligibilityRow key={check.id} check={check} />
            ))}
          </ul>
        </div>
      ) : null}

      {suggestedOrder.length === 2 ? (
        <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-3">
          <h4 className="mb-1 text-xs font-semibold tracking-wide text-slate-700 uppercase">
            Suggested section order
          </h4>
          <p className="text-xs text-slate-600">
            {suggestedOrder.map((k) => SECTION_LABEL[k]).join(" before ")} — it has more of
            this JD's skills.
          </p>
          {setSectionOrder ? (
            <Button
              variant="secondary"
              className="mt-2 px-2 py-0.5 text-[11px]"
              onClick={() => setSectionOrder(suggestedOrder)}
            >
              Apply order
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
