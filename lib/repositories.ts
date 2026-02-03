import { Prisma } from "@/lib/generated/prisma";
import { prisma } from "@/lib/db/client";
import * as github from "@/services/github";

/** Returns true if the user has a linked GitHub account (by DB user id or GitHub id). */
export async function hasLinkedGitHubAccount(userId: string): Promise<boolean> {
  const account = await prisma.gitHubAccount.findFirst({
    where: { OR: [{ userId }, { githubUserId: userId }] },
    select: { id: true },
  });
  return !!account;
}

export async function connectRepositories(userId: string, repoIds: number[]): Promise<{ connected: number; failed: string[] }> {
  const failed: string[] = [];
  let connected = 0;
  const repos = await github.listUserRepositories(userId);
  const byId = new Map(repos.map((r) => [r.id, r]));

  for (const id of repoIds) {
    const repo = byId.get(id);
    if (!repo) {
      failed.push(`Repo id ${id} not found or no access`);
      continue;
    }
    const [owner, name] = repo.full_name.split("/");
    if (!owner || !name) {
      failed.push(repo.full_name);
      continue;
    }
    const existing = await prisma.repository.findUnique({
      where: { githubRepoId: id },
    });
    if (existing) {
      await prisma.userRepository.upsert({
        where: {
          userId_repositoryId: { userId, repositoryId: existing.id },
        },
        create: { userId, repositoryId: existing.id },
        update: {},
      });
      connected++;
    } else {
      const created = await prisma.repository.create({
        data: {
          githubRepoId: id,
          fullName: repo.full_name,
          name: repo.name,
          defaultBranch: repo.default_branch ?? "main",
          userRepos: {
            create: { userId },
          },
        },
      });
      connected++;
    }
  }
  return { connected, failed };
}

export async function getConnectedRepositories(userId: string) {
  try {
    return await prisma.repository.findMany({
      where: {
        userRepos: { some: { userId } },
        deletedAt: null,
      },
      include: {
        _count: { select: { pullRequests: true } },
      },
      orderBy: { updatedAt: "desc" },
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2021") {
      throw new Error("Database schema not applied. Run: bun run db:push", { cause: err });
    }
    throw err;
  }
}

export async function disconnectRepository(userId: string, repositoryId: string): Promise<void> {
  await prisma.userRepository.deleteMany({
    where: { userId, repositoryId },
  });
}
