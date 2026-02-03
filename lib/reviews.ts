import { prisma } from "@/lib/db/client";
import * as aiReview from "@/services/ai-review";

export type CreateReviewInput = {
  pullRequestId: string;
  diff: string;
};

/**
 * Runs AI review (stub) on the given diff and persists the result.
 * TODO: Replace with real AI provider call.
 */
export async function createReview(input: CreateReviewInput) {
  const result = await aiReview.reviewPullRequestDiff(input.diff);

  const codeReview = await prisma.codeReview.create({
    data: {
      pullRequestId: input.pullRequestId,
      qualityScore: result.qualityScore,
      summary: result.summary,
      rawResponse: result.rawResponse,
      issues: {
        create: [
          ...result.securityIssues.map((i) => ({
            kind: "security" as const,
            title: i.title,
            description: i.description,
            severity: i.severity,
            filePath: i.filePath,
            lineStart: i.lineStart,
            lineEnd: i.lineEnd,
            snippet: i.snippet,
          })),
          ...result.improvements.map((i) => ({
            kind: "improvement" as const,
            title: i.title,
            description: i.description,
            severity: i.severity,
            filePath: i.filePath,
            lineStart: i.lineStart,
            lineEnd: i.lineEnd,
            snippet: i.snippet,
          })),
        ],
      },
    },
    include: { issues: true },
  });

  return codeReview;
}
