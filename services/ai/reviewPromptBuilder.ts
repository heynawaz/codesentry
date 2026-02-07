/**
 * Build system and user prompts for the AI code review.
 * Strict, pessimistic, senior security + software reviewer persona.
 */

const REVIEW_VERSION = 1;

export function getReviewVersion(): number {
  return REVIEW_VERSION;
}

const SYSTEM_PROMPT = `You are a senior security engineer and staff software engineer performing a strict, pessimistic code review. Your job is to find real issues—not to praise. Be concise and factual.

You MUST respond with valid JSON only. No markdown, no code fences, no prose before or after. The response must parse as a single JSON object matching this exact schema:

{
  "overallScore": number,
  "codeQuality": { "score": number, "issues": [ { "file": string, "line": number | null, "severity": "low" | "medium" | "high", "message": string, "suggestion": string } ] },
  "security": { "score": number, "issues": [ same structure ] },
  "secrets": { "score": number, "issues": [ same structure ] },
  "summary": string
}

Rules:
- overallScore, and each category score, are 0–100 (100 = no issues).
- CRITICAL: Only report issues on code that appears in the diff. Each issue's "file" and "line" MUST refer to a file and line number that are present in the provided diff (i.e. lines that are being added, removed, or shown as context). Do not report on code that is not part of this diff. This review is only for the changed code that will be merged.
- For each category, list concrete issues. Use "file" as the path exactly as it appears in the diff (e.g. "src/api/auth.ts"), "line" as the line number in the diff (new file line for additions/context, or the line in the diff for deletions).
- severity is only "low" | "medium" | "high".
- message: what is wrong. suggestion: one clear actionable fix.
- summary: 2–4 sentences on overall assessment and top risks for the changed code only.
- Prefer false positives over missing real vulnerabilities. Flag: injection risks, auth bugs, hardcoded secrets, unsafe APIs, anti-patterns, and maintainability problems.`;

export function buildSystemPrompt(): string {
  return SYSTEM_PROMPT;
}

export function buildUserPrompt(params: {
  prTitle: string;
  prDescription?: string | null;
  diff: string;
  techStack?: string | null;
}): string {
  const { prTitle, prDescription, diff, techStack } = params;
  const parts: string[] = [
    `## Pull Request`,
    `Title: ${prTitle}`,
  ];
  if (prDescription?.trim()) {
    parts.push(`Description: ${prDescription.trim()}`);
  }
  if (techStack?.trim()) {
    parts.push(`Tech stack (if relevant): ${techStack.trim()}`);
  }
  parts.push("## Diff (review ONLY the code below — do not report issues on lines not in this diff)");
  parts.push(diff);
  parts.push("\nRespond with a single JSON object only. No other text. Only include issues for lines that appear in the diff above.");
  return parts.join("\n\n");
}

/**
 * Chunk a large diff for context window. Returns full diff if under maxChars; otherwise truncated with a note.
 * TODO: Multi-chunk summarization then final analysis for very large PRs.
 */
export function truncateDiffForContext(diff: string, maxChars: number = 90_000): string {
  const trimmed = diff.trim();
  if (trimmed.length <= maxChars) return trimmed;
  const head = trimmed.slice(0, maxChars);
  return `${head}\n\n... [DIFF TRUNCATED: ${trimmed.length - maxChars} chars omitted. Review the visible changes.]`;
}
