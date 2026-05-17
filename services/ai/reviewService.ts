/**
 * AI Review orchestrator: prompt build → LLM call → parse → normalized result.
 */

import { buildSystemPrompt, buildUserPrompt, getReviewVersion, truncateDiffForContext } from "./reviewPromptBuilder";
import { parseReviewResponse, flattenIssues } from "./reviewParser";
import { getAIClient } from "./aiClient";
import { normalizeScores } from "@/lib/review/scoring";
import type { AIReviewOutput } from "./types";
import type { TokenUsage } from "./types";

export type ReviewServiceInput = {
  prTitle: string;
  prDescription?: string | null;
  diff: string;
  techStack?: string | null;
};

export type ReviewServiceResult = {
  output: AIReviewOutput;
  normalizedScores: {
    overall: number;
    codeQuality: number;
    security: number;
    secrets: number;
  };
  issues: Array<{
    kind: "security" | "secrets" | "improvement";
    severity: string;
    title: string;
    description: string | null;
    suggestion: string | null;
    filePath: string | null;
    lineStart: number | null;
    lineEnd: number | null;
    snippet: string | null;
  }>;
  rawResponse: string;
  tokenUsage: TokenUsage | undefined;
  reviewVersion: number;
};

export type ReviewServiceError = {
  code: "CONFIG" | "PROVIDER" | "PARSE" | "TIMEOUT";
  message: string;
};

/**
 * Run the full AI review pipeline. Throws on config/provider errors; returns fallback on parse failure.
 */
export async function runReview(input: ReviewServiceInput): Promise<ReviewServiceResult> {
  const reviewVersion = getReviewVersion();
  const systemPrompt = buildSystemPrompt();
  const truncatedDiff = truncateDiffForContext(input.diff);
  const userPrompt = buildUserPrompt({
    prTitle: input.prTitle,
    prDescription: input.prDescription,
    diff: truncatedDiff,
    techStack: input.techStack,
  });

  const client = await getAIClient();
  const { content, usage } = await client.complete(systemPrompt, userPrompt, {
    model: process.env.OPENAI_REVIEW_MODEL ?? "gpt-4o-mini",
    maxTokens: 8192,
    temperature: 0.2,
  });

  const output = parseReviewResponse(content);
  if (!output) {
    throw new Error("AI returned invalid JSON. Parse failed.");
  }

  const normalizedScores = normalizeScores({
    overall: output.overallScore,
    codeQuality: output.codeQuality.score,
    security: output.security.score,
    secrets: output.secrets.score,
  });

  const issues = flattenIssues(output);

  return {
    output,
    normalizedScores,
    issues,
    rawResponse: content,
    tokenUsage: usage,
    reviewVersion,
  };
}
