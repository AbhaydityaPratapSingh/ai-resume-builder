# AI Resume Builder

A resume builder with ATS-style JD matching, aimed at Indian campus placements.
Students paste a job description, get a keyword gap and match score, and can ask
for a JD-tailored rewrite of any bullet — with their own words always kept
alongside the suggestion.

See [ARCHITECTURE.md](ARCHITECTURE.md) for the full target design.

## What works today

- Template gallery (two single-column, ATS-safe templates)
- Split-screen builder with a true-A4 live preview and page-boundary markers
- Per-bullet AI rewrite with accept / revert — the original is never overwritten
- JD keyword gap and match score
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

Phases 1, 2 and 2.1 are done. Next is Phase 2.5: a rule-based analysis engine
(skill dictionary, JD parser, scoring, bullet tips) so JD matching works with no
API key at all. See the roadmap in the architecture doc.
