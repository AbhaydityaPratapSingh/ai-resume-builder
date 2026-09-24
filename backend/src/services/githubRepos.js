// Fetches a GitHub user's public repos and reduces each one to
// {name, description, url, updatedAt, techStack}. No OAuth: public repo
// data needs no user token, and the app never asks for one. techStack
// comes from manifest dependencies first (a fact — "express" in
// package.json means Express), then the repo's languages as a fallback.
// Scoring that techStack against a JD happens separately, in
// shared/text/repoScore.js, which makes no network call of its own.

const GITHUB_API = "https://api.github.com";
const MAX_REPOS = 12;
// Ordered by how much signal a manifest carries; contents.js checks each
// in turn and stops at the first one present. pom.xml/build.gradle aren't
// parsed for now — Maven/Gradle dependency blocks are XML/DSL, not a quick
// key-list read like the others — so a Java/Kotlin repo still gets a
// techStack from its GitHub-reported languages, just not from its deps.
const MANIFESTS = ["package.json", "requirements.txt", "go.mod"];

export class GithubUserNotFoundError extends Error {}
export class GithubRateLimitError extends Error {}

function authHeaders() {
  const headers = { "User-Agent": "ai-resume-builder", Accept: "application/vnd.github+json" };
  const token = process.env.GITHUB_SERVER_TOKEN;
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

async function ghFetch(path) {
  const res = await fetch(`${GITHUB_API}${path}`, { headers: authHeaders() });
  if (res.status === 404) throw new GithubUserNotFoundError(`Not found: ${path}`);
  if (res.status === 403 || res.status === 429) {
    throw new GithubRateLimitError(
      "GitHub API rate limit hit. Unauthenticated requests are capped at 60/hour — try again shortly."
    );
  }
  if (!res.ok) throw new Error(`GitHub API error ${res.status} on ${path}`);
  return res.json();
}

function parsePackageJson(content) {
  try {
    const pkg = JSON.parse(content);
    return Object.keys({ ...pkg.dependencies, ...pkg.devDependencies });
  } catch {
    return [];
  }
}

function parseRequirementsTxt(content) {
  return content
    .split(/\r?\n/)
    .map((line) => line.split(/[=<>#;\s]/)[0].trim())
    .filter((name) => name && !name.startsWith("-"));
}

function parseGoMod(content) {
  // Module paths after "require" (single-line or inside a require(...)
  // block); the last path segment is usually the meaningful package name.
  return content
    .split(/\r?\n/)
    .filter((line) => /^\s*[\w.\-/]+\.[\w.\-/]+\s+v\d/.test(line))
    .map((line) => line.trim().split(/\s+/)[0])
    .map((path) => path.split("/").pop());
}

function parseManifest(file, content) {
  if (file === "package.json") return parsePackageJson(content);
  if (file === "requirements.txt") return parseRequirementsTxt(content);
  if (file === "go.mod") return parseGoMod(content);
  return [];
}

async function fetchManifestDeps(owner, repo) {
  for (const file of MANIFESTS) {
    try {
      const data = await ghFetch(`/repos/${owner}/${repo}/contents/${file}`);
      if (data.encoding !== "base64" || !data.content) continue;
      const content = Buffer.from(data.content, "base64").toString("utf8");
      const deps = parseManifest(file, content);
      if (deps.length) return deps;
    } catch {
      // Not found or unreadable — try the next manifest in the list.
    }
  }
  return [];
}

async function fetchLanguages(owner, repo) {
  try {
    const langs = await ghFetch(`/repos/${owner}/${repo}/languages`);
    return Object.keys(langs);
  } catch {
    return [];
  }
}

async function buildRepo(summary) {
  const owner = summary.owner.login;
  const [deps, languages] = await Promise.all([
    fetchManifestDeps(owner, summary.name),
    fetchLanguages(owner, summary.name),
  ]);
  return {
    name: summary.name,
    description: summary.description || "",
    url: summary.html_url,
    updatedAt: summary.updated_at,
    // Manifest deps are listed first — they're read by scoreRepoAgainstJD
    // as free text either way, but keeping them first is a cheap
    // tie-breaker if this list is ever shown truncated.
    techStack: [...new Set([...deps, ...languages])],
  };
}

/**
 * Fetches up to `limit` of a user's most recently updated, non-fork public
 * repos, each reduced to a techStack ready for scoreRepoAgainstJD. Throws
 * GithubUserNotFoundError for an unknown username, GithubRateLimitError
 * when GitHub's rate limit is hit (set GITHUB_SERVER_TOKEN to raise it from
 * 60/hour to 5,000/hour).
 */
export async function fetchUserRepos(username, { limit = MAX_REPOS } = {}) {
  const list = await ghFetch(`/users/${encodeURIComponent(username)}/repos?per_page=100&sort=updated`);
  const nonForks = list.filter((r) => !r.fork).slice(0, limit);
  return Promise.all(nonForks.map(buildRepo));
}
