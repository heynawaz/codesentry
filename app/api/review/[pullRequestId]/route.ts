/**
 * POST /api/review/:pullRequestId
 * Run AI review for a PR. Idempotent: returns existing completed review if present.
 */

import { auth } from "@/auth";
import { prisma } from "@/lib/db/client";
import { getPullRequestDiff } from "@/services/github";
import { createReview } from "@/lib/reviews";
import { NextResponse } from "next/server";

export async function POST(
  _request: Request,
  context: { params: Promise<{ pullRequestId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { pullRequestId } = await context.params;
  if (!pullRequestId) {
    return NextResponse.json({ error: "pullRequestId required" }, { status: 400 });
  }

  const pr = await prisma.pullRequest.findFirst({
    where: { id: pullRequestId },
    include: {
      repository: { include: { userRepos: true } },
      codeReviews: {
        where: { status: "completed" },
        orderBy: { createdAt: "desc" },
        take: 1,
        include: { issues: true },
      },
    },
  });

  if (!pr || !pr.repository.userRepos.some((ur) => ur.userId === session.user!.id)) {
    return NextResponse.json({ error: "PR not found" }, { status: 404 });
  }

  // Idempotency: return existing completed review
  const existing = pr.codeReviews[0];
  if (existing) {
    return NextResponse.json({
      id: existing.id,
      status: existing.status,
      qualityScore: existing.qualityScore,
      codeQualityScore: existing.codeQualityScore ?? undefined,
      securityScore: existing.securityScore ?? undefined,
      secretsScore: existing.secretsScore ?? undefined,
      performanceScore: (existing as { performanceScore?: number | null }).performanceScore ?? undefined,
      maintainabilityScore: (existing as { maintainabilityScore?: number | null }).maintainabilityScore ?? undefined,
      summary: existing.summary ?? undefined,
      executionTimeMs: existing.executionTimeMs ?? undefined,
      issuesCount: existing.issues.length,
    });
  }

  const [owner, name] = pr.repository.fullName.split("/");
  if (!owner || !name) {
    return NextResponse.json({ error: "Invalid repository" }, { status: 400 });
  }

  let diff: string;
  try {
    diff = await getPullRequestDiff(session.user.id, owner, name, pr.githubPrId);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to fetch diff";
    return NextResponse.json({ error: message }, { status: 502 });
  }

  try {
    const review = await createReview({
      pullRequestId: pr.id,
      diff,
      prTitle: pr.title,
      prDescription: null,
      techStack: null,
    });

    return NextResponse.json({
      id: review.id,
      status: review.status,
      qualityScore: review.qualityScore,
      codeQualityScore: review.codeQualityScore ?? undefined,
      securityScore: review.securityScore ?? undefined,
      secretsScore: review.secretsScore ?? undefined,
      performanceScore: review.performanceScore ?? undefined,
      maintainabilityScore: review.maintainabilityScore ?? undefined,
      summary: review.summary ?? undefined,
      executionTimeMs: review.executionTimeMs ?? undefined,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Review failed";
    console.error("Review failed:", e);
    return NextResponse.json(
      { error: message, status: "failed" },
      { status: 500 }
    );
  }
}
