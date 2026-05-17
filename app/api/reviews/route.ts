import { auth } from "@/auth";
import { createReview } from "@/lib/reviews";
import { prisma } from "@/lib/db/client";
import { getPullRequestDiff } from "@/services/github";
import { NextResponse } from "next/server";

/**
 * POST /api/reviews
 * Body: { pullRequestId: string }
 * Fetches PR diff, runs AI review (stub), persists result.
 */
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { pullRequestId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const pullRequestId = body.pullRequestId;
  if (!pullRequestId) {
    return NextResponse.json({ error: "pullRequestId required" }, { status: 400 });
  }

  const pr = await prisma.pullRequest.findFirst({
    where: { id: pullRequestId },
    include: { repository: { include: { userRepos: true } } },
  });

  if (!pr || !pr.repository.userRepos.some((ur) => ur.userId === session.user!.id)) {
    return NextResponse.json({ error: "PR not found" }, { status: 404 });
  }

  const [owner, name] = pr.repository.fullName.split("/");
  if (!owner || !name) {
    return NextResponse.json({ error: "Invalid repository" }, { status: 400 });
  }

  try {
    const diff = await getPullRequestDiff(session.user.id, owner, name, pr.githubPrId);
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
    });
  } catch (e) {
    console.error("Review failed:", e);
    return NextResponse.json({ error: e instanceof Error ? e.message : "Review failed" }, { status: 500 });
  }
}
