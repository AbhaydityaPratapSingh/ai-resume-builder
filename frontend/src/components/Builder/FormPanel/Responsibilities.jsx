import { useResumeStore } from "../../../state/resumeStore.js";
import { EmptyHint, FormSection, ItemCard, TextInput } from "../../shared/ui.jsx";
import BulletList from "./BulletList.jsx";

export default function Responsibilities() {
  const responsibilities = useResumeStore((s) => s.resumeData.responsibilities);
  const addItem = useResumeStore((s) => s.addItem);
  const updateItem = useResumeStore((s) => s.updateItem);
  const removeItem = useResumeStore((s) => s.removeItem);

  return (
    <FormSection
      title="Positions of responsibility"
      addLabel="Position"
      onAdd={() => addItem("responsibilities")}
    >
      {responsibilities.length === 0 ? (
        <EmptyHint>
          Club/committee roles, class representative, event organizing — common on
          Indian placement resumes.
        </EmptyHint>
      ) : null}
      {responsibilities.map((item) => (
        <ItemCard key={item.id} onRemove={() => removeItem("responsibilities", item.id)}>
          <div className="grid grid-cols-2 gap-3">
            <TextInput
              label="Role"
              placeholder="Technical Lead"
              value={item.role}
              onChange={(e) =>
                updateItem("responsibilities", item.id, "role", e.target.value)
              }
            />
            <TextInput
              label="Organization"
              placeholder="Coding Club"
              value={item.org}
              onChange={(e) =>
                updateItem("responsibilities", item.id, "org", e.target.value)
              }
            />
            <TextInput
              label="Start"
              placeholder="Aug 2024"
              value={item.startDate}
              onChange={(e) =>
                updateItem("responsibilities", item.id, "startDate", e.target.value)
              }
            />
            <TextInput
              label="End"
              placeholder="Present"
              value={item.endDate}
              onChange={(e) =>
                updateItem("responsibilities", item.id, "endDate", e.target.value)
              }
            />
          </div>
          <BulletList
            section="responsibilities"
            item={item}
            context={`${item.role} at ${item.org}`}
          />
        </ItemCard>
      ))}
    </FormSection>
  );
}
