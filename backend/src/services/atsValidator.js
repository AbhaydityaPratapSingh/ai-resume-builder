import { bulletText, hasPendingSuggestion } from "@resume-maker/shared";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^(\+?\d{1,3}[\s-]?)?\d{5}[\s-]?\d{5}$|^\+?[\d][\d\s\-()]{6,}$/;

// Rupee sign, dashes, quotes, accented Latin, and Indian scripts are legitimate
// in a resume — flag them as info, never as a warning.
const ALLOWED_NON_ASCII =
  /[₹–—''""·À-ɏऀ-ॿ஀-௿ఀ-౿ঀ-৿]/;

function allBullets(resumeData) {
  return [
    ...(resumeData.experience || []).flatMap((e) => e.bullets || []),
    ...(resumeData.projects || []).flatMap((p) => p.bullets || []),
    ...(resumeData.responsibilities || []).flatMap((r) => r.bullets || []),
  ];
}

export function validateForATS(resumeData) {
  const warnings = [];
  const info = [];
  const p = resumeData.personal || {};

  if (!p.name || !p.name.trim()) {
    warnings.push({
      field: "personal.name",
      message: "No name on the resume — parsers key off this first.",
    });
  }
  if (!p.email || !EMAIL_RE.test(p.email.trim())) {
    warnings.push({
      field: "personal.email",
      message: "Email is missing or not a valid address.",
    });
  }
  if (!p.phone || !p.phone.trim()) {
    warnings.push({ field: "personal.phone", message: "No phone number." });
  } else if (!PHONE_RE.test(p.phone.trim())) {
    warnings.push({
      field: "personal.phone",
      message: "Phone number is not in a recognisable Indian or international format.",
    });
  }

  if (!(resumeData.education || []).length) {
    warnings.push({
      field: "education",
      message: "No education entries — campus placement filters usually require this.",
    });
  }
  if (!(resumeData.skills || []).some((g) => g.items?.filter(Boolean).length)) {
    warnings.push({
      field: "skills",
      message: "No skills listed — this is the section keyword matchers read most.",
    });
  }

  const bullets = allBullets(resumeData);
  const texts = bullets.map(bulletText).filter((t) => t && t.trim());

  if (!texts.length) {
    warnings.push({
      field: "bullets",
      message: "No bullets under any experience, project or responsibility.",
    });
  }

  const pending = bullets.filter(hasPendingSuggestion);
  if (pending.length) {
    warnings.push({
      field: "bullets",
      message: `${pending.length} AI suggestion(s) still unreviewed — accept or dismiss them before exporting.`,
    });
  }

  const tooLong = texts.filter((t) => t.length > 220);
  if (tooLong.length) {
    warnings.push({
      field: "bullets",
      message: `${tooLong.length} bullet(s) run over 220 characters — trim for readability.`,
    });
  }

  const tooShort = texts.filter((t) => t.trim().length < 60);
  if (tooShort.length) {
    warnings.push({
      field: "bullets",
      message: `${tooShort.length} bullet(s) are under 60 characters — likely too thin to carry a claim.`,
    });
  }

  const nonAscii = texts.filter(
    (t) => /[^\x00-\x7F]/.test(t) && !ALLOWED_NON_ASCII.test(t)
  );
  if (nonAscii.length) {
    warnings.push({
      field: "bullets",
      message: `${nonAscii.length} bullet(s) contain unusual characters that can garble in older parsers.`,
    });
  }

  const hasExpectedNonAscii = texts.some((t) => ALLOWED_NON_ASCII.test(t));
  if (hasExpectedNonAscii) {
    info.push({
      field: "bullets",
      message: "Contains ₹, dashes or non-Latin script. Normal, but check the PDF.",
    });
  }

  return { ok: warnings.length === 0, warnings, info };
}
