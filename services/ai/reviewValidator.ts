/**
 * JSON schema validation for AI review response. Ensures strict shape for persistence.
 */

import type { AIReviewOutputStrict, GlobalIssue, InlineIssue, ReviewScores } from "./schema";

const SEVERITIES = ["low", "medium", "high"] as const;

function isSeverity(s: unknown): s is "low" | "medium" | "high" {
  return typeof s === "string" && SEVERITIES.includes(s as (typeof SEVERITIES)[number]);
}

function clampScore(n: unknown): number {
  if (typeof n !== "number" || Number.isNaN(n)) return 0;
  return Math.max(0, Math.min(100, Math.round(n)));
}

function parseScores(raw: unknown): ReviewScores {
  if (raw == null || typeof raw !== "object") {
    return {
      codeQuality: 0,
      security: 0,
      secrets: 0,
      performance: 0,
      maintainability: 0,
    };
  }
  const o = raw as Record<string, unknown>;
  return {
    codeQuality: clampScore(o.codeQuality),
    security: clampScore(o.security),
    secrets: clampScore(o.secrets),
    performance: clampScore(o.performance),
    maintainability: clampScore(o.maintainability),
  };
}

function parseGlobalIssue(raw: unknown): GlobalIssue | null {
  if (raw == null || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const message = typeof o.message === "string" ? o.message : "";
  if (!message) return null;
  return {
    category: typeof o.category === "string" ? o.category : "General",
    severity: isSeverity(o.severity) ? o.severity : "medium",
    message,
    suggestion: typeof o.suggestion === "string" ? o.suggestion : "",
  };
}

function parseInlineIssue(raw: unknown): InlineIssue | null {
  if (raw == null || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const file = typeof o.file === "string" ? o.file : "";
  const startLine = typeof o.startLine === "number" && !Number.isNaN(o.startLine) ? o.startLine : 0;
  if (startLine < 1) return null; // Diff line numbers are 1-based
  const message = typeof o.message === "string" ? o.message : "";
  if (!message) return null;
  const endLine =
    o.endLine != null && typeof o.endLine === "number" && !Number.isNaN(o.endLine) ? o.endLine : null;
  const snippet = o.snippet != null && typeof o.snippet === "string" ? o.snippet : null;
  const fixedCode = o.fixedCode != null && typeof o.fixedCode === "string" ? o.fixedCode : null;
  return {
    file,
    startLine,
    endLine: endLine != null && endLine >= startLine ? endLine : null,
    category: typeof o.category === "string" ? o.category : "General",
    severity: isSeverity(o.severity) ? o.severity : "medium",
    snippet: snippet ?? undefined,
    message,
    suggestion: typeof o.suggestion === "string" ? o.suggestion : "",
    fixedCode: fixedCode ?? undefined,
  };
}

/**
 * Validate and parse raw AI response into AIReviewOutputStrict. Returns null if invalid.
 */
export function validateReviewResponse(raw: string): AIReviewOutputStrict | null {
  let parsed: unknown;
  try {
    const trimmed = raw.trim();
    const jsonStr = trimmed.startsWith("```")
      ? trimmed.replace(/^```(?:json)?\s*/, "").replace(/\s*```$/, "").trim()
      : trimmed;
    parsed = JSON.parse(jsonStr) as unknown;
  } catch {
    return null;
  }
  if (parsed == null || typeof parsed !== "object") return null;
  const o = parsed as Record<string, unknown>;

  const overallScore = clampScore(o.overallScore);
  const scores = parseScores(o.scores);
  const summary = typeof o.summary === "string" ? o.summary : "";

  const globalIssues: GlobalIssue[] = [];
  if (Array.isArray(o.globalIssues)) {
    for (const item of o.globalIssues) {
      const issue = parseGlobalIssue(item);
      if (issue) globalIssues.push(issue);
    }
  }

  const inlineIssues: InlineIssue[] = [];
  if (Array.isArray(o.inlineIssues)) {
    for (const item of o.inlineIssues) {
      const issue = parseInlineIssue(item);
      if (issue) inlineIssues.push(issue);
    }
  }

  return {
    summary,
    overallScore,
    scores,
    globalIssues,
    inlineIssues,
  };
}
