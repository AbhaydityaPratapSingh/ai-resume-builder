import { useResumeStore } from "../../../state/resumeStore.js";
import { EmptyHint, FormSection, ItemCard, TextInput } from "../../shared/ui.jsx";

export default function Education() {
  const education = useResumeStore((s) => s.resumeData.education);
  const addItem = useResumeStore((s) => s.addItem);
  const updateItem = useResumeStore((s) => s.updateItem);
  const removeItem = useResumeStore((s) => s.removeItem);

  return (
    <FormSection title="Education" addLabel="Education" onAdd={() => addItem("education")}>
      {education.length === 0 ? (
        <EmptyHint>Most campus filters check this section first.</EmptyHint>
      ) : null}
      {education.map((item) => (
        <ItemCard key={item.id} onRemove={() => removeItem("education", item.id)}>
          <div className="grid grid-cols-2 gap-3">
            <TextInput
              label="Institution"
              placeholder="VIT Pune"
              value={item.institution}
              onChange={(e) =>
                updateItem("education", item.id, "institution", e.target.value)
              }
            />
            <TextInput
              label="Degree"
              placeholder="B.Tech, Computer Engineering"
              value={item.degree}
              onChange={(e) => updateItem("education", item.id, "degree", e.target.value)}
            />
            <TextInput
              label="Start"
              placeholder="2022"
              value={item.startDate}
              onChange={(e) =>
                updateItem("education", item.id, "startDate", e.target.value)
              }
            />
            <TextInput
              label="End"
              placeholder="2026"
              value={item.endDate}
              onChange={(e) =>
                updateItem("education", item.id, "endDate", e.target.value)
              }
            />
          </div>
          <TextInput
            label="Score"
            placeholder="CGPA 8.6/10"
            value={item.score}
            onChange={(e) => updateItem("education", item.id, "score", e.target.value)}
          />
        </ItemCard>
      ))}
    </FormSection>
  );
}
