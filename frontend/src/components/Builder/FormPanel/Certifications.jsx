import { useResumeStore } from "../../../state/resumeStore.js";
import { EmptyHint, FormSection, ItemCard, TextInput } from "../../shared/ui.jsx";

export default function Certifications() {
  const certifications = useResumeStore((s) => s.resumeData.certifications);
  const addItem = useResumeStore((s) => s.addItem);
  const updateItem = useResumeStore((s) => s.updateItem);
  const removeItem = useResumeStore((s) => s.removeItem);

  return (
    <FormSection
      title="Certifications"
      addLabel="Certification"
      onAdd={() => addItem("certifications")}
    >
      {certifications.length === 0 ? (
        <EmptyHint>Optional. Leave empty if you have none worth listing.</EmptyHint>
      ) : null}
      {certifications.map((item) => (
        <ItemCard key={item.id} onRemove={() => removeItem("certifications", item.id)}>
          <TextInput
            label="Name"
            placeholder="AWS Cloud Practitioner"
            value={item.name}
            onChange={(e) =>
              updateItem("certifications", item.id, "name", e.target.value)
            }
          />
          <div className="grid grid-cols-2 gap-3">
            <TextInput
              label="Issuer"
              placeholder="Amazon Web Services"
              value={item.issuer}
              onChange={(e) =>
                updateItem("certifications", item.id, "issuer", e.target.value)
              }
            />
            <TextInput
              label="Date"
              placeholder="Mar 2025"
              value={item.date}
              onChange={(e) =>
                updateItem("certifications", item.id, "date", e.target.value)
              }
            />
          </div>
        </ItemCard>
      ))}
    </FormSection>
  );
}
