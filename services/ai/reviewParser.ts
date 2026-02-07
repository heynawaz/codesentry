/**
 * Parse and validate AI review JSON. Fallback on parse failure.
 */

import type { AIReviewOutput, ReviewIssueItem, ReviewIssueSeverity } from "./types";
import { normalizeScores, computeOverallScore } from "@/lib/review/scoring";
import { normalizeSeverity } from "@/lib/review/severity";

const SEVERITIES: ReviewIssueSeverity[] = ["low", "medium", "high"];

function isSeverity(s: unknown): s is ReviewIssueSeverity {
  return typeof s === "string" && SEVERITIES.includes(s as ReviewIssueSeverity);
}

function parseIssue(raw: unknown): ReviewIssueItem | null {
  if (raw == null || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const file = typeof o.file === "string" ? o.file : "";
  const line = typeof o.line === "number" && !Number.isNaN(o.line) ? o.line : null;
  const severity = isSeverity(o.severity) ? o.severity : "medium";
  const message = typeof o.message === "string" ? o.message : "";
  const suggestion = typeof o.suggestion === "string" ? o.suggestion : "";
  if (!message) return null;
  return { file, line, severity, message, suggestion };
}

function parseCategory(raw: unknown): { score: number; issues: ReviewIssueItem[] } {
  if (raw == null || typeof raw !== "object") {
    return { score: 0, issues: [] };
  }
  const o = raw as Record<string, unknown>;
  let score = 0;
  if (typeof o.score === "number" && !Number.isNaN(o.score)) {
    score = Math.max(0, Math.min(100, Math.round(o.score)));
  }
  const issues: ReviewIssueItem[] = [];
  if (Array.isArray(o.issues)) {
    for (const item of o.issues) {
      const parsed = parseIssue(item);
      if (parsed) issues.push(parsed);
    }
  }
  return { score, issues };
}

/**
 * Parse raw AI response into typed AIReviewOutput. Returns null if invalid.
 */
export function parseReviewResponse(raw: string): AIReviewOutput | null {
  let parsed: unknown;
  try {
    const trimmed = raw.trim();
    // Strip optional markdown code block
    const jsonStr = trimmed.startsWith("```")
      ? trimmed.replace(/^```(?:json)?\s*/, "").replace(/\s*```$/, "").trim()
      : trimmed;
    parsed = JSON.parse(jsonStr) as unknown;
  } catch {
    return null;
  }
  if (parsed == null || typeof parsed !== "object") return null;
  const o = parsed as Record<string, unknown>;

  const overallScore =
    typeof o.overallScore === "number" && !Number.isNaN(o.overallScore)
      ? Math.max(0, Math.min(100, Math.round(o.overallScore)))
      : 0;

  const codeQuality = parseCategory(o.codeQuality);
  const security = parseCategory(o.security);
  const secrets = parseCategory(o.secrets);

  let resolvedOverall = overallScore;
  if (overallScore === 0 && (codeQuality.score > 0 || security.score > 0 || secrets.score > 0)) {
    resolvedOverall = computeOverallScore({
      codeQuality: codeQuality.score,
      security: security.score,
      secrets: secrets.score,
    });
  }

  const summary = typeof o.summary === "string" ? o.summary : "";

  return {
    overallScore: resolvedOverall,
    codeQuality,
    security,
    secrets,
    summary,
  };
}

/**
 * Map AI output to flat issues with kind for DB persistence.
 */
export type NormalizedIssue = {
  kind: "security" | "secrets" | "improvement";
  severity: string;
  title: string;
  description: string | null;
  suggestion: string | null;
  filePath: string | null;
  lineStart: number | null;
  lineEnd: number | null;
  snippet: string | null;
};

export function flattenIssues(output: AIReviewOutput): NormalizedIssue[] {
  const result: NormalizedIssue[] = [];

  for (const issue of output.codeQuality.issues) {
    const severity = normalizeSeverity(issue.severity) ?? "medium";
    result.push({
      kind: "improvement",
      severity,
      title: issue.message.slice(0, 500),
      description: issue.message || null,
      suggestion: issue.suggestion?.slice(0, 1000) || null,
      filePath: issue.file?.trim() || null,
      lineStart: issue.line ?? null,
      lineEnd: issue.line ?? null,
      snippet: null,
    });
  }

  for (const issue of output.security.issues) {
    const severity = normalizeSeverity(issue.severity) ?? "high";
    result.push({
      kind: "security",
      severity,
      title: issue.message.slice(0, 500),
      description: issue.message || null,
      suggestion: issue.suggestion?.slice(0, 1000) || null,
      filePath: issue.file?.trim() || null,
      lineStart: issue.line ?? null,
      lineEnd: issue.line ?? null,
      snippet: null,
    });
  }

  for (const issue of output.secrets.issues) {
    const severity = normalizeSeverity(issue.severity) ?? "high";
    result.push({
      kind: "secrets",
      severity,
      title: issue.message.slice(0, 500),
      description: issue.message || null,
      suggestion: issue.suggestion?.slice(0, 1000) || null,
      filePath: issue.file?.trim() || null,
      lineStart: issue.line ?? null,
      lineEnd: issue.line ?? null,
      snippet: null,
    });
  }

  return result;
}
