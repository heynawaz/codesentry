import { auth } from "@/auth";
import { prisma } from "@/lib/db/client";
import { syncRepoPrsAction } from "@/app/actions/sync";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { notFound } from "next/navigation";
import Link from "next/link";
import { SyncPrsButton } from "@/components/dashboard/sync-prs-button";

export default async function RepositoryPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) notFound();
  const { id } = await params;

  const repo = await prisma.repository.findFirst({
    where: {
      id,
      userRepos: { some: { userId: session.user.id } },
      deletedAt: null,
    },
    include: {
      pullRequests: { orderBy: { updatedAt: "desc" }, take: 20 },
    },
  });

  if (!repo) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <Link href="/dashboard" className="text-muted-foreground text-sm hover:underline">
            ← Connected Repositories
          </Link>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">{repo.fullName}</h1>
        </div>
        <SyncPrsButton repositoryId={repo.id} />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Pull requests</CardTitle>
        </CardHeader>
        <CardContent>
          {repo.pullRequests.length === 0 ? (
            <p className="text-muted-foreground text-sm">No pull requests stored yet. Sync PRs from GitHub to see them here.</p>
          ) : (
            <ul className="space-y-2">
              {repo.pullRequests.map((pr) => (
                <li key={pr.id} className="flex items-center justify-between rounded border px-3 py-2">
                  <span className="font-medium">
                    #{pr.githubPrId} {pr.title}
                  </span>
                  <span className="text-muted-foreground text-sm">{pr.state}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
