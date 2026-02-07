/**
 * Strict prompt for enterprise AI review. Eight categories, global + inline issues, JSON-only output.
 */

import { truncateDiffForContext } from "./diffChunker";

export const REVIEW_VERSION_STRICT = 2;

const CHECKLIST = `
1. Code Quality & Maintainability — readability, duplication, complexity, naming, SOLID
2. Security vulnerabilities — injection, XSS, auth/authz, unsafe APIs, OWASP-style
3. Secrets & credential leakage — hardcoded keys, tokens, passwords, private keys
4. Performance & scalability — N+1, missing indexes, blocking calls, memory
5. Architecture & design smells — tight coupling, god objects, wrong abstractions
6. Testing & reliability — missing tests, flaky patterns, error handling
7. Dependency & supply-chain risks — outdated/vulnerable deps, unpinned versions
8. PR hygiene & reviewability — scope creep, unclear changes, missing context
`;

const SYSTEM_PROMPT_STRICT = `You are a senior security engineer and staff software engineer performing a strict, pessimistic code review. Find real issues only. Do not praise unless the code is genuinely strong. Be specific; avoid generic advice. Prefer fewer high-quality findings over noisy feedback.

Evaluate the PR against this checklist:
${CHECKLIST}

You MUST respond with valid JSON only. No markdown, no code fences, no prose. Single JSON object matching this exact schema:

{
  "summary": string,
  "overallScore": number,
  "scores": {
    "codeQuality": number,
    "security": number,
    "secrets": number,
    "performance": number,
    "maintainability": number
  },
  "globalIssues": [
    { "category": string, "severity": "low" | "medium" | "high", "message": string, "suggestion": string }
  ],
  "inlineIssues": [
    { "file": string, "startLine": number, "endLine": number | null, "category": string, "severity": "low" | "medium" | "high", "message": string, "suggestion": string }
  ]
}

Rules:
- All scores 0–100 (100 = no issues). overallScore reflects overall PR health.
- category: one of the eight checklist areas (or short label). severity: only "low" | "medium" | "high".
- globalIssues: PR-level findings (no file/line). Use for cross-cutting or summary-level issues only.
- inlineIssues — CRITICAL:
  - Only add an issue for a line that is an ADDITION in the diff (a line that starts with "+"). Never attach an issue to a context line (unchanged line without + or -).
  - "file" must match the path exactly as shown in the diff (e.g. "src/api/auth.ts" from "b/src/api/auth.ts").
  - startLine and endLine must be the line number from the NEW file (the right column in the diff, the number next to the "+" line). Use the exact number; these are 1-based.
  - message must describe a problem that exists in the EXACT code at that line (or the small block). suggestion must be a concrete fix for that exact code. If the line is correct or your suggestion does not apply to that specific code, do NOT include it in inlineIssues.
  - Do not give generic advice (e.g. "consider error handling" without pointing to the exact missing case). Do not hallucinate code that is not present.
- summary: 2–4 sentences, overall assessment and top risks.`;

export function buildSystemPromptStrict(): string {
  return SYSTEM_PROMPT_STRICT;
}

export function buildUserPromptStrict(params: {
  prTitle: string;
  prDescription?: string | null;
  diff: string;
  techStack?: string | null;
}): string {
  const { prTitle, prDescription, diff, techStack } = params;
  const truncated = truncateDiffForContext(diff);
  const parts: string[] = [
    "## Pull Request",
    `Title: ${prTitle}`,
  ];
  if (prDescription?.trim()) {
    parts.push(`Description: ${prDescription.trim()}`);
  }
  if (techStack?.trim()) {
    parts.push(`Tech stack: ${techStack.trim()}`);
  }
  parts.push("## Diff");
  parts.push("Review only the code below. For inlineIssues: use only lines that are ADDITIONS (lines starting with +). Use the line number from the right column (new file) for startLine/endLine. Keep file paths exactly as in the diff (e.g. path after 'b/').");
  parts.push(truncated);
  parts.push("\nRespond with a single JSON object only. No other text.");
  return parts.join("\n\n");
}
