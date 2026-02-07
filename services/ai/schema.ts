/**
 * Strict AI review output schema (enterprise). Model MUST return valid JSON only.
 * Categories: Code Quality & Maintainability, Security, Secrets, Performance,
 * Architecture & design, Testing, Dependency/supply-chain, PR hygiene.
 */

export type ReviewSeverity = "low" | "medium" | "high";

export type GlobalIssue = {
  category: string;
  severity: ReviewSeverity;
  message: string;
  suggestion: string;
};

export type InlineIssue = {
  file: string;
  startLine: number;
  endLine: number | null;
  category: string;
  severity: ReviewSeverity;
  message: string;
  suggestion: string;
};

export type ReviewScores = {
  codeQuality: number;
  security: number;
  secrets: number;
  performance: number;
  maintainability: number;
};

export type AIReviewOutputStrict = {
  summary: string;
  overallScore: number;
  scores: ReviewScores;
  globalIssues: GlobalIssue[];
  inlineIssues: InlineIssue[];
};
