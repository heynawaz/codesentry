"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/db/client";

export async function getPullRequests(repositoryId: string) {
  const session = await auth();
  if (!session?.user?.id) return [];
  const repo = await prisma.repository.findFirst({
    where: { id: repositoryId, userRepos: { some: { userId: session.user.id } } },
  });
  if (!repo) return [];
  return prisma.pullRequest.findMany({
    where: { repositoryId },
    orderBy: { updatedAt: "desc" },
  });
}
