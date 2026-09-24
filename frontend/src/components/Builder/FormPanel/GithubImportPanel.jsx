import { useState } from "react";
import { matchSkills, findSkill, parseJD, rankRepos } from "@resume-maker/shared";
import { fetchGithubRepos } from "../../../api/client.js";
import { useResumeStore } from "../../../state/resumeStore.js";
import { Button, TextInput } from "../../shared/ui.jsx";

// Reduces a repo's raw techStack (manifest dep names + GitHub language
// names, e.g. "react", "express", "JavaScript") to the skill dictionary's
// canonical display names, same as everywhere else in the app. Unrecognized
// entries are dropped rather than shown as noise.
function canonicalTechStack(rawTechStack) {
  const ids = matchSkills((rawTechStack || []).join(", "));
  return [...ids].map((id) => findSkill(id)?.name).filter(Boolean);
}

function RepoRow({ entry, checked, onToggle }) {
  const { repo, match } = entry;
  return (
    <li className="flex items-start gap-2 rounded-md border border-slate-200 bg-slate-50/60 p-2">
      <input type="checkbox" className="mt-0.5" checked={checked} onChange={onToggle} />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <span className="truncate text-sm font-medium text-slate-800">{repo.name}</span>
          {match ? (
            <span className="shrink-0 text-xs font-semibold text-slate-500">{match.score}% match</span>
          ) : null}
        </div>
        {repo.description ? <p className="truncate text-xs text-slate-500">{repo.description}</p> : null}
        {match && (match.matchedRequired.length || match.matchedPreferred.length) ? (
          <p className="mt-0.5 text-xs text-emerald-700">
            Matches: {[...match.matchedRequired, ...match.matchedPreferred].join(", ")}
          </p>
        ) : null}
      </div>
    </li>
  );
}

export default function GithubImportPanel({ onClose }) {
  const jdText = useResumeStore((s) => s.resumeData.meta.targetJD);
  const addProjectFromImport = useResumeStore((s) => s.addProjectFromImport);

  const [username, setUsername] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [ranked, setRanked] = useState(null); // [{ repo, match }]
  const [selected, setSelected] = useState(new Set());

  async function handleFetch() {
    if (!username.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const { repos } = await fetchGithubRepos(username.trim());
      const parsedJD = parseJD(jdText);
      setRanked(rankRepos(repos, parsedJD));
      setSelected(new Set());
    } catch (err) {
      setError(err.message);
      setRanked(null);
    } finally {
      setBusy(false);
    }
  }

  function toggle(name) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(name) ? next.delete(name) : next.add(name);
      return next;
    });
  }

  function handleImport() {
    for (const { repo } of ranked) {
      if (!selected.has(repo.name)) continue;
      addProjectFromImport({
        title: repo.name,
        link: repo.url,
        description: repo.description,
        techStack: canonicalTechStack(repo.techStack),
      });
    }
    onClose();
  }

  return (
    <div className="rounded-lg border border-slate-300 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-slate-900">Import from GitHub</h4>
        <button onClick={onClose} className="text-xs text-slate-400 hover:text-slate-700">
          Close
        </button>
      </div>

      <p className="mt-1 text-xs text-slate-500">
        {jdText?.trim()
          ? "Your repos are ranked against the JD you pasted above — no AI, just skill overlap."
          : "Paste a job description above first to rank repos by relevance, or fetch now to just browse."}
      </p>

      <div className="mt-3 flex gap-2">
        <TextInput
          placeholder="GitHub username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleFetch()}
        />
        <Button onClick={handleFetch} disabled={busy || !username.trim()} className="shrink-0 px-3 py-2 text-xs">
          {busy ? "Fetching..." : "Fetch repos"}
        </Button>
      </div>

      {error ? <p className="mt-2 text-xs text-red-500">{error}</p> : null}

      {ranked ? (
        ranked.length ? (
          <>
            <ul className="mt-3 max-h-64 space-y-2 overflow-y-auto">
              {ranked.map((entry) => (
                <RepoRow
                  key={entry.repo.name}
                  entry={entry}
                  checked={selected.has(entry.repo.name)}
                  onToggle={() => toggle(entry.repo.name)}
                />
              ))}
            </ul>
            <p className="mt-2 text-[11px] text-slate-400">
              Importing pre-fills Title, Tech and Link. You still answer Problem, Role and
              Result yourself before generating bullets.
            </p>
            <Button
              className="mt-3 px-3 py-1.5 text-xs"
              disabled={!selected.size}
              onClick={handleImport}
            >
              Import {selected.size || ""} selected
            </Button>
          </>
        ) : (
          <p className="mt-3 text-xs text-slate-500">No public, non-fork repos found.</p>
        )
      ) : null}
    </div>
  );
}
