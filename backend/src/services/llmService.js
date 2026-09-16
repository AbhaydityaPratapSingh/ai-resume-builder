import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";

import * as keywordGap from "../prompts/keywordGap.js";
import * as bulletTailor from "../prompts/bulletTailor.js";
import * as matchScore from "../prompts/matchScore.js";

// Touchpoints that rewrite user-authored content carry the fabrication risk, so
// they run on the stronger model; read-only analysis runs on the cheap one.
const STRONG_MODEL = "claude-opus-5";
const FAST_MODEL = "claude-haiku-4-5";

let client = null;

function getClient() {
  if (!client) client = new Anthropic();
  return client;
}

export function isConfigured() {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

export function resumeToPlainText(resumeData) {
  const p = resumeData.personal || {};
  const lines = [];

  if (p.name) lines.push(p.name);
  if (resumeData.summary) lines.push(`\nSUMMARY\n${resumeData.summary}`);

  const experience = (resumeData.experience || []).filter((e) => e.company || e.role);
  if (experience.length) {
    lines.push("\nEXPERIENCE");
    for (const e of experience) {
      lines.push(`${e.role || ""} at ${e.company || ""} (${e.startDate || ""} - ${e.endDate || "Present"})`);
      for (const b of e.bullets || []) if (b) lines.push(`- ${b}`);
    }
  }

  const projects = (resumeData.projects || []).filter((p) => p.title);
  if (projects.length) {
    lines.push("\nPROJECTS");
    for (const proj of projects) {
      lines.push(`${proj.title}${proj.techStack?.length ? ` [${proj.techStack.join(", ")}]` : ""}`);
      for (const b of proj.bullets || []) if (b) lines.push(`- ${b}`);
    }
  }

  const education = (resumeData.education || []).filter((e) => e.institution || e.degree);
  if (education.length) {
    lines.push("\nEDUCATION");
    for (const e of education) {
      lines.push(`${e.degree || ""}, ${e.institution || ""} ${e.score ? `(${e.score})` : ""}`);
    }
  }

  const skills = (resumeData.skills || []).filter(Boolean);
  if (skills.length) lines.push(`\nSKILLS\n${skills.join(", ")}`);

  const certs = (resumeData.certifications || []).filter((c) => c.name);
  if (certs.length) {
    lines.push("\nCERTIFICATIONS");
    for (const c of certs) lines.push(`${c.name}${c.issuer ? ` - ${c.issuer}` : ""}`);
  }

  return lines.join("\n").trim();
}

const KeywordGapSchema = z.object({
  keywords: z.array(
    z.object({
      keyword: z.string(),
      importance: z.enum(["critical", "nice-to-have"]),
      why: z.string(),
    })
  ),
});

const BulletSchema = z.object({
  bullet: z.string(),
  note: z.string(),
});

const MatchScoreSchema = z.object({
  score: z.number().min(0).max(100),
  summary: z.string(),
  strengths: z.array(z.string()),
  gaps: z.array(z.string()),
});

export async function analyzeKeywordGap(resumeData, jdText) {
  const response = await getClient().messages.parse({
    model: FAST_MODEL,
    max_tokens: 2000,
    system: keywordGap.SYSTEM,
    messages: [
      { role: "user", content: keywordGap.buildUserMessage(resumeToPlainText(resumeData), jdText) },
    ],
    output_config: { format: zodOutputFormat(KeywordGapSchema) },
  });
  return response.parsed_output;
}

export async function tailorBullet(bullet, jdText, context) {
  const response = await getClient().messages.parse({
    model: STRONG_MODEL,
    max_tokens: 2000,
    system: bulletTailor.SYSTEM,
    messages: [
      { role: "user", content: bulletTailor.buildUserMessage(bullet, jdText, context) },
    ],
    output_config: {
      effort: "medium",
      format: zodOutputFormat(BulletSchema),
    },
  });
  return response.parsed_output;
}

export async function scoreMatch(resumeData, jdText) {
  const response = await getClient().messages.parse({
    model: FAST_MODEL,
    max_tokens: 2000,
    system: matchScore.SYSTEM,
    messages: [
      { role: "user", content: matchScore.buildUserMessage(resumeToPlainText(resumeData), jdText) },
    ],
    output_config: { format: zodOutputFormat(MatchScoreSchema) },
  });
  return response.parsed_output;
}
