import { useResumeStore } from "../../../state/resumeStore.js";
import { FormSection, TextArea } from "../../shared/ui.jsx";

export default function Skills() {
  const skills = useResumeStore((s) => s.resumeData.skills);
  const setSkills = useResumeStore((s) => s.setSkills);

  return (
    <FormSection title="Skills">
      <TextArea
        rows={3}
        hint="Comma separated. This is the section keyword matchers read most."
        placeholder="Java, Python, SQL, React, Git, Data Structures"
        value={skills.join(", ")}
        onChange={(e) =>
          setSkills(e.target.value.split(",").map((s) => s.trim()).filter(Boolean))
        }
      />
    </FormSection>
  );
}
