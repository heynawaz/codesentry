import { prisma } from "@/lib/db/client";
import * as github from "@/services/github";

/**
 * Fetches open PRs from GitHub for a connected repository and upserts into DB.
 */
export async function syncPullRequests(userId: string, repositoryId: string): Promise<{ count: number }> {
  const repo = await prisma.repository.findFirst({
    where: {
      id: repositoryId,
      userRepos: { some: { userId } },
      deletedAt: null,
    },
  });
  if (!repo) throw new Error("Repository not found or not connected");

  const [owner, name] = repo.fullName.split("/");
  if (!owner || !name) throw new Error("Invalid repo fullName");

  const prs = await github.listPullRequests(userId, owner, name, "open");
  let count = 0;

  for (const pr of prs) {
    await prisma.pullRequest.upsert({
      where: {
        repositoryId_githubPrId: { repositoryId, githubPrId: pr.number },
      },
      create: {
        repositoryId,
        githubPrId: pr.number,
        title: pr.title,
        state: pr.state,
        author: pr.user?.login ?? null,
        authorAvatar: pr.user?.avatar_url ?? null,
        headRef: pr.head?.ref ?? null,
        baseRef: pr.base?.ref ?? null,
        diffUrl: pr.diff_url ?? null,
        // html_url can be stored if needed
      },
      update: {
        title: pr.title,
        state: pr.state,
        author: pr.user?.login ?? null,
        authorAvatar: pr.user?.avatar_url ?? null,
        headRef: pr.head?.ref ?? null,
        baseRef: pr.base?.ref ?? null,
        diffUrl: pr.diff_url ?? null,
      },
    });
    count++;
  }

  await prisma.repository.update({
    where: { id: repositoryId },
    data: { lastScannedAt: new Date() },
  });

  return { count };
}
