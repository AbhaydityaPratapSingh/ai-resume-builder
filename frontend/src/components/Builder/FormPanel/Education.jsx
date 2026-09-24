import { DEGREE_LEVELS, EDUCATION_LEVELS, SCHOOL_LEVELS } from "@resume-maker/shared";
import { useResumeStore } from "../../../state/resumeStore.js";
import { EmptyHint, FormSection, ItemCard, Select, TextInput } from "../../shared/ui.jsx";

const SCORE_TYPES = [
  { id: "cgpa", label: "CGPA" },
  { id: "percentage", label: "Percentage" },
];

function updateScore(score, field, value) {
  const base = score && typeof score === "object" ? score : { type: "cgpa", outOf: 10 };
  return { ...base, [field]: value };
}

export default function Education() {
  const education = useResumeStore((s) => s.resumeData.education);
  const addItem = useResumeStore((s) => s.addItem);
  const updateItem = useResumeStore((s) => s.updateItem);
  const removeItem = useResumeStore((s) => s.removeItem);

  return (
    <FormSection title="Education" addLabel="Education" onAdd={() => addItem("education")}>
      {education.length === 0 ? (
        <EmptyHint>Most campus filters check this section first.</EmptyHint>
      ) : null}
      {education.map((item) => {
        const isSchool = SCHOOL_LEVELS.includes(item.level);
        const isDegree = DEGREE_LEVELS.includes(item.level);
        // A level isn't picked yet: show both branch and board rather than
        // guessing, so nothing typed is ever lost once a level is chosen.
        const showBranch = isDegree || !item.level;
        const showBoard = isSchool || !item.level;
        const score = item.score && typeof item.score === "object" ? item.score : null;

        return (
          <ItemCard key={item.id} onRemove={() => removeItem("education", item.id)}>
            <div className="grid grid-cols-2 gap-3">
              <Select
                label="Level"
                placeholder="Select level"
                options={EDUCATION_LEVELS}
                value={item.level || ""}
                onChange={(e) => updateItem("education", item.id, "level", e.target.value)}
              />
              <TextInput
                label="Institution"
                placeholder="VIT Pune"
                value={item.institution}
                onChange={(e) =>
                  updateItem("education", item.id, "institution", e.target.value)
                }
              />
              <TextInput
                label="Degree"
                placeholder="B.Tech, Computer Engineering"
                value={item.degree}
                onChange={(e) => updateItem("education", item.id, "degree", e.target.value)}
              />
              {showBranch ? (
                <TextInput
                  label="Branch"
                  placeholder="Computer Science"
                  value={item.branch || ""}
                  onChange={(e) => updateItem("education", item.id, "branch", e.target.value)}
                />
              ) : null}
              {showBoard ? (
                <TextInput
                  label="Board"
                  placeholder="CBSE"
                  value={item.board || ""}
                  onChange={(e) => updateItem("education", item.id, "board", e.target.value)}
                />
              ) : null}
              <TextInput
                label="Start"
                placeholder="2022"
                value={item.startDate}
                onChange={(e) =>
                  updateItem("education", item.id, "startDate", e.target.value)
                }
              />
              <TextInput
                label="End"
                placeholder="2026"
                value={item.endDate}
                onChange={(e) =>
                  updateItem("education", item.id, "endDate", e.target.value)
                }
              />
            </div>

            {typeof item.score === "string" && item.score.trim() ? (
              <p className="text-xs text-slate-400">
                Currently: "{item.score}". Fill in the fields below to make it structured
                (used for eligibility checks) — this replaces the text above.
              </p>
            ) : null}

            <div className="grid grid-cols-3 gap-3">
              <Select
                label="Score type"
                options={SCORE_TYPES}
                value={score?.type || "cgpa"}
                onChange={(e) =>
                  updateItem("education", item.id, "score", updateScore(item.score, "type", e.target.value))
                }
              />
              <TextInput
                label="Value"
                type="number"
                step="0.01"
                placeholder={score?.type === "percentage" ? "82" : "8.6"}
                value={score?.value ?? ""}
                onChange={(e) =>
                  updateItem(
                    "education",
                    item.id,
                    "score",
                    updateScore(item.score, "value", e.target.value === "" ? "" : parseFloat(e.target.value))
                  )
                }
              />
              {(score?.type || "cgpa") === "cgpa" ? (
                <TextInput
                  label="Out of"
                  type="number"
                  placeholder="10"
                  value={score?.outOf ?? 10}
                  onChange={(e) =>
                    updateItem(
                      "education",
                      item.id,
                      "score",
                      updateScore(item.score, "outOf", e.target.value === "" ? "" : parseFloat(e.target.value))
                    )
                  }
                />
              ) : null}
            </div>
          </ItemCard>
        );
      })}
    </FormSection>
  );
}
