import { auth } from "@/auth";
import { prisma } from "@/lib/db/client";
import { getPullRequestDiff } from "@/services/github";
import { parseUnifiedDiff, type ParsedFile } from "@/lib/diff";
import { notFound } from "next/navigation";
import { PRHeader } from "@/components/dashboard/pr-header";
import { PRDetailTabs } from "@/components/dashboard/pr-detail-tabs";
import { runReviewAction } from "@/app/actions/reviews";

/** Cap parsed files sent to client to avoid RSC payload stack overflow (react-server-dom-turbo). */
const MAX_PARSED_FILES_FOR_PAYLOAD = 80;
/** Max lines per file in payload to keep serialization safe. */
const MAX_LINES_PER_FILE_PAYLOAD = 400;
/** Max review issues in payload to avoid huge RSC payload. */
const MAX_ISSUES_FOR_PAYLOAD = 200;

function trimParsedFilesForPayload(files: ParsedFile[]): ParsedFile[] {
  const capped = files.slice(0, MAX_PARSED_FILES_FOR_PAYLOAD);
  return capped.map(trimFileLines);
}

function trimFileLines(file: ParsedFile): ParsedFile {
  let total = 0;
  const hunks = [];
  for (const hunk of file.hunks) {
    if (total + hunk.lines.length <= MAX_LINES_PER_FILE_PAYLOAD) {
      hunks.push(hunk);
      total += hunk.lines.length;
    } else {
      const take = MAX_LINES_PER_FILE_PAYLOAD - total;
      if (take > 0) {
        hunks.push({ ...hunk, lines: hunk.lines.slice(0, take) });
      }
      break;
    }
  }
  return { ...file, hunks };
}

export default async function PRDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string; prId: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) notFound();

  const { id: repositoryId, prId } = await params;
  const { tab: tabParam } = await searchParams;
  const defaultTab = tabParam === "review" ? "review" : "files";

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
    const allFiles = parseUnifiedDiff(rawDiff);
    // Keep payload small to avoid "Maximum call stack size exceeded" in RSC serialization
    parsedFiles = trimParsedFilesForPayload(allFiles);
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
        defaultTab={defaultTab}
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
                issues: latestReview.issues.slice(0, MAX_ISSUES_FOR_PAYLOAD).map((i) => ({
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
                  fixedCode: (i as { fixedCode?: string | null }).fixedCode ?? undefined,
                })),
              }
            : null
        }
      />
    </div>
  );
}
