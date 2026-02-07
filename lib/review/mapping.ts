/**
 * Map AI inline issues to diff lines. Filter to ADDED lines only (new-file side, + in diff)
 * so suggestions apply only to code that is actually being changed.
 */

import { getDiffAddedLineNumbers } from "@/lib/diff";
import type { InlineIssue } from "@/services/ai/schema";

export type InlineIssueForDiff = {
  file: string;
  startLine: number;
  endLine: number | null;
  category: string;
  severity: string;
  message: string;
  suggestion: string;
};

const normalizePath = (p: string) => p.trim().replace(/^\/+/, "");

function findAllowedLines(normalizedPath: string, map: Map<string, Set<number>>): Set<number> | null {
  const direct = map.get(normalizedPath);
  if (direct) return direct;
  for (const [key, lines] of map) {
    if (key === normalizedPath || key.endsWith("/" + normalizedPath)) return lines;
  }
  return null;
}

/**
 * Filter inline issues to those whose file and line range exist in the diff (new file side).
 */
export function filterInlineIssuesToDiff(
  diff: string,
  inlineIssues: InlineIssue[]
): InlineIssueForDiff[] {
  const allowedByPath = getDiffAddedLineNumbers(diff);
  const result: InlineIssueForDiff[] = [];

  for (const issue of inlineIssues) {
    const path = normalizePath(issue.file);
    const allowed = path ? allowedByPath.get(path) ?? findAllowedLines(path, allowedByPath) : null;
    if (!allowed) continue;
    const start = issue.startLine;
    const end = issue.endLine ?? start;
    const lineInRange = (line: number) => (line >= start && line <= end) || (start === line && end === start);
    const hasOverlap = Array.from(allowed).some((line) => lineInRange(line));
    if (!hasOverlap) continue;
    result.push({
      file: issue.file,
      startLine: issue.startLine,
      endLine: issue.endLine,
      category: issue.category,
      severity: issue.severity,
      message: issue.message,
      suggestion: issue.suggestion,
    });
  }
  return result;
}

/**
 * Map inline issues to flat issues for DB (CodeReviewIssue). Optional filter by diff.
 */
export function inlineIssuesToDbIssues(
  inlineIssues: InlineIssueForDiff[],
  options: { kindFromCategory?: (category: string) => string } = {}
): Array<{
  kind: string;
  category: string;
  title: string;
  description: string | null;
  severity: string;
  suggestion: string | null;
  filePath: string;
  lineStart: number;
  lineEnd: number | null;
}> {
  const kindFrom = options.kindFromCategory ?? defaultKindFromCategory;
  return inlineIssues.map((i) => ({
    kind: kindFrom(i.category),
    category: i.category,
    title: i.message.slice(0, 500),
    description: i.message || null,
    severity: i.severity,
    suggestion: i.suggestion?.slice(0, 2000) || null,
    filePath: i.file,
    lineStart: i.startLine,
    lineEnd: i.endLine,
  }));
}

function defaultKindFromCategory(category: string): string {
  const c = category.toLowerCase();
  if (c.includes("security")) return "security";
  if (c.includes("secret") || c.includes("credential")) return "secrets";
  if (c.includes("performance")) return "performance";
  return "improvement";
}
