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
  const cleaned = line.trim().toLowerCase().replace(/\s+/g, " ").replace(/[:.\s]+$/, "");
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

const HANDLE_PATTERNS = [
  { type: "github", base: "github.com/", pattern: /\bgithub\b\s*(?:username|id)?\s*[:\-]?\s*@?([A-Za-z0-9][A-Za-z0-9-]*)(?![.\w/])/i },
  {
    type: "linkedin",
    base: "linkedin.com/in/",
    pattern: /\blinked\s*in\b\s*(?:username|id|profile)?\s*[:\-]?\s*@?([A-Za-z0-9][A-Za-z0-9-]*)(?![.\w/])/i,
  },
];

const LOCATION_SEGMENT_RE = /^[A-Z][A-Za-z. ]{1,30}\s*,\s*[A-Z][A-Za-z. ]{1,30}$/;

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
  // Many templates print only a handle next to a label or icon name:
  // "Github @handle", "LinkedIn Username: handle".
  for (const { type, pattern, base } of HANDLE_PATTERNS) {
    const match = text.match(pattern);
    if (match && !seen.has(type)) {
      links.push({ type, url: `${base}${match[1]}` });
      seen.add(type);
    }
  }

  // The name is almost always the first non-empty line of the document,
  // as long as it isn't itself the contact-info line.
  const name = lines.find((l) => l.trim() && !EMAIL_RE.test(l) && !l.includes("@")) || "";

  // "Pune , Maharashtra | name@x.com | ..." — a "City, State" segment of the
  // contact line with no digits, "@" or link text in it.
  const location =
    lines
      .flatMap((l) => l.split("|"))
      .map(collapseSpaces)
      .find((s) => LOCATION_SEGMENT_RE.test(s) && !/linked\s*in|github/i.test(s))
      ?.replace(/\s*,\s*/g, ", ") || "";

  return { name: name.trim(), email, phone, location, links };
}

// "-" and "*" need trailing whitespace ("-5%" is not a bullet); the dedicated
// glyphs don't, since PDF extraction often drops the space ("•Built ...").
const BULLET_RE = /^(?:[-*]\s+|[•●◦▪‣]\s*)/;
const GLYPH_ONLY_RE = /^[•\-*●◦▪‣]$/;

function stripBullet(line) {
  return line.replace(BULLET_RE, "").trim();
}

// PDF extraction frequently puts a bullet glyph on its own line with the
// bullet's text on the next one; rejoin them so the glyph isn't lost.
function joinOrphanGlyphs(lines) {
  const out = [];
  for (let i = 0; i < lines.length; i++) {
    if (GLYPH_ONLY_RE.test(lines[i])) {
      let j = i + 1;
      while (j < lines.length && !lines[j]) j++;
      if (j < lines.length && !GLYPH_ONLY_RE.test(lines[j])) {
        out.push(`${lines[i]} ${lines[j]}`);
        i = j;
      }
      continue;
    }
    out.push(lines[i]);
  }
  return out;
}

// The extractor (backend/src/services/pdfImport.js) marks a right-aligned
// column — dates, a location — with a run of 3+ spaces.
const COLUMN_GAP_RE = /\s{3,}/;

function collapseSpaces(text) {
  return text.replace(/\s+/g, " ").trim();
}

function splitColumns(line) {
  const m = line.match(COLUMN_GAP_RE);
  if (!m) return { left: collapseSpaces(line), right: "" };
  return {
    left: collapseSpaces(line.slice(0, m.index)),
    right: collapseSpaces(line.slice(m.index + m[0].length)),
  };
}

// A long sentence wraps onto the next line with no marker, which looks just
// like a new entry's first line. A line is treated as a wrap only when the
// line above it was cut off mid-sentence AND either this line starts in
// lowercase or the line above ran close to the full text width (a wrap
// only happens at the margin). Missing punctuation alone isn't enough:
// "CGPA: 9.78", "Percentage: 66%" and role/date lines never end in a period,
// and treating those as unfinished merged whole sections into one entry.
// A line with a right-aligned column is a header, never a wrap.
const TINY_FRAGMENT_RE = /^[.,;:!?)\]'"-]{1,3}$/;
const SENTENCE_END_RE = /[.!?]["')\]]*$/;
const FULL_WIDTH_RATIO = 0.7;

function makeWrapTest(lines) {
  const widths = lines
    .filter((l) => l.trim() && !COLUMN_GAP_RE.test(l.trim()))
    .map((l) => collapseSpaces(stripBullet(l.trim())).length);
  const maxWidth = widths.length ? Math.max(...widths) : 0;

  return function isContinuationLine(prevLine, line) {
    if (TINY_FRAGMENT_RE.test(line)) return true;
    if (!prevLine || COLUMN_GAP_RE.test(prevLine) || COLUMN_GAP_RE.test(line)) return false;
    if (SENTENCE_END_RE.test(prevLine.trim())) return false;
    if (/^[a-z]/.test(line)) return true;
    return collapseSpaces(prevLine).length >= maxWidth * FULL_WIDTH_RATIO;
  };
}

function mergeContinuation(text, line) {
  return TINY_FRAGMENT_RE.test(line) ? text + line : `${text} ${collapseSpaces(line)}`;
}

// "Skills: Operations, Crowd Control" under a role describes that role; it
// is never the next entry's title.
const LABEL_LINE_RE = /^[A-Z][A-Za-z &/]{1,25}:\s*\S/;

// Groups a section's lines into { header, extra[] } entries: a bulleted
// line is appended to the current entry as a new bullet; a non-bulleted
// line continues whatever was just added (isWrap), attaches as a detail
// line (LABEL_LINE_RE), or starts a new entry.
function splitEntries(lines, isWrap) {
  const entries = [];
  let current = null;
  let lastLine = null;

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;

    if (BULLET_RE.test(line)) {
      const text = stripBullet(line);
      if (!current) {
        current = { header: text, extra: [] };
        entries.push(current);
      } else {
        current.extra.push(collapseSpaces(text));
      }
      lastLine = text;
      continue;
    }

    if (current && isWrap(lastLine, line)) {
      if (current.extra.length) {
        const i = current.extra.length - 1;
        current.extra[i] = mergeContinuation(current.extra[i], line);
      } else {
        current.header = mergeContinuation(current.header, line);
      }
      lastLine = line;
      continue;
    }

    if (current && LABEL_LINE_RE.test(line) && !COLUMN_GAP_RE.test(line)) {
      current.extra.push(collapseSpaces(line));
      lastLine = line;
      continue;
    }

    current = { header: line, extra: [] };
    entries.push(current);
    lastLine = line;
  }
  return entries;
}

const MONTH_NAME = "(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\\.?";
const DATE_TOKEN = `(?:${MONTH_NAME}\\s+)?(?:19|20)\\d{2}|present|current|ongoing|now`;
const DATE_RANGE_RE = new RegExp(
  `^(?:expected\\s+)?(${DATE_TOKEN})(?:\\s*(?:–|—|-|to)\\s*(${DATE_TOKEN}))?(?:\\s*[·•|(].*)?$`,
  "i"
);
const DURATION_ONLY_RE = /^(?:\d+\s*(?:years?|yrs?|months?|mos?)\s*)+$/i;

function normalizeDate(token) {
  return /^(present|current|ongoing|now)$/i.test(token) ? "Present" : token;
}

// Reads a right-hand column like "Aug 2023 – May 2027", "Expected 2027" or
// "April 2025 – Present · 5 months". A lone date is an end date when
// `singleIsEnd` (graduation), otherwise a start date.
function parseDateColumn(text, singleIsEnd) {
  const m = text.match(DATE_RANGE_RE);
  if (!m) return null;
  if (m[2]) return { startDate: normalizeDate(m[1]), endDate: normalizeDate(m[2]) };
  return singleIsEnd
    ? { startDate: "", endDate: normalizeDate(m[1]) }
    : { startDate: normalizeDate(m[1]), endDate: "" };
}

function stripBrackets(text) {
  return text.replace(/^\[(.*)\]$/, "$1");
}

// Splits an entry header into its title and right-column dates. A right
// column that isn't a date (a location) stays in the title rather than
// being dropped.
function parseEntryHeader(header) {
  const { left, right } = splitColumns(header);
  if (!right) return { title: left, startDate: "", endDate: "" };
  const dates = parseDateColumn(right, false);
  if (dates) return { title: left, ...dates };
  return { title: `${left}, ${stripBrackets(right)}`, startDate: "", endDate: "" };
}

function toBullets(extra) {
  return extra.length ? extra.map((t) => makeBullet(t)) : [makeBullet()];
}

// LinkedIn's layout (often pasted straight into a resume) lists a company
// once with its total tenure ("Aaruush, SRM University   2 years") and then
// each role under it with its own dates. A header whose right column is only
// a duration is that company line, so the roles below it inherit it.
function parseExperience(lines, isWrap) {
  const items = [];
  let company = "";
  for (const entry of splitEntries(lines, isWrap)) {
    const { left, right } = splitColumns(entry.header);
    if (right && DURATION_ONLY_RE.test(right) && !entry.extra.length) {
      company = left;
      continue;
    }
    const { title, startDate, endDate } = parseEntryHeader(entry.header);
    items.push({ id: makeId(), role: title, company, startDate, endDate, bullets: toBullets(entry.extra) });
  }
  return items;
}

// Real resumes write this both ways — "8.6 CGPA" and "CGPA: 8.6/10" — so
// the label can come before or after the number.
const CGPA_RE = /(?:cgpa\s*[:\-]?\s*(\d(?:\.\d{1,2})?)|(\d(?:\.\d{1,2})?)\s*(?:\/\s*10)?\s*cgpa)/i;
const PERCENT_RE = /(\d{1,3}(?:\.\d{1,2})?)\s*%/;

// "Percentage : 88.4" — labelled, but with no "%" sign.
const LABELLED_PERCENT_RE = /percentage\s*[:\-]?\s*(\d{1,3}(?:\.\d{1,2})?)/i;

function extractScore(text) {
  const cgpa = text.match(CGPA_RE);
  if (cgpa) return { type: "cgpa", value: parseFloat(cgpa[1] ?? cgpa[2]), outOf: 10 };
  const pct = text.match(PERCENT_RE) || text.match(LABELLED_PERCENT_RE);
  if (pct) return { type: "percentage", value: parseFloat(pct[1]) };
  return null;
}

const DEGREE_LINE_RE =
  /\b(b\.?\s?tech|b\.?\s?e|m\.?\s?tech|m\.?\s?e|bachelor|master|diploma|class\s*(?:x(?:ii)?|10|12)\b|grade\s*(?:10|12|x|xii)\b|bsc|bca|msc|mca|phd)/i;

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
function splitEducationEntries(lines, isWrap) {
  const entries = [];
  let current = null;
  let lastLine = null;
  for (const raw of lines) {
    const trimmed = raw.trim();
    if (!trimmed) continue;
    const line = stripBullet(trimmed);
    if (!line) continue;
    // A school name that carries its own degree ("Delhi Public School, Grade
    // 12, CBSE Board   March 2022") still starts a new entry.
    const startsWithInstitution = /^[^,]*\b(school|college|institute|university|academy|vidyalaya)\b/i.test(line);
    const looksLikeScoreOrDegree =
      BULLET_RE.test(trimmed) ||
      CGPA_RE.test(line) ||
      PERCENT_RE.test(line) ||
      LABELLED_PERCENT_RE.test(line) ||
      LABELED_FIELD_RE.test(line) ||
      (DEGREE_LINE_RE.test(line) && !startsWithInstitution);
    // A genuinely new field (score/degree/labeled) is its own extra entry; a
    // plain wrap of the text just above it is the SAME field split by the
    // PDF's line break, so it merges into that entry's own text instead —
    // otherwise "...Database Management" + "Systems..." (one course name,
    // split mid-phrase) would rejoin with ", " and read as two courses.
    const wraps = current && !looksLikeScoreOrDegree && isWrap(lastLine, line);
    if (looksLikeScoreOrDegree && current) {
      current.extra.push(line);
    } else if (wraps) {
      if (current.extra.length) {
        const i = current.extra.length - 1;
        current.extra[i] = mergeContinuation(current.extra[i], line);
      } else {
        current.header = mergeContinuation(current.header, line);
      }
    } else {
      current = { header: line, extra: [] };
      entries.push(current);
    }
    lastLine = line;
  }
  return entries;
}

// A bare "5/10" or "15%" is not necessarily a score — "rank 5/10 in dept."
// and "improved accuracy by 15% overall" are real degree/coursework text
// that must not be silently deleted just because a number happens to be
// shaped like one. Only strip a number when an actual score keyword sits
// next to it (either order, same as CGPA_RE below) — occasionally leaving
// a genuine score number sitting in the degree text is a visible, fixable
// imperfection; silently deleting real content is not.
const SCORE_TEXT_RE = new RegExp(
  `(?:(?:current|overall|cumulative)\\s+)?(?:cgpa|gpa|percentage)\\s*[:\\-]?\\s*\\d{1,3}(?:\\.\\d{1,2})?\\s*(?:%|\\/\\s*10(?:\\.0+)?)?` +
    `|\\d{1,3}(?:\\.\\d{1,2})?\\s*(?:%|\\/\\s*10(?:\\.0+)?)\\s*(?:cgpa|gpa|percentage)` +
    `|${CGPA_RE.source}`,
  "gi"
);
const MONTH_YEAR_RE =
  /(?:expected\s+)?\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\.?\s+\d{4}\b/gi;
// pdf-parse runs right-aligned text into the left column with no space:
// "SRM Institute of Science and TechnologyKattankulathur, TN".
const GLUED_LOCATION_RE = /^(.*[a-z)])([A-Z][A-Za-z.]+(?:\s[A-Z][A-Za-z.]+)*,\s*[A-Z][A-Za-z. ]+)$/;

function cleanFieldText(text) {
  return text.replace(/\s{2,}/g, " ").replace(/^[\s;,|–-]+|[\s;,|–-]+$/g, "");
}

// Removes the score and dates from a line instead of dropping the whole line,
// since a degree name often shares a line with them.
function stripScoreAndDates(line) {
  return cleanFieldText(line.replace(SCORE_TEXT_RE, " ").replace(MONTH_YEAR_RE, " "));
}

function extractDates(text) {
  const found = (text.match(MONTH_YEAR_RE) || []).map((d) => d.replace(/^expected\s+/i, ""));
  if (found.length >= 2) return { startDate: found[0], endDate: found[found.length - 1] };
  if (found.length === 1) return { startDate: "", endDate: found[0] };
  return { startDate: "", endDate: "" };
}

function splitGluedLocation(header) {
  const m = header.match(GLUED_LOCATION_RE);
  return m ? `${m[1]}, ${m[2]}` : header;
}

// "SRM Institute, B.Tech in Computer Science" → the institution, and the
// degree that shares its line.
function splitInstitutionAndDegree(text) {
  const parts = text.split(/\s*,\s*/);
  const i = parts.findIndex((p, idx) => idx > 0 && DEGREE_LINE_RE.test(p));
  if (i === -1) return { institution: text, degree: "" };
  return { institution: parts.slice(0, i).join(", "), degree: parts.slice(i).join(", ") };
}

function parseEducation(lines, isWrap) {
  return splitEducationEntries(lines, isWrap).map((entry) => {
    const allText = [entry.header, ...entry.extra].join(" ");
    const score = extractScore(entry.header) || extractScore(entry.extra.join(" "));

    let dates = null;
    const readColumns = (line) => {
      const { left, right } = splitColumns(line);
      if (!right) return { left, location: "" };
      const found = parseDateColumn(right, true);
      if (found) {
        dates = dates || found;
        return { left, location: "" };
      }
      return { left, location: stripBrackets(right) };
    };

    const head = readColumns(entry.header);
    const { institution, degree: headDegree } = splitInstitutionAndDegree(stripScoreAndDates(head.left));
    const institutionText = [splitGluedLocation(institution), head.location].filter(Boolean).join(", ");
    const degreeParts = [
      headDegree,
      ...entry.extra.map((l) => stripScoreAndDates(readColumns(l).left)),
    ].filter(Boolean);

    return {
      id: makeId(),
      level: "",
      institution: institutionText,
      degree: degreeParts.join(", ").replace(/\s+,/g, ","),
      branch: "",
      board: "",
      ...(dates || extractDates(allText)),
      score,
    };
  });
}

// `base` supplies every field the target form expects, defaulted to "", so
// a parsed entry is a controlled-input-ready item and not just a bag of
// whatever the extractor happened to find.
function parseWithBullets(lines, isWrap, titleField, base) {
  return splitEntries(lines, isWrap).map((entry) => {
    const { title, startDate, endDate } = parseEntryHeader(entry.header);
    return {
      ...base,
      id: makeId(),
      [titleField]: title,
      startDate,
      endDate,
      bullets: toBullets(entry.extra),
    };
  });
}

function parseCertifications(lines, isWrap) {
  return splitEntries(lines, isWrap).map((entry) => ({
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
function parseAchievements(lines, isWrap) {
  const items = [];
  let lastLine = null;

  for (const raw of lines) {
    const trimmed = raw.trim();
    if (!trimmed) continue;
    const isBulleted = BULLET_RE.test(trimmed);
    const text = stripBullet(trimmed);
    if (!text) continue;

    if (!isBulleted && items.length && isWrap(lastLine, text)) {
      const i = items.length - 1;
      items[i] = mergeContinuation(items[i], text);
    } else {
      items.push(collapseSpaces(text));
    }
    lastLine = text;
  }

  return items.map((text) => ({ id: makeId(), text }));
}

const SKILL_GROUP_LINE_RE = /^([A-Za-z][\w /&-]{1,30}):\s*(.+)$/;
const SKILL_SPLIT_RE = /[,;|·•]/;

function splitSkillItems(text) {
  return text.split(SKILL_SPLIT_RE).map(collapseSpaces).filter(Boolean);
}

// A short line with no separators ("Soft Skills") is a group label for the
// items on the lines below it; a line ending in "," wraps into whichever
// list the line above went to.
const SKILL_LABEL_ONLY_RE = /^[A-Za-z][A-Za-z &/]{1,30}$/;

function parseSkills(lines) {
  const groups = [];
  const defaultItems = [];
  let target = null;
  let prevLine = "";
  let prevWasLabel = false;
  for (const raw of lines) {
    const line = collapseSpaces(stripBullet(raw));
    if (!line) continue;
    const match = line.match(SKILL_GROUP_LINE_RE);
    if (match) {
      const items = splitSkillItems(match[2]);
      if (items.length) {
        groups.push({ id: makeId(), group: match[1].trim(), items });
        target = items;
      }
      prevWasLabel = false;
    } else if (
      SKILL_LABEL_ONLY_RE.test(line) &&
      line.split(" ").length <= 4 &&
      !prevWasLabel &&
      !/,\s*$/.test(prevLine)
    ) {
      const group = { id: makeId(), group: line, items: [] };
      groups.push(group);
      target = group.items;
      prevWasLabel = true;
    } else {
      const wraps = target && (prevWasLabel || /,\s*$/.test(prevLine));
      if (!wraps) target = defaultItems;
      target.push(...splitSkillItems(line));
      prevWasLabel = false;
    }
    prevLine = line;
  }
  // A "label" nothing followed was really a one-item skill line.
  const result = groups.filter((g) => {
    if (g.items.length) return true;
    defaultItems.push(g.group);
    return false;
  });
  if (defaultItems.length) result.push({ id: makeId(), group: "Skills", items: defaultItems });
  return result;
}

/**
 * Parses plain text already extracted from a resume PDF into a best-effort
 * resumeData draft. Never throws on odd input — worst case, everything ends
 * up in one bucket for the user to redistribute on the review screen.
 */
export function parseResumeText(rawText) {
  const allLines = joinOrphanGlyphs((rawText || "").split(/\r?\n/).map((l) => l.trim()));

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

  const isWrap = makeWrapTest(bodyLines);

  return {
    personal,
    summary: collapseSpaces(sections.summary.join(" ")),
    experience: parseExperience(sections.experience, isWrap),
    projects: parseWithBullets(sections.projects, isWrap, "title", {
      source: "import",
      link: "",
      techStack: [],
      form: emptyProjectForm(),
    }),
    education: parseEducation(sections.education, isWrap),
    skills: parseSkills(sections.skills),
    achievements: parseAchievements(sections.achievements, isWrap),
    certifications: parseCertifications(sections.certifications, isWrap),
    responsibilities: parseWithBullets(sections.responsibilities, isWrap, "role", { org: "" }),
    unmatched: unmatched.join("\n"),
  };
}
