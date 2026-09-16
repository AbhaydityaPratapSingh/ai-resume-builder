import { useResumeStore } from "../../../state/resumeStore.js";
import { EmptyHint, FormSection, ItemCard, TextInput } from "../../shared/ui.jsx";
import BulletList from "./BulletList.jsx";

export default function Experience() {
  const experience = useResumeStore((s) => s.resumeData.experience);
  const addItem = useResumeStore((s) => s.addItem);
  const updateItem = useResumeStore((s) => s.updateItem);
  const removeItem = useResumeStore((s) => s.removeItem);

  return (
    <FormSection
      title="Experience"
      addLabel="Experience"
      onAdd={() => addItem("experience")}
    >
      {experience.length === 0 ? (
        <EmptyHint>Internships and part-time roles count here.</EmptyHint>
      ) : null}
      {experience.map((item) => (
        <ItemCard key={item.id} onRemove={() => removeItem("experience", item.id)}>
          <div className="grid grid-cols-2 gap-3">
            <TextInput
              label="Role"
              placeholder="Software Engineering Intern"
              value={item.role}
              onChange={(e) => updateItem("experience", item.id, "role", e.target.value)}
            />
            <TextInput
              label="Company"
              placeholder="Acme Corp"
              value={item.company}
              onChange={(e) =>
                updateItem("experience", item.id, "company", e.target.value)
              }
            />
            <TextInput
              label="Start"
              placeholder="May 2025"
              value={item.startDate}
              onChange={(e) =>
                updateItem("experience", item.id, "startDate", e.target.value)
              }
            />
            <TextInput
              label="End"
              placeholder="Jul 2025"
              value={item.endDate}
              onChange={(e) =>
                updateItem("experience", item.id, "endDate", e.target.value)
              }
            />
          </div>
          <BulletList
            section="experience"
            item={item}
            context={`${item.role} at ${item.company}`}
          />
        </ItemCard>
      ))}
    </FormSection>
  );
}
