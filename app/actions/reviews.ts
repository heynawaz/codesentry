"use server";

import { auth } from "@/auth";
import { createReview } from "@/lib/reviews";
import { prisma } from "@/lib/db/client";
import { getPullRequestDiff } from "@/services/github";

export type RunReviewResult = { ok: true; reviewId: string; qualityScore: number } | { ok: false; error: string };

export async function runReviewAction(pullRequestId: string): Promise<RunReviewResult> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "Unauthorized" };

  const pr = await prisma.pullRequest.findFirst({
    where: { id: pullRequestId },
    include: { repository: { include: { userRepos: true } } },
  });

  if (!pr || !pr.repository.userRepos.some((ur) => ur.userId === session.user!.id)) {
    return { ok: false, error: "Pull request not found" };
  }

  const [owner, name] = pr.repository.fullName.split("/");
  if (!owner || !name) return { ok: false, error: "Invalid repository" };

  try {
    const diff = await getPullRequestDiff(session.user.id, owner, name, pr.githubPrId);
    const review = await createReview({ pullRequestId: pr.id, diff });
    return { ok: true, reviewId: review.id, qualityScore: review.qualityScore };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Review failed";
    return { ok: false, error: message };
  }
}
