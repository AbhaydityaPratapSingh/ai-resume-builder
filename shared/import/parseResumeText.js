import { makeBullet, makeId, emptyProjectForm } from "../data/emptyResume.js";

// This is the rule-based half of PDF import (ARCHITECTURE.md section 6.1).
// It never touches a network or a file — it takes the plain text a PDF
// extractor already pulled out and turns it into a best-effort resumeData
// draft. Nothing here is ever saved directly: the caller shows it on a
// review screen first, so a wrong guess costs an edit, not silent data loss.
//
// PDF text extraction rarely preserves layout. Two things are unreliable by
// nature, not by a bug here: an entry's header line (title/company/dates
// squashed together with no separator when the source used a flex layout),
// and entry boundaries in resumes whose bullets carry no leading glyph. Both
// degrade to "put the raw line where a human will see and can fix it",
// never to guessing a value that looks structured but might be wrong.

const HEADINGS = {
  summary: ["summary", "objective", "profile", "about me", "career objective"],
  experience: ["experience", "work experience", "professional experience", "employment", "internships"],
  projects: ["projects", "personal projects", "academic projects"],
  education: ["education", "academic background", "academics"],
  skills: ["skills", "technical skills", "skills & tools", "skills and tools"],
  achievements: ["achievements", "awards", "accomplishments", "honors", "honours"],
  certifications: ["certifications", "certificates", "licenses & certifications"],
  responsibilities: [
    "positions of responsibility",
    "position of responsibility",
    "responsibilities",
    "leadership",
    "extracurricular activities",
    "extra-curricular activities",
  ],
};

const HEADING_LOOKUP = new Map();
for (const [key, names] of Object.entries(HEADINGS)) {
  for (const name of names) HEADING_LOOKUP.set(name, key);
}

function classifyHeading(line) {
  const cleaned = line.trim().toLowerCase().replace(/[:.\s]+$/, "");
  if (!cleaned || cleaned.length > 40) return null;
  return HEADING_LOOKUP.get(cleaned) || null;
}

const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
const PHONE_RE = /(\+?\d[\d\s-]{8,14}\d)/;

const LINK_DOMAINS = [
  { type: "github", pattern: /github\.com\/[\w.-]+/i },
  { type: "linkedin", pattern: /linkedin\.com\/in\/[\w-]+/i },
  { type: "leetcode", pattern: /leetcode\.com\/[\w/-]+/i },
  { type: "codechef", pattern: /codechef\.com\/[\w/-]+/i },
  { type: "codeforces", pattern: /codeforces\.com\/[\w/-]+/i },
  { type: "portfolio", pattern: /\b[\w-]+\.(?:dev|me|xyz|vercel\.app|netlify\.app|github\.io)\b[\w/.-]*/i },
];

function extractContact(lines) {
  const text = lines.join(" ");
  const email = text.match(EMAIL_RE)?.[0] || "";
  const phone = text.match(PHONE_RE)?.[0]?.trim() || "";

  const links = [];
  const seen = new Set();
  for (const { type, pattern } of LINK_DOMAINS) {
    const match = text.match(pattern);
    if (match && !seen.has(type)) {
      links.push({ type, url: match[0] });
      seen.add(type);
    }
  }

  // The name is almost always the first non-empty line of the document,
  // as long as it isn't itself the contact-info line.
  const name = lines.find((l) => l.trim() && !EMAIL_RE.test(l) && !l.includes("@")) || "";

  return { name: name.trim(), email, phone, links };
}

const BULLET_RE = /^[•\-*●◦▪‣]\s+/;

function stripBullet(line) {
  return line.replace(BULLET_RE, "").trim();
}

// A PDF-extracted bullet whose sentence is too long for one line wraps
// across two lines with no marker at all on the continuation — the same
// "no glyph" shape as a brand-new entry's header, which used to make every
// wrapped continuation line look like its own fake entry (a 2-3 project
// resume coming back as dozens of fragments). A non-bulleted line very
// likely continues whatever text came before it, rather than starting a
// new entry, when either that previous text was cut off mid-sentence (no
// sentence-ending punctuation), or the new line is nothing but a stray
// punctuation fragment left over from the wrap (a lone ".").
//
// This can't be perfect — a real one-line bullet that just happens to
// carry no trailing period looks identical to a wrapped fragment — but a
// wrapped continuation is by far the more common real-world case, and a
// merged-too-eagerly entry is still visible and editable on the review
// screen, same as every other best-effort guess in this file.
const TINY_FRAGMENT_RE = /^[.,;:!?)\]'"-]{1,3}$/;
const SENTENCE_END_RE = /[.!?]["')\]]*$/;

function isContinuationLine(prevText, line) {
  if (TINY_FRAGMENT_RE.test(line)) return true;
  return Boolean(prevText) && !SENTENCE_END_RE.test(prevText.trim());
}

function mergeContinuation(text, line) {
  return TINY_FRAGMENT_RE.test(line) ? text + line : `${text} ${line}`;
}

// Groups a section's lines into { header, extra[] } entries: a bulleted
// line is appended to the current entry as a new bullet; a non-bulleted
// line either continues whatever was just added (see isContinuationLine)
// or starts a new entry. Resumes whose bullets carry no glyph at all (some
// browser-rendered PDFs) degrade toward merging everything into fewer,
// run-on entries — still visible and editable on the review screen, never
// silently dropped.
function splitEntries(lines) {
  const entries = [];
  let current = null;
  let lastText = null;

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;

    if (BULLET_RE.test(line)) {
      const text = stripBullet(line);
      if (!current) {
        current = { header: text, extra: [] };
        entries.push(current);
      } else {
        current.extra.push(text);
      }
      lastText = text;
      continue;
    }

    if (current && isContinuationLine(lastText, line)) {
      if (current.extra.length) {
        const i = current.extra.length - 1;
        current.extra[i] = mergeContinuation(current.extra[i], line);
        lastText = current.extra[i];
      } else {
        current.header = mergeContinuation(current.header, line);
        lastText = current.header;
      }
      continue;
    }

    current = { header: line, extra: [] };
    entries.push(current);
    lastText = line;
  }
  return entries;
}

// Real resumes write this both ways — "8.6 CGPA" and "CGPA: 8.6/10" — so
// the label can come before or after the number.
const CGPA_RE = /(?:cgpa\s*[:\-]?\s*(\d(?:\.\d{1,2})?)|(\d(?:\.\d{1,2})?)\s*(?:\/\s*10)?\s*cgpa)/i;
const PERCENT_RE = /(\d{1,3}(?:\.\d{1,2})?)\s*%/;

function extractScore(text) {
  const cgpa = text.match(CGPA_RE);
  if (cgpa) return { type: "cgpa", value: parseFloat(cgpa[1] ?? cgpa[2]), outOf: 10 };
  const pct = text.match(PERCENT_RE);
  if (pct) return { type: "percentage", value: parseFloat(pct[1]) };
  return null;
}

const DEGREE_LINE_RE = /\b(b\.?\s?tech|b\.?\s?e|m\.?\s?tech|m\.?\s?e|bachelor|master|diploma|class\s*x(?:ii)?|bsc|bca|msc|mca|phd)\b/i;

// "Relevant Coursework: X, Y, Z" is a labeled sub-field of the institution
// above it, not a new one — but isContinuationLine alone won't catch it: the
// line right before it (a CGPA line, "CGPA 8.35/10.") is a complete
// sentence by that heuristic's own definition, so without this, a properly
// terminated score line was enough to make the next real field misread as a
// brand-new institution.
const LABELED_FIELD_RE = /^(relevant\s+)?course\s*work\s*:/i;

// Education entries rarely use a bullet glyph for the degree/score line
// under an institution — "VIT Pune" / "CGPA: 8.6/10" is a very common
// two-line shape with nothing marking the second line as a continuation.
// So here, unlike other sections, a line continues the current entry when
// it looks like a score, a degree name or a labeled field, OR when it looks
// like a wrapped continuation of the line above it (isContinuationLine,
// same rationale as splitEntries above); anything else starts a new entry
// (almost always the next institution).
function splitEducationEntries(lines) {
  const entries = [];
  let current = null;
  let lastText = null;
  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;
    const looksLikeScoreOrDegree =
      CGPA_RE.test(line) || PERCENT_RE.test(line) || DEGREE_LINE_RE.test(line) || LABELED_FIELD_RE.test(line);
    // A genuinely new field (score/degree/labeled) is its own extra entry; a
    // plain wrap of the text just above it is the SAME field split by the
    // PDF's line break, so it merges into that entry's own text instead —
    // otherwise "...Database Management" + "Systems..." (one course name,
    // split mid-phrase) would rejoin with ", " and read as two courses.
    const isWrap = current && !looksLikeScoreOrDegree && isContinuationLine(lastText, line);
    if (looksLikeScoreOrDegree && current) {
      current.extra.push(line);
      lastText = line;
    } else if (isWrap) {
      if (current.extra.length) {
        const i = current.extra.length - 1;
        current.extra[i] = mergeContinuation(current.extra[i], line);
        lastText = current.extra[i];
      } else {
        current.header = mergeContinuation(current.header, line);
        lastText = current.header;
      }
    } else {
      current = { header: line, extra: [] };
      entries.push(current);
      lastText = line;
    }
  }
  return entries;
}

function parseEducation(lines) {
  return splitEducationEntries(lines).map((entry) => {
    const extraText = entry.extra.join(" ");
    const score = extractScore(entry.header) || extractScore(extraText);
    const leftover = entry.extra.filter((l) => !CGPA_RE.test(l) && !PERCENT_RE.test(l)).join(", ");
    return {
      id: makeId(),
      level: "",
      institution: entry.header,
      degree: leftover,
      branch: "",
      board: "",
      startDate: "",
      endDate: "",
      score,
    };
  });
}

// `base` supplies every field the target form expects, defaulted to "", so
// a parsed entry is a controlled-input-ready item and not just a bag of
// whatever the extractor happened to find.
function parseWithBullets(lines, titleField, base) {
  return splitEntries(lines).map((entry) => ({
    ...base,
    id: makeId(),
    [titleField]: entry.header,
    bullets: entry.extra.length ? entry.extra.map((t) => makeBullet(t)) : [makeBullet()],
  }));
}

function parseCertifications(lines) {
  return splitEntries(lines).map((entry) => ({
    id: makeId(),
    name: entry.header,
    issuer: entry.extra.join(", "),
    date: "",
  }));
}

// A bulleted line always starts a new achievement (that's what the glyph
// marks); a non-bulleted line either continues a wrapped achievement above
// it or, on the first line of the section, starts one — same
// isContinuationLine heuristic as splitEntries, applied here because this
// section previously had no merging logic at all: every line, wrapped or
// not, became its own fake achievement.
function parseAchievements(lines) {
  const items = [];
  let lastText = null;

  for (const raw of lines) {
    const trimmed = raw.trim();
    if (!trimmed) continue;
    const isBulleted = BULLET_RE.test(trimmed);
    const text = stripBullet(trimmed);
    if (!text) continue;

    if (!isBulleted && items.length && isContinuationLine(lastText, text)) {
      const i = items.length - 1;
      items[i] = mergeContinuation(items[i], text);
      lastText = items[i];
    } else {
      items.push(text);
      lastText = text;
    }
  }

  return items.map((text) => ({ id: makeId(), text }));
}

const SKILL_GROUP_LINE_RE = /^([A-Za-z][\w /&-]{1,30}):\s*(.+)$/;
const SKILL_SPLIT_RE = /[,;|·•]/;

function parseSkills(lines) {
  const groups = [];
  const defaultItems = [];
  for (const raw of lines) {
    const line = stripBullet(raw);
    if (!line) continue;
    const match = line.match(SKILL_GROUP_LINE_RE);
    if (match) {
      const items = match[2].split(SKILL_SPLIT_RE).map((s) => s.trim()).filter(Boolean);
      if (items.length) groups.push({ id: makeId(), group: match[1].trim(), items });
    } else {
      defaultItems.push(...line.split(SKILL_SPLIT_RE).map((s) => s.trim()).filter(Boolean));
    }
  }
  if (defaultItems.length) groups.push({ id: makeId(), group: "Skills", items: defaultItems });
  return groups;
}

/**
 * Parses plain text already extracted from a resume PDF into a best-effort
 * resumeData draft. Never throws on odd input — worst case, everything ends
 * up in one bucket for the user to redistribute on the review screen.
 */
export function parseResumeText(rawText) {
  const allLines = (rawText || "").split(/\r?\n/).map((l) => l.trim());

  const firstHeadingIndex = allLines.findIndex((l) => classifyHeading(l));
  const headerLines = firstHeadingIndex === -1 ? allLines : allLines.slice(0, firstHeadingIndex);
  const bodyLines = firstHeadingIndex === -1 ? [] : allLines.slice(firstHeadingIndex);

  const personal = extractContact(headerLines.filter(Boolean));

  const sections = {
    summary: [],
    experience: [],
    projects: [],
    education: [],
    skills: [],
    achievements: [],
    certifications: [],
    responsibilities: [],
  };
  const unmatched = [];

  let current = null;
  for (const line of bodyLines) {
    const heading = classifyHeading(line);
    if (heading) {
      current = heading;
      continue;
    }
    if (!line.trim()) continue;
    (current ? sections[current] : unmatched).push(line);
  }

  return {
    personal,
    summary: sections.summary.join(" "),
    experience: parseWithBullets(sections.experience, "role", {
      company: "",
      startDate: "",
      endDate: "",
    }),
    projects: parseWithBullets(sections.projects, "title", {
      source: "import",
      link: "",
      startDate: "",
      endDate: "",
      techStack: [],
      form: emptyProjectForm(),
    }),
    education: parseEducation(sections.education),
    skills: parseSkills(sections.skills),
    achievements: parseAchievements(sections.achievements),
    certifications: parseCertifications(sections.certifications),
    responsibilities: parseWithBullets(sections.responsibilities, "role", {
      org: "",
      startDate: "",
      endDate: "",
    }),
    unmatched: unmatched.join("\n"),
  };
}
