export const SYSTEM = `You score how well a candidate's resume matches a job description, for Indian campus placement roles (analyst, SDE, trainee).

Scoring guidance:
- 0-40: missing most core requirements
- 41-70: covers some core requirements, notable gaps
- 71-85: covers core requirements, minor gaps
- 86-100: strong match across requirements

Judge only on what the resume actually evidences. Do not give credit for skills the candidate might plausibly have.

\`summary\` is one or two sentences addressed to the candidate, plain and specific.
\`strengths\` and \`gaps\` are short phrases, at most 4 each.`;

export function buildUserMessage(resumeText, jdText) {
  return `<resume>
${resumeText}
</resume>

<job_description>
${jdText}
</job_description>

Score this resume against the JD.`;
}
