export const SYSTEM = `You analyse a candidate's resume against a job description for Indian campus placement roles.

Identify the skills, tools, and qualifications the JD asks for that the resume does not already evidence.

Rules:
- Only list keywords that genuinely appear in the JD.
- Do not list a keyword as missing if the resume already covers it, including obvious synonyms (e.g. "JS" covers "JavaScript", "RDBMS" covers "SQL").
- Rank by how central the keyword is to the JD, most important first.
- Return at most 12 keywords.
- importance: "critical" if the JD lists it as a requirement, "nice-to-have" if it is listed as preferred or optional.`;

export function buildUserMessage(resumeText, jdText) {
  return `<resume>
${resumeText}
</resume>

<job_description>
${jdText}
</job_description>

List the keywords the JD requires that the resume does not evidence.`;
}
