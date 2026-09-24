import { useMemo, useState } from "react";
import { useResumeStore } from "../../../state/resumeStore.js";
import { useAppStore } from "../../../state/appStore.js";
import { tailorBullet } from "../../../api/client.js";
import { checkBullet, jdAwareTip, parseJD } from "@resume-maker/shared";
import { Button, TextArea } from "../../shared/ui.jsx";
import SuggestionCard from "../SuggestionCard.jsx";

export default function BulletList({ section, item, context }) {
  const setBulletText = useResumeStore((s) => s.setBulletText);
  const setBulletSuggestion = useResumeStore((s) => s.setBulletSuggestion);
  const acceptBullet = useResumeStore((s) => s.acceptBullet);
  const revertBullet = useResumeStore((s) => s.revertBullet);
  const dismissSuggestion = useResumeStore((s) => s.dismissSuggestion);
  const addBullet = useResumeStore((s) => s.addBullet);
  const removeBullet = useResumeStore((s) => s.removeBullet);
  const jdText = useResumeStore((s) => s.resumeData.meta.targetJD);
  const aiEnabled = useAppStore((s) => s.aiEnabled);

  const [busyId, setBusyId] = useState(null);
  const [errors, setErrors] = useState({});

  const canTailor = aiEnabled && Boolean(jdText?.trim());

  // Rule-based tips: run live as the user types, cost nothing, and never
  // rewrite anything — see shared/text/bulletChecks.js.
  const jdSkillIds = useMemo(() => {
    if (!jdText?.trim()) return [];
    const parsed = parseJD(jdText);
    return [...parsed.required, ...parsed.preferred];
  }, [jdText]);
  const stackTip = useMemo(() => jdAwareTip(item, jdSkillIds), [item, jdSkillIds]);

  async function handleTailor(bullet) {
    if (!bullet.original?.trim()) return;
    setBusyId(bullet.id);
    setErrors((e) => ({ ...e, [bullet.id]: null }));
    try {
      const result = await tailorBullet(bullet.original, jdText, context);
      setBulletSuggestion(section, item.id, bullet.id, {
        text: result.bullet,
        note: result.note,
        createdAt: new Date().toISOString(),
      });
    } catch (err) {
      setErrors((e) => ({ ...e, [bullet.id]: err.message }));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-2">
      <span className="block text-xs font-medium text-slate-600">Bullets</span>
      {item.bullets.map((bullet) => (
        <div key={bullet.id} className="space-y-1.5">
          <div className="flex items-start gap-2">
            <TextArea
              rows={2}
              value={bullet.original}
              placeholder="Built X using Y, which did Z"
              onChange={(e) =>
                setBulletText(section, item.id, bullet.id, e.target.value)
              }
            />
            <div className="flex shrink-0 flex-col gap-1">
              {aiEnabled ? (
                <Button
                  variant="secondary"
                  className="px-2 py-1 text-xs whitespace-nowrap"
                  disabled={!canTailor || busyId === bullet.id || !bullet.original.trim()}
                  title={jdText?.trim() ? "Suggest a rewrite against the JD" : "Paste a JD first"}
                  onClick={() => handleTailor(bullet)}
                >
                  {busyId === bullet.id ? "..." : "Tailor"}
                </Button>
              ) : null}
              {item.bullets.length > 1 ? (
                <Button
                  variant="danger"
                  className="px-2 py-1 text-xs"
                  onClick={() => removeBullet(section, item.id, bullet.id)}
                >
                  Delete
                </Button>
              ) : null}
            </div>
          </div>

          <SuggestionCard
            bullet={bullet}
            onAccept={() => acceptBullet(section, item.id, bullet.id)}
            onRevert={() => revertBullet(section, item.id, bullet.id)}
            onDismiss={() => dismissSuggestion(section, item.id, bullet.id)}
          />

          {checkBullet(bullet.original).map((tip) => (
            <span
              key={tip.code}
              className="mr-1.5 inline-block rounded bg-amber-50 px-1.5 py-0.5 text-[11px] text-amber-700"
            >
              {tip.message}
            </span>
          ))}

          {errors[bullet.id] ? (
            <p className="text-xs text-red-500">{errors[bullet.id]}</p>
          ) : null}
        </div>
      ))}
      {stackTip ? (
        <p className="rounded bg-sky-50 px-1.5 py-1 text-[11px] text-sky-700">
          {stackTip.message}
        </p>
      ) : null}
      <Button
        variant="ghost"
        className="px-2 py-1 text-xs"
        onClick={() => addBullet(section, item.id)}
      >
        + Add bullet
      </Button>
    </div>
  );
}
