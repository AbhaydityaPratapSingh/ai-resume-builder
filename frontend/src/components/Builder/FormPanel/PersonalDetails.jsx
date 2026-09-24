import { useResumeStore } from "../../../state/resumeStore.js";
import { FormSection, TextInput } from "../../shared/ui.jsx";

const FIELDS = [
  { key: "name", label: "Full name", placeholder: "Aditi Sharma" },
  { key: "email", label: "Email", placeholder: "aditi@example.com", type: "email" },
  { key: "phone", label: "Phone", placeholder: "+91 98765 43210" },
  { key: "location", label: "Location", placeholder: "Pune, India" },
];

const LINK_TYPES = [
  { type: "linkedin", label: "LinkedIn", placeholder: "linkedin.com/in/aditi" },
  { type: "github", label: "GitHub", placeholder: "github.com/aditi" },
  { type: "portfolio", label: "Portfolio", placeholder: "aditi.dev" },
  { type: "leetcode", label: "LeetCode", placeholder: "leetcode.com/u/aditi" },
  { type: "codechef", label: "CodeChef", placeholder: "codechef.com/users/aditi" },
  { type: "codeforces", label: "Codeforces", placeholder: "codeforces.com/profile/aditi" },
];

export default function PersonalDetails() {
  const personal = useResumeStore((s) => s.resumeData.personal);
  const setPersonal = useResumeStore((s) => s.setPersonal);
  const setLinks = useResumeStore((s) => s.setLinks);

  const linkValue = (type) =>
    (personal.links || []).find((l) => l.type === type)?.url || "";

  function setLink(type, url) {
    const others = (personal.links || []).filter((l) => l.type !== type);
    setLinks(url.trim() ? [...others, { type, url: url.trim() }] : others);
  }

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
        {LINK_TYPES.map((l) => (
          <TextInput
            key={l.type}
            label={l.label}
            placeholder={l.placeholder}
            value={linkValue(l.type)}
            onChange={(e) => setLink(l.type, e.target.value)}
          />
        ))}
      </div>
    </FormSection>
  );
}
