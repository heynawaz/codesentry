/**
 * Normalize and compare severity for review issues.
 */

export type SeverityLevel = "low" | "medium" | "high" | "critical";

const ORDER: Record<SeverityLevel, number> = {
  low: 0,
  medium: 1,
  high: 2,
  critical: 3,
};

const NORMALIZED: Record<string, SeverityLevel> = {
  low: "low",
  medium: "medium",
  high: "high",
  critical: "critical",
  // common variants
  info: "low",
  minor: "low",
  major: "medium",
  error: "high",
  warning: "medium",
};

export function normalizeSeverity(severity: string | null | undefined): SeverityLevel | null {
  if (severity == null || severity === "") return null;
  const key = severity.toLowerCase().trim();
  return NORMALIZED[key] ?? "medium";
}

export function compareSeverity(a: SeverityLevel | null, b: SeverityLevel | null): number {
  const oa = a != null ? ORDER[a] : -1;
  const ob = b != null ? ORDER[b] : -1;
  return ob - oa; // higher severity first
}

export function isAtLeast(severity: SeverityLevel | null, min: SeverityLevel): boolean {
  if (severity == null) return false;
  return ORDER[severity] >= ORDER[min];
}
