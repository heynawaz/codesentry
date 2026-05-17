/**
 * Aggregate statistics from review issues.
 */

import type { SeverityLevel } from "./severity";
import { normalizeSeverity } from "./severity";

export type IssueForStats = {
  kind: string;
  severity?: string | null;
  filePath?: string | null;
};

export function countByKind(issues: IssueForStats[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const i of issues) {
    const k = i.kind ?? "other";
    out[k] = (out[k] ?? 0) + 1;
  }
  return out;
}

export function countBySeverity(issues: IssueForStats[]): Record<SeverityLevel, number> {
  const out: Record<string, number> = {
    low: 0,
    medium: 0,
    high: 0,
    critical: 0,
  };
  for (const i of issues) {
    const s = normalizeSeverity(i.severity);
    if (s) out[s]++;
    else out.medium++;
  }
  return out as Record<SeverityLevel, number>;
}

export function uniqueFiles(issues: IssueForStats[]): string[] {
  const set = new Set<string>();
  for (const i of issues) {
    if (i.filePath?.trim()) set.add(i.filePath.trim());
  }
  return Array.from(set);
}
