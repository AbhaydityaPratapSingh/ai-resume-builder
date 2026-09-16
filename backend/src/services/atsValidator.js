const CONTACT_RE = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  phone: /^[+\d][\d\s\-()]{6,}$/,
};

export function validateForATS(resumeData) {
  const warnings = [];
  const p = resumeData.personal || {};

  if (!p.name || !p.name.trim()) {
    warnings.push({
      field: "personal.name",
      message: "No name on the resume — parsers key off this first.",
    });
  }
  if (!p.email || !CONTACT_RE.email.test(p.email.trim())) {
    warnings.push({
      field: "personal.email",
      message: "Email is missing or not a valid address.",
    });
  }
  if (p.phone && !CONTACT_RE.phone.test(p.phone.trim())) {
    warnings.push({
      field: "personal.phone",
      message: "Phone number has characters that some parsers choke on.",
    });
  }
  if (!(resumeData.education || []).length) {
    warnings.push({
      field: "education",
      message: "No education entries — campus placement filters usually require this.",
    });
  }
  if (!(resumeData.skills || []).filter(Boolean).length) {
    warnings.push({
      field: "skills",
      message: "No skills listed — this is the section keyword matchers read most.",
    });
  }

  const bulletSources = [
    ...(resumeData.experience || []).flatMap((e) => e.bullets || []),
    ...(resumeData.projects || []).flatMap((p) => p.bullets || []),
  ].filter(Boolean);

  if (!bulletSources.length) {
    warnings.push({
      field: "bullets",
      message: "No bullets under any experience or project.",
    });
  }

  const longBullets = bulletSources.filter((b) => b.length > 220);
  if (longBullets.length) {
    warnings.push({
      field: "bullets",
      message: `${longBullets.length} bullet(s) run over ~220 characters — trim for readability.`,
    });
  }

  const nonAscii = bulletSources.filter((b) => /[^\x00-\x7F]/.test(b));
  if (nonAscii.length) {
    warnings.push({
      field: "bullets",
      message: `${nonAscii.length} bullet(s) contain non-ASCII characters (smart quotes, emoji) that can garble in older parsers.`,
    });
  }

  return { ok: warnings.length === 0, warnings };
}
