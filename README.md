# AI Resume Builder

A resume builder with ATS-style JD matching, aimed at Indian campus placements.
Students paste a job description and get a match score, missing keywords,
eligibility checks and live bullet-writing tips — all computed in the browser,
with no account and no API key. An optional AI layer can add JD-tailored
bullet rewrites on top, with their own words always kept alongside the
suggestion.

See [ARCHITECTURE.md](ARCHITECTURE.md) for the full target design.

## What works today

- Template gallery (two single-column, ATS-safe templates), or upload an
  existing resume PDF and review what a rule-based extractor found before
  anything is saved
- Split-screen builder with a true-A4 live preview and page-boundary markers
- Rule-based JD matching: match score, missing keywords, eligibility checks
  (CGPA/percentage, branch, graduation year) and a suggested section order —
  runs entirely in the browser, no API key needed
- Live bullet-writing tips (weak opener, no measurable result, passive voice,
  length) plus JD-aware tips built from your own tech stack
- Indian placement fields: Class X/XII vs. degree level, structured
  CGPA/percentage with eligibility checks, branch/board, achievements,
  positions of responsibility, LeetCode/CodeChef/Codeforces links
- Structured project form (problem, what you built, role, result, key
  feature) with tech-stack autocomplete — answer what applies and get 2–3
  draft bullets generated from templates, no AI needed; every word in a
  draft traces to what you typed
- Import projects from GitHub, ranked by how well each repo matches the
  pasted JD — no LLM, same rule-based skill matching as the match score
- Optional per-bullet AI rewrite with accept / revert — the original is never
  overwritten
- Rules-based ATS validation before every export
- PDF export via Puppeteer
- JSON backup and restore; resume data persists in `localStorage`

No account is needed and nothing is stored server-side.

## Requirements

- Node.js 20+
- Chrome or Chromium for PDF export (see below)

## Setup

```bash
npm install
cp backend/.env.example backend/.env
```

The defaults work as-is. **No API key is needed and nothing costs money** —
`AI_ENABLED=false` by default, and with the flag off the server never loads
anything under `backend/src/llm/`.

The optional AI layer (bullet tailoring) is opt-in:

```
AI_ENABLED=true
LLM_API_KEY=sk-ant-...
```

## Running

Two processes:

```bash
# terminal 1
cd backend && npm run dev     # http://localhost:3001

# terminal 2
cd frontend && npm run dev    # http://localhost:5173
```

Open http://localhost:5173. Vite proxies `/api` to the backend, so the browser
only ever talks to one origin.

## The Chrome dependency

PDF export runs headless Chrome. Puppeteer normally downloads its own copy on
`npm install`. If that download is slow or stalls, skip it and point Puppeteer
at a Chrome you already have:

```bash
PUPPETEER_SKIP_DOWNLOAD=true npm install
```

Then in `backend/.env`:

```
PUPPETEER_EXECUTABLE_PATH=/path/to/chrome
```

On a minimal Linux install, Chrome also needs system libraries that are not
present by default:

```bash
sudo apt-get install -y libnss3 libnspr4 libasound2t64
```

Without root, download those `.deb` packages, extract them with `dpkg -x`, and
point `LD_LIBRARY_PATH` in `backend/.env` at the extracted `lib` directory.

A Dockerfile that bundles Chrome and its dependencies is planned (Phase 4) and
will make this section unnecessary.

## WSL note

Running from a Windows-mounted path (`/mnt/c/...`) under WSL causes two
problems: file-watching events do not fire, and module loading is slow enough
that the backend takes ~25 seconds to start.

`vite.config.js` sets `usePolling` to work around the first. The real fix is to
clone into the Linux filesystem instead:

```bash
git clone <repo> ~/projects/ai-resume-builder
```

After moving, remove `usePolling` from `vite.config.js` and restore
`node --watch` in `backend/package.json`.

## Project layout

```
shared/       renderResumeHTML + schema and migrations, used by both sides
frontend/     React + Vite + Tailwind, Zustand state
backend/      Express API: export, ATS validation, LLM touchpoints
```

`shared/templates/` is the single renderer feeding both the live preview and
the PDF, so the two cannot drift apart.

## The JD matching engine

`shared/text/` holds the whole analysis engine: a skill dictionary (~130
SDE-scope skills with aliases), a JD parser (required vs. preferred sections,
eligibility extraction), the scoring engine, and bullet checks. It has no
dependencies and runs on both sides, though today only the frontend calls it.
Run its test suite with `npm test` (or `npm run test:analysis` for just the
analysis tests); see `tests/analysis/` for the labelled JD fixtures.

## The optional AI layer

Off by default and not required for anything. When `AI_ENABLED=false`, the
routes under `/api/llm` return 503, the buttons are hidden, and the provider
SDK is never imported.

Turned on, it adds one feature: a per-bullet Tailor button that suggests a
JD-aware rewrite. The prompt leads with an anti-fabrication rule — the model may
only rephrase what the bullet already says — and the suggestion is stored
*beside* the original as `bullet.suggestion`. Nothing is auto-accepted, and
Revert always restores the user's own words.

Both model ids in `backend/src/llm/models.js` are unverified against a live API.

## Status

Phases 1, 2 and 2.1 are done. Phase 2.5 is functionally complete: the
analysis engine (skill dictionary, JD parser, scoring, bullet tips), Indian
placement fields, and rule-based PDF import with a review screen are all in
and wired into the builder. Still open from 2.5: growing the skill
dictionary and JD test set past the SDE-only starting scope, and the
post-render PDF text checks (Section 8.3).

Phase 3 is done: the structured project form, the `projectBullets.js`
template engine, and importing projects from GitHub ranked against the
pasted JD (see below). A project-specific "Polish with AI" flow was
considered and dropped (ARCHITECTURE.md section 9.3) — the existing Tailor
button already covers AI rewriting generically. See the roadmap in the
architecture doc.

## Resume import from PDF

Upload button on the landing page and template gallery. The backend
extracts text with `pdf-parse` (no OCR — a scanned image with no text layer
returns a clear error) and a rule-based parser in `shared/import/` splits it
by common headings, pulls out contact info and structured education scores,
and groups bulleted lines under their entry. Nothing is saved until the
review screen's Accept: every detected entry has a checkbox, so a bad split
is unchecked rather than silently imported. Entry-level splitting depends on
the source PDF's bullets carrying a literal glyph (•, -, *, etc.) — true for
essentially every Word/LaTeX/Canva export, but a resume with no bullet
glyphs at all degrades to one entry per line rather than guessing wrong.

## Import projects from GitHub, ranked against the JD

In the project form, "Import from GitHub" takes a username, fetches their
public non-fork repos, and ranks them by how well each one's tech stack
matches the JD you pasted above — the same skill-overlap scoring the match
score uses, aimed at one repo instead of your whole resume. No LLM, no API
key, no OAuth: tech stack comes from a repo's manifest file
(`package.json`, `requirements.txt`, `go.mod`) mapped through the skill
dictionary, falling back to GitHub's own reported languages. You see why
each repo matched ("React, MongoDB — both required"), pick which ones to
import with a checkbox, and nothing is added until you do. An imported repo
pre-fills Title, Tech and Link — you still answer Problem, Role and Result
yourself before generating bullets.

Unauthenticated GitHub API access is 60 requests/hour, enough for a handful
of imports. Set `GITHUB_SERVER_TOKEN` in `backend/.env` (any plain PAT, no
scopes needed) to raise that to 5,000/hour — optional, the feature works
without it.
