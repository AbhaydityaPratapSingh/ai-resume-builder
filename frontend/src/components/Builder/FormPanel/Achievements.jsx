import { useResumeStore } from "../../../state/resumeStore.js";
import { Button, EmptyHint, FormSection, TextInput } from "../../shared/ui.jsx";

export default function Achievements() {
  const achievements = useResumeStore((s) => s.resumeData.achievements);
  const addItem = useResumeStore((s) => s.addItem);
  const updateItem = useResumeStore((s) => s.updateItem);
  const removeItem = useResumeStore((s) => s.removeItem);

  return (
    <FormSection
      title="Achievements"
      addLabel="Achievement"
      onAdd={() => addItem("achievements")}
    >
      {achievements.length === 0 ? (
        <EmptyHint>
          Hackathon wins, competitive programming ranks, scholarships — one line each.
        </EmptyHint>
      ) : null}
      {achievements.map((item) => (
        <div key={item.id} className="flex items-start gap-2">
          <TextInput
            placeholder="Winner, Smart India Hackathon 2025 (top 1% of 4,000 teams)"
            value={item.text}
            onChange={(e) => updateItem("achievements", item.id, "text", e.target.value)}
          />
          <Button
            variant="danger"
            className="shrink-0 px-2 py-1 text-xs"
            onClick={() => removeItem("achievements", item.id)}
          >
            Delete
          </Button>
        </div>
      ))}
    </FormSection>
  );
}
