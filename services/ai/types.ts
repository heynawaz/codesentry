/**
 * Strict AI review output schema. The model MUST return valid JSON only.
 */

export type ReviewIssueSeverity = "low" | "medium" | "high";

export type ReviewIssueItem = {
  file: string;
  line: number | null;
  severity: ReviewIssueSeverity;
  message: string;
  suggestion: string;
};

export type ReviewCategory = {
  score: number;
  issues: ReviewIssueItem[];
};

export type AIReviewOutput = {
  overallScore: number;
  codeQuality: ReviewCategory;
  security: ReviewCategory;
  secrets: ReviewCategory;
  summary: string;
};

export type TokenUsage = {
  prompt?: number;
  completion?: number;
  total?: number;
};

export type AIClientOptions = {
  model?: string;
  maxTokens?: number;
  temperature?: number;
};

export type AIClientResponse = {
  content: string;
  usage?: TokenUsage;
};

export type IAIClient = {
  complete(systemPrompt: string, userPrompt: string, options?: AIClientOptions): Promise<AIClientResponse>;
};
