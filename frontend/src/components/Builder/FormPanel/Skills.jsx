import { useResumeStore } from "../../../state/resumeStore.js";
import { EmptyHint, FormSection, ItemCard, TextArea, TextInput } from "../../shared/ui.jsx";

export default function Skills() {
  const skills = useResumeStore((s) => s.resumeData.skills);
  const addSkillGroup = useResumeStore((s) => s.addSkillGroup);
  const updateSkillGroup = useResumeStore((s) => s.updateSkillGroup);
  const removeSkillGroup = useResumeStore((s) => s.removeSkillGroup);

  return (
    <FormSection title="Skills" addLabel="Group" onAdd={addSkillGroup}>
      {skills.length === 0 ? (
        <EmptyHint>
          Add a group like Languages, Frameworks or Tools. This is the section keyword
          matchers read most.
        </EmptyHint>
      ) : null}
      {skills.map((group) => (
        <ItemCard key={group.id} onRemove={() => removeSkillGroup(group.id)}>
          <TextInput
            label="Group name"
            placeholder="Languages"
            value={group.group}
            onChange={(e) => updateSkillGroup(group.id, "group", e.target.value)}
          />
          <TextArea
            label="Skills"
            rows={2}
            hint="Comma separated"
            placeholder="Java, Python, SQL"
            value={group.items.join(", ")}
            onChange={(e) =>
              updateSkillGroup(
                group.id,
                "items",
                e.target.value.split(",").map((s) => s.trim()).filter(Boolean)
              )
            }
          />
        </ItemCard>
      ))}
    </FormSection>
  );
}
