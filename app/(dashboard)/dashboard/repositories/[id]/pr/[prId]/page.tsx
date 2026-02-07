import { auth } from "@/auth";
import { prisma } from "@/lib/db/client";
import { getPullRequestDiff } from "@/services/github";
import { parseUnifiedDiff, type ParsedFile } from "@/lib/diff";
import { notFound } from "next/navigation";
import { PRHeader } from "@/components/dashboard/pr-header";
import { PRDetailTabs } from "@/components/dashboard/pr-detail-tabs";
import { runReviewAction } from "@/app/actions/reviews";

export default async function PRDetailPage({ params }: { params: Promise<{ id: string; prId: string }> }) {
  const session = await auth();
  if (!session?.user?.id) notFound();

  const { id: repositoryId, prId } = await params;

  const repo = await prisma.repository.findFirst({
    where: {
      id: repositoryId,
      userRepos: { some: { userId: session.user.id } },
      deletedAt: null,
    },
  });
  if (!repo) notFound();

  const pr = await prisma.pullRequest.findFirst({
    where: { id: prId, repositoryId },
    include: {
      codeReviews: {
        orderBy: { createdAt: "desc" },
        take: 1,
        include: { issues: true },
      },
    },
  });
  if (!pr) notFound();

  const [owner, name] = repo.fullName.split("/");
  let parsedFiles: ParsedFile[] = [];
  try {
    const rawDiff = await getPullRequestDiff(session.user.id, owner, name, pr.githubPrId);
    parsedFiles = parseUnifiedDiff(rawDiff);
  } catch {
    // Diff fetch can fail (e.g. private repo token issue); show empty diff
  }

  const latestReview = pr.codeReviews[0] ?? null;

  return (
    <div className="w-full min-w-0 space-y-6">
      <PRHeader
        repositoryId={repositoryId}
        repoFullName={repo.fullName}
        pr={{
          id: pr.id,
          githubPrId: pr.githubPrId,
          title: pr.title,
          state: pr.state,
          author: pr.author,
          authorAvatar: pr.authorAvatar,
          baseRef: pr.baseRef,
          headRef: pr.headRef,
        }}
        runReviewAction={runReviewAction}
      />

      <PRDetailTabs
        repoFullName={repo.fullName}
        githubPrId={pr.githubPrId}
        headRef={pr.headRef}
        parsedFiles={parsedFiles}
        latestReview={
          latestReview
            ? {
                id: latestReview.id,
                status: latestReview.status,
                qualityScore: latestReview.qualityScore,
                codeQualityScore: latestReview.codeQualityScore ?? undefined,
                securityScore: latestReview.securityScore ?? undefined,
                secretsScore: latestReview.secretsScore ?? undefined,
                performanceScore: (latestReview as { performanceScore?: number | null }).performanceScore ?? undefined,
                maintainabilityScore: (latestReview as { maintainabilityScore?: number | null }).maintainabilityScore ?? undefined,
                summary: latestReview.summary,
                executionTimeMs: latestReview.executionTimeMs ?? undefined,
                scoreBreakdown: (latestReview as { scoreBreakdown?: unknown }).scoreBreakdown ?? undefined,
                issues: latestReview.issues.map((i) => ({
                  id: i.id,
                  kind: i.kind,
                  category: (i as { category?: string | null }).category ?? undefined,
                  title: i.title,
                  description: i.description,
                  severity: i.severity,
                  suggestion: i.suggestion,
                  filePath: i.filePath,
                  lineStart: i.lineStart,
                  lineEnd: i.lineEnd,
                  snippet: i.snippet,
                })),
              }
            : null
        }
      />
    </div>
  );
}
