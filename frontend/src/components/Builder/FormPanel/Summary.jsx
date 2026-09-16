import { useResumeStore } from "../../../state/resumeStore.js";
import { FormSection, TextArea } from "../../shared/ui.jsx";

export default function Summary() {
  const summary = useResumeStore((s) => s.resumeData.summary);
  const setSummary = useResumeStore((s) => s.setSummary);

  return (
    <FormSection title="Summary">
      <TextArea
        rows={4}
        hint="Two or three lines. Skip it if you have nothing specific to say."
        placeholder="Final-year computer engineering student with internship experience in backend development..."
        value={summary}
        onChange={(e) => setSummary(e.target.value)}
      />
    </FormSection>
  );
}
