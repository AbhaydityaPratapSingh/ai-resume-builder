import { useState } from "react";
import { SKILLS, generateProjectBullets } from "@resume-maker/shared";
import { useResumeStore } from "../../../state/resumeStore.js";
import { Button, EmptyHint, FormSection, ItemCard, TextArea, TextInput } from "../../shared/ui.jsx";
import BulletList from "./BulletList.jsx";
import GithubImportPanel from "./GithubImportPanel.jsx";

const SKILL_DATALIST_ID = "project-skill-options";

export default function Projects() {
  const projects = useResumeStore((s) => s.resumeData.projects);
  const addItem = useResumeStore((s) => s.addItem);
  const updateItem = useResumeStore((s) => s.updateItem);
  const updateProjectForm = useResumeStore((s) => s.updateProjectForm);
  const removeItem = useResumeStore((s) => s.removeItem);
  const appendBullets = useResumeStore((s) => s.appendBullets);

  const [showGithubImport, setShowGithubImport] = useState(false);

  function handleGenerate(item) {
    const drafts = generateProjectBullets(item.form, item.techStack);
    if (drafts.length) appendBullets("projects", item.id, drafts);
  }

  return (
    <FormSection title="Projects" addLabel="Project" onAdd={() => addItem("projects")}>
      {projects.length === 0 ? (
        <EmptyHint>
          For campus placements this section usually carries the most weight. Answer a
          few questions below and draft bullets are written for you — in your own words,
          nothing invented.
        </EmptyHint>
      ) : null}

      {/* Shared across every project's tech-stack input below. */}
      <datalist id={SKILL_DATALIST_ID}>
        {SKILLS.map((s) => (
          <option key={s.id} value={s.name} />
        ))}
      </datalist>

      {showGithubImport ? (
        <GithubImportPanel onClose={() => setShowGithubImport(false)} />
      ) : (
        <Button variant="secondary" className="px-3 py-1.5 text-xs" onClick={() => setShowGithubImport(true)}>
          Import from GitHub
        </Button>
      )}

      {projects.map((item) => {
        const canGenerate = Boolean(item.form.built || item.form.role || item.form.result || item.form.keyFeature);
        return (
          <ItemCard key={item.id} onRemove={() => removeItem("projects", item.id)}>
            <div className="grid grid-cols-2 gap-3">
              <TextInput
                label="Title"
                placeholder="Placement Tracker"
                value={item.title}
                onChange={(e) => updateItem("projects", item.id, "title", e.target.value)}
              />
              <TextInput
                label="Link"
                hint="GitHub repo or live demo — optional"
                placeholder="github.com/you/project"
                value={item.link}
                onChange={(e) => updateItem("projects", item.id, "link", e.target.value)}
              />
              <TextInput
                label="Start"
                placeholder="Jan 2026"
                value={item.startDate}
                onChange={(e) => updateItem("projects", item.id, "startDate", e.target.value)}
              />
              <TextInput
                label="End"
                placeholder="Mar 2026"
                value={item.endDate}
                onChange={(e) => updateItem("projects", item.id, "endDate", e.target.value)}
              />
            </div>

            <TextInput
              label="Tech used"
              hint="Comma separated — start typing for suggestions"
              placeholder="Node.js, Express, MongoDB"
              list={SKILL_DATALIST_ID}
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

            <div className="rounded-lg border border-dashed border-slate-300 p-3">
              <p className="mb-2 text-xs font-medium text-slate-500">
                Answer what applies — a draft bullet is generated from whatever you fill in.
              </p>
              <div className="space-y-3">
                <TextArea
                  label="Problem it solved"
                  rows={2}
                  placeholder="Hostel complaints were tracked on paper and often lost"
                  value={item.form.problem}
                  onChange={(e) => updateProjectForm(item.id, "problem", e.target.value)}
                />
                <TextArea
                  label="What you built"
                  rows={2}
                  placeholder="A web app for students to file and track complaints"
                  value={item.form.built}
                  onChange={(e) => updateProjectForm(item.id, "built", e.target.value)}
                />
                <TextInput
                  label="Your role"
                  hint='Default: "Built it solo" if you leave this blank'
                  placeholder="Built the backend and database"
                  value={item.form.role}
                  onChange={(e) => updateProjectForm(item.id, "role", e.target.value)}
                />
                <TextInput
                  label="Result or scale"
                  hint="Users, time saved, accuracy, size of data, rank in a hackathon"
                  placeholder="Used by 300 students in my hostel"
                  value={item.form.result}
                  onChange={(e) => updateProjectForm(item.id, "result", e.target.value)}
                />
                <TextInput
                  label="Key feature"
                  placeholder="Email alerts when a complaint is resolved"
                  value={item.form.keyFeature}
                  onChange={(e) => updateProjectForm(item.id, "keyFeature", e.target.value)}
                />
                <TextInput
                  label="Team size"
                  type="number"
                  placeholder="1"
                  value={item.form.teamSize ?? ""}
                  onChange={(e) =>
                    updateProjectForm(item.id, "teamSize", e.target.value === "" ? null : parseInt(e.target.value, 10))
                  }
                />
              </div>
              <Button
                variant="secondary"
                className="mt-3 px-3 py-1.5 text-xs"
                disabled={!canGenerate}
                onClick={() => handleGenerate(item)}
              >
                Generate bullets from these answers
              </Button>
            </div>

            <BulletList
              section="projects"
              item={item}
              context={`Project: ${item.title}${
                item.techStack.length ? ` (${item.techStack.join(", ")})` : ""
              }`}
            />
          </ItemCard>
        );
      })}
    </FormSection>
  );
}
