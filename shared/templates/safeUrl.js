const ALLOWED_PROTOCOLS = new Set(["https:", "mailto:"]);

// Second line of defence: input validation can be bypassed (imported data,
// restored backups, a future API), so the renderer re-checks every URL.
export function safeUrl(raw) {
  if (!raw) return null;
  const trimmed = String(raw).trim();
  if (!trimmed) return null;

  const candidate = /^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;

  try {
    const url = new URL(candidate);
    return ALLOWED_PROTOCOLS.has(url.protocol) ? url.href : null;
  } catch {
    return null;
  }
}

export function displayUrl(raw) {
  const safe = safeUrl(raw);
  if (!safe) return "";
  return safe.replace(/^https:\/\//, "").replace(/^mailto:/, "").replace(/\/$/, "");
}
