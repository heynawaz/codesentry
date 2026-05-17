/**
 * Create and persist AI code review. Uses enterprise strict review pipeline.
 * Filters inline issues to lines present in the PR diff.
 */

import { prisma } from "@/lib/db/client";
import { runReviewStrict } from "@/services/ai/reviewRunner";
import { filterInlineIssuesToDiff, inlineIssuesToDbIssues } from "@/lib/review/mapping";
import { normalizeFiveScores, computeOverallScoreFromFive } from "@/lib/review/scoring";

export type CreateReviewInput = {
  pullRequestId: string;
  diff: string;
  prTitle: string;
  prDescription?: string | null;
  techStack?: string | null;
};

export type CreateReviewResult = {
  id: string;
  status: "pending" | "completed" | "failed";
  qualityScore: number;
  codeQualityScore: number | null;
  securityScore: number | null;
  secretsScore: number | null;
  performanceScore: number | null;
  maintainabilityScore: number | null;
  summary: string | null;
  executionTimeMs: number | null;
};

/**
 * Run AI review (strict schema) and persist. Throws on AI/config failure.
 */
export async function createReview(input: CreateReviewInput): Promise<CreateReviewResult> {
  const start = Date.now();

  const result = await runReviewStrict({
    prTitle: input.prTitle,
    prDescription: input.prDescription,
    diff: input.diff,
    techStack: input.techStack,
  });

  const executionTimeMs = Date.now() - start;
  const { output } = result;
  const scores = normalizeFiveScores(output.scores);
  const overall = output.overallScore > 0 ? output.overallScore : computeOverallScoreFromFive(scores);

  const inlineFiltered = filterInlineIssuesToDiff(input.diff, output.inlineIssues);
  const inlineDb = inlineIssuesToDbIssues(inlineFiltered);

  const issuesCreate = [
    ...output.globalIssues.map((g) => ({
      kind: "global" as const,
      category: g.category,
      title: g.message.slice(0, 500),
      description: g.message || null,
      severity: g.severity,
      suggestion: g.suggestion?.slice(0, 2000) || null,
      filePath: null as string | null,
      lineStart: null as number | null,
      lineEnd: null as number | null,
      snippet: null as string | null,
      fixedCode: null as string | null,
    })),
    ...inlineDb.map((i) => ({
      kind: i.kind,
      category: i.category,
      title: i.title,
      description: i.description,
      severity: i.severity,
      suggestion: i.suggestion,
      filePath: i.filePath,
      lineStart: i.lineStart,
      lineEnd: i.lineEnd,
      snippet: i.snippet ?? null,
      fixedCode: i.fixedCode ?? null,
    })),
  ];

  const codeReview = await prisma.codeReview.create({
    data: {
      pullRequestId: input.pullRequestId,
      status: "completed",
      qualityScore: overall,
      codeQualityScore: scores.codeQuality,
      securityScore: scores.security,
      secretsScore: scores.secrets,
      performanceScore: scores.performance,
      maintainabilityScore: scores.maintainability,
      summary: output.summary || null,
      scoreBreakdown: output.scores as object,
      globalIssues: output.globalIssues as object,
      inlineIssues: output.inlineIssues as object,
      rawResponse: result.rawResponse,
      reviewVersion: result.reviewVersion,
      aiModel: result.model,
      executionTimeMs,
      tokenUsage: result.tokenUsage ? (result.tokenUsage as object) : undefined,
      issues: { create: issuesCreate },
    },
    include: { issues: true },
  });

  return {
    id: codeReview.id,
    status: codeReview.status,
    qualityScore: codeReview.qualityScore,
    codeQualityScore: codeReview.codeQualityScore,
    securityScore: codeReview.securityScore,
    secretsScore: codeReview.secretsScore,
    performanceScore: codeReview.performanceScore ?? null,
    maintainabilityScore: codeReview.maintainabilityScore ?? null,
    summary: codeReview.summary,
    executionTimeMs: codeReview.executionTimeMs,
  };
}

/**
 * Create a pending review record. Caller runs AI in background and updates to completed/failed.
 * TODO: GitHub inline PR comments; continuous re-review on push; review comparison between commits.
 */
export async function createPendingReview(pullRequestId: string): Promise<{ id: string }> {
  const r = await prisma.codeReview.create({
    data: {
      pullRequestId,
      status: "pending",
      qualityScore: 0,
    },
  });
  return { id: r.id };
}

/**
 * Mark review as failed (e.g. after AI or parse error).
 */
export async function markReviewFailed(reviewId: string, rawError?: string): Promise<void> {
  await prisma.codeReview.update({
    where: { id: reviewId },
    data: {
      status: "failed",
      rawResponse: rawError ? rawError.slice(0, 50_000) : undefined,
    },
  });
}
