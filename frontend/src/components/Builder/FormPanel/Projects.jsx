import { useResumeStore } from "../../../state/resumeStore.js";
import { EmptyHint, FormSection, ItemCard, TextInput } from "../../shared/ui.jsx";
import BulletList from "./BulletList.jsx";

export default function Projects() {
  const projects = useResumeStore((s) => s.resumeData.projects);
  const addItem = useResumeStore((s) => s.addItem);
  const updateItem = useResumeStore((s) => s.updateItem);
  const removeItem = useResumeStore((s) => s.removeItem);

  return (
    <FormSection title="Projects" addLabel="Project" onAdd={() => addItem("projects")}>
      {projects.length === 0 ? (
        <EmptyHint>
          For campus placements this section usually carries the most weight.
        </EmptyHint>
      ) : null}
      {projects.map((item) => (
        <ItemCard key={item.id} onRemove={() => removeItem("projects", item.id)}>
          <TextInput
            label="Title"
            placeholder="Placement Tracker"
            value={item.title}
            onChange={(e) => updateItem("projects", item.id, "title", e.target.value)}
          />
          <TextInput
            label="Tech stack"
            hint="Comma separated"
            placeholder="React, Node.js, PostgreSQL"
            value={item.techStack.join(", ")}
            onChange={(e) =>
              updateItem(
                "projects",
                item.id,
                "techStack",
                e.target.value.split(",").map((t) => t.trim()).filter(Boolean)
              )
            }
          />
          <BulletList
            section="projects"
            item={item}
            context={`Project: ${item.title}${
              item.techStack.length ? ` (${item.techStack.join(", ")})` : ""
            }`}
          />
        </ItemCard>
      ))}
    </FormSection>
  );
}
