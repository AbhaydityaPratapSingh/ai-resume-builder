import { useResumeStore } from "../../../state/resumeStore.js";
import { FormSection, TextInput } from "../../shared/ui.jsx";

const FIELDS = [
  { key: "name", label: "Full name", placeholder: "Aditi Sharma" },
  { key: "email", label: "Email", placeholder: "aditi@example.com", type: "email" },
  { key: "phone", label: "Phone", placeholder: "+91 98765 43210" },
  { key: "location", label: "Location", placeholder: "Pune, India" },
  { key: "linkedin", label: "LinkedIn", placeholder: "linkedin.com/in/aditi" },
  { key: "github", label: "GitHub", placeholder: "github.com/aditi" },
  { key: "portfolio", label: "Portfolio", placeholder: "aditi.dev" },
];

export default function PersonalDetails() {
  const personal = useResumeStore((s) => s.resumeData.personal);
  const setPersonal = useResumeStore((s) => s.setPersonal);

  return (
    <FormSection title="Personal details">
      <div className="grid grid-cols-2 gap-3">
        {FIELDS.map((f) => (
          <TextInput
            key={f.key}
            label={f.label}
            type={f.type || "text"}
            placeholder={f.placeholder}
            value={personal[f.key]}
            onChange={(e) => setPersonal(f.key, e.target.value)}
          />
        ))}
      </div>
    </FormSection>
  );
}
