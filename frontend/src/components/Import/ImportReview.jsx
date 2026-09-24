import { useEffect, useState } from "react";
import { bulletText, emptyResume } from "@resume-maker/shared";
import { useAppStore } from "../../state/appStore.js";
import { useResumeStore } from "../../state/resumeStore.js";
import { Button, TextArea, TextInput } from "../shared/ui.jsx";

const SECTION_LABELS = {
  education: "Education",
  experience: "Experience",
  projects: "Projects",
  achievements: "Achievements",
  certifications: "Certifications",
  responsibilities: "Positions of responsibility",
};

function entryLabel(section, item) {
  if (section === "education") return item.institution || "(no institution found)";
  if (section === "experience" || section === "responsibilities") return item.role || "(untitled)";
  if (section === "projects") return item.title || "(untitled)";
  if (section === "certifications") return item.name || "(untitled)";
  if (section === "achievements") return item.text;
  return "";
}

function entryDetail(section, item) {
  if (section === "education") {
    const parts = [item.degree, item.score ? `${item.score.type === "percentage" ? `${item.score.value}%` : `CGPA ${item.score.value}/${item.score.outOf}`}` : null];
    return parts.filter(Boolean).join(" · ");
  }
  if (section === "certifications") return item.issuer;
  if (item.bullets?.length) return item.bullets.map(bulletText).join(" · ");
  return "";
}

// One list section with a keep/discard checkbox per detected entry. Nothing
// here is auto-structured further — this only decides what survives into
// the builder, where the user edits with the same form they'd use anyway.
function EntrySection({ section, items, kept, onToggle }) {
  if (!items.length) return null;
  return (
    <div className="border-b border-slate-200 py-4">
      <h3 className="mb-2 text-xs font-semibold tracking-wide text-slate-900 uppercase">
        {SECTION_LABELS[section]} ({items.length} found)
      </h3>
      <ul className="space-y-2">
        {items.map((item, i) => (
          <li key={item.id} className="flex items-start gap-2 rounded-md border border-slate-200 bg-slate-50/60 p-2">
            <input
              type="checkbox"
              className="mt-0.5"
              checked={kept.has(i)}
              onChange={() => onToggle(section, i)}
            />
            <div className="min-w-0">
              <p className="truncate text-sm text-slate-800">{entryLabel(section, item)}</p>
              {entryDetail(section, item) ? (
                <p className="truncate text-xs text-slate-500">{entryDetail(section, item)}</p>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

const LIST_SECTIONS = ["education", "experience", "projects", "achievements", "certifications", "responsibilities"];

export default function ImportReview() {
  const draft = useAppStore((s) => s.importDraft);
  const setImportDraft = useAppStore((s) => s.setImportDraft);
  const setView = useAppStore((s) => s.setView);
  const replaceResume = useResumeStore((s) => s.replaceResume);

  const [personal, setPersonal] = useState(() => ({
    name: draft?.personal?.name || "",
    email: draft?.personal?.email || "",
    phone: draft?.personal?.phone || "",
  }));
  const [summary, setSummary] = useState(draft?.summary || "");
  const [kept, setKept] = useState(() => {
    const initial = {};
    for (const section of LIST_SECTIONS) {
      initial[section] = new Set((draft?.[section] || []).map((_, i) => i));
    }
    return initial;
  });
  const [skillGroups, setSkillGroups] = useState(() => new Set((draft?.skills || []).map((_, i) => i)));

  // A direct visit to this view (e.g. a refresh) with no draft in memory
  // bounces back rather than rendering an empty review screen.
  useEffect(() => {
    if (!draft) setView("landing");
  }, [draft, setView]);
  if (!draft) return null;

  function toggle(section, index) {
    setKept((prev) => {
      const next = new Set(prev[section]);
      next.has(index) ? next.delete(index) : next.add(index);
      return { ...prev, [section]: next };
    });
  }

  function toggleSkillGroup(index) {
    setSkillGroups((prev) => {
      const next = new Set(prev);
      next.has(index) ? next.delete(index) : next.add(index);
      return next;
    });
  }

  function handleAccept() {
    const base = emptyResume();
    const resumeData = {
      ...base,
      schemaVersion: 2,
      personal: { ...base.personal, ...personal, links: draft.personal.links || [] },
      summary,
      education: (draft.education || []).filter((_, i) => kept.education.has(i)),
      experience: (draft.experience || []).filter((_, i) => kept.experience.has(i)),
      projects: (draft.projects || []).filter((_, i) => kept.projects.has(i)),
      skills: (draft.skills || []).filter((_, i) => skillGroups.has(i)),
      achievements: (draft.achievements || []).filter((_, i) => kept.achievements.has(i)),
      certifications: (draft.certifications || []).filter((_, i) => kept.certifications.has(i)),
      responsibilities: (draft.responsibilities || []).filter((_, i) => kept.responsibilities.has(i)),
    };
    replaceResume(resumeData);
    setImportDraft(null);
    setView("builder");
  }

  function handleDiscard() {
    setImportDraft(null);
    setView("landing");
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <button onClick={handleDiscard} className="mb-6 text-sm text-slate-500 hover:text-slate-900">
        &larr; Discard and go back
      </button>
      <h1 className="text-2xl font-semibold text-slate-900">Review what we found</h1>
      <p className="mt-1 text-sm text-slate-500">
        PDF text extraction isn't perfect — uncheck anything that's wrong or duplicated.
        Nothing is saved until you accept, and you can fine-tune everything in the builder
        afterward.
      </p>

      {draft.unmatched ? (
        <p className="mt-4 rounded border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-700">
          Some text didn't fall under a recognized heading and wasn't imported. You can
          paste it in manually after accepting.
        </p>
      ) : null}

      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <TextInput
          label="Name"
          value={personal.name}
          onChange={(e) => setPersonal((p) => ({ ...p, name: e.target.value }))}
        />
        <TextInput
          label="Email"
          value={personal.email}
          onChange={(e) => setPersonal((p) => ({ ...p, email: e.target.value }))}
        />
        <TextInput
          label="Phone"
          value={personal.phone}
          onChange={(e) => setPersonal((p) => ({ ...p, phone: e.target.value }))}
        />
      </div>
      {draft.personal.links?.length ? (
        <p className="mt-2 text-xs text-slate-500">
          Links found: {draft.personal.links.map((l) => l.url).join(", ")}
        </p>
      ) : null}

      <div className="mt-4">
        <TextArea label="Summary" rows={2} value={summary} onChange={(e) => setSummary(e.target.value)} />
      </div>

      {draft.skills?.length ? (
        <div className="border-b border-slate-200 py-4">
          <h3 className="mb-2 text-xs font-semibold tracking-wide text-slate-900 uppercase">
            Skills ({draft.skills.length} group{draft.skills.length === 1 ? "" : "s"} found)
          </h3>
          <ul className="space-y-2">
            {draft.skills.map((g, i) => (
              <li key={g.id} className="flex items-start gap-2 rounded-md border border-slate-200 bg-slate-50/60 p-2">
                <input
                  type="checkbox"
                  className="mt-0.5"
                  checked={skillGroups.has(i)}
                  onChange={() => toggleSkillGroup(i)}
                />
                <div>
                  <p className="text-sm text-slate-800">{g.group}</p>
                  <p className="text-xs text-slate-500">{g.items.join(", ")}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {LIST_SECTIONS.map((section) => (
        <EntrySection
          key={section}
          section={section}
          items={draft[section] || []}
          kept={kept[section]}
          onToggle={toggle}
        />
      ))}

      <div className="mt-6 flex gap-3">
        <Button onClick={handleAccept}>Accept and open the builder</Button>
        <Button variant="secondary" onClick={handleDiscard}>
          Discard
        </Button>
      </div>
    </div>
  );
}
