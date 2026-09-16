import { useState } from "react";
import { useResumeStore } from "../../../state/resumeStore.js";
import { useAppStore } from "../../../state/appStore.js";
import { tailorBullet } from "../../../api/client.js";
import { Button, TextArea } from "../../shared/ui.jsx";

export default function BulletList({ section, item, context }) {
  const setBullet = useResumeStore((s) => s.setBullet);
  const addBullet = useResumeStore((s) => s.addBullet);
  const removeBullet = useResumeStore((s) => s.removeBullet);
  const jdText = useResumeStore((s) => s.resumeData.meta.targetJD);
  const aiEnabled = useAppStore((s) => s.aiEnabled);

  const [busyIndex, setBusyIndex] = useState(null);
  const [notes, setNotes] = useState({});

  const canTailor = aiEnabled && Boolean(jdText?.trim());

  async function handleTailor(index) {
    const original = item.bullets[index];
    if (!original?.trim()) return;
    setBusyIndex(index);
    try {
      const result = await tailorBullet(original, jdText, context);
      setBullet(section, item.id, index, result.bullet);
      setNotes((n) => ({ ...n, [index]: result.note }));
    } catch (err) {
      setNotes((n) => ({ ...n, [index]: err.message }));
    } finally {
      setBusyIndex(null);
    }
  }

  return (
    <div className="space-y-2">
      <span className="block text-xs font-medium text-slate-600">Bullets</span>
      {item.bullets.map((bullet, index) => (
        <div key={index} className="space-y-1">
          <div className="flex items-start gap-2">
            <TextArea
              rows={2}
              value={bullet}
              placeholder="Built X using Y, which did Z"
              onChange={(e) => setBullet(section, item.id, index, e.target.value)}
            />
            <div className="flex shrink-0 flex-col gap-1">
              <Button
                variant="secondary"
                className="px-2 py-1 text-xs whitespace-nowrap"
                disabled={!canTailor || busyIndex === index || !bullet.trim()}
                title={
                  aiEnabled
                    ? jdText?.trim()
                      ? "Rewrite this bullet against the JD"
                      : "Paste a JD first"
                    : "Backend has no ANTHROPIC_API_KEY"
                }
                onClick={() => handleTailor(index)}
              >
                {busyIndex === index ? "..." : "Tailor"}
              </Button>
              {item.bullets.length > 1 ? (
                <Button
                  variant="danger"
                  className="px-2 py-1 text-xs"
                  onClick={() => removeBullet(section, item.id, index)}
                >
                  Delete
                </Button>
              ) : null}
            </div>
          </div>
          {notes[index] ? (
            <p className="text-xs text-slate-500 italic">{notes[index]}</p>
          ) : null}
        </div>
      ))}
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
