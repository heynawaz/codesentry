import { auth } from "@/auth";
import { prisma } from "@/lib/db/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { notFound } from "next/navigation";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { SyncPrsButton } from "@/components/dashboard/sync-prs-button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { GitPullRequest, ChevronRight, GitBranch, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";

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
      pullRequests: {
        orderBy: { updatedAt: "desc" },
        take: 50,
        include: {
          _count: { select: { codeReviews: true } },
        },
      },
    },
  });

  if (!repo) notFound();

  const openCount = repo.pullRequests.filter((pr) => pr.state.toLowerCase() === "open").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href="/dashboard" className="cursor-pointer">Repositories</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{repo.fullName}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <h1 className="text-2xl font-bold tracking-tight">{repo.fullName}</h1>
          <p className="text-sm text-muted-foreground">View and review pull requests</p>
        </div>
        <SyncPrsButton repositoryId={repo.id} />
      </div>

      <Card className="overflow-hidden rounded-xl border shadow-sm">
        <CardHeader className="border-b border-border/50 bg-muted/20 pb-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <GitPullRequest className="size-5" />
              </div>
              <div>
                <CardTitle className="text-lg">Pull requests</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {repo.pullRequests.length === 0
                    ? "No PRs synced yet"
                    : `${openCount} open · ${repo.pullRequests.length} total`}
                </p>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {repo.pullRequests.length === 0 ? (
            <Empty className="min-h-[220px] border-0">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <GitPullRequest />
                </EmptyMedia>
                <EmptyTitle>No pull requests yet</EmptyTitle>
                <EmptyDescription>Sync PRs from GitHub to see open pull requests here.</EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <SyncPrsButton repositoryId={repo.id} />
              </EmptyContent>
            </Empty>
          ) : (
            <ul className="divide-y divide-border">
              {repo.pullRequests.map((pr) => {
                const state = pr.state.toLowerCase();
                const reviewCount = pr._count.codeReviews;
                return (
                  <li key={pr.id}>
                    <Link
                      href={`/dashboard/repositories/${repo.id}/pr/${pr.id}`}
                      className="flex cursor-pointer items-center gap-4 px-4 py-4 transition-colors hover:bg-muted/50 sm:px-6"
                    >
                      <Avatar className="size-9 shrink-0 border-2 border-background shadow-sm">
                        <AvatarImage src={pr.authorAvatar ?? undefined} alt={pr.author ?? ""} />
                        <AvatarFallback className="bg-muted text-xs font-medium">
                          {pr.author?.slice(0, 2)?.toUpperCase() ?? "?"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold text-foreground">
                            #{pr.githubPrId} {pr.title}
                          </span>
                          <Badge
                            variant={state === "open" ? "default" : "secondary"}
                            className={cn(
                              "rounded-md text-xs font-medium",
                              state === "open" && "bg-emerald-600 hover:bg-emerald-600/90 text-white dark:bg-emerald-500 dark:hover:bg-emerald-500/90"
                            )}
                          >
                            {state}
                          </Badge>
                          {reviewCount > 0 && (
                            <Badge variant="outline" className="rounded-md gap-1 text-xs">
                              <MessageSquare className="size-3" />
                              {reviewCount} review{reviewCount !== 1 ? "s" : ""}
                            </Badge>
                          )}
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-0.5 text-sm text-muted-foreground">
                          {pr.author && <span>{pr.author}</span>}
                          <span>·</span>
                          <span>Updated {formatDistanceToNow(pr.updatedAt, { addSuffix: true })}</span>
                          {(pr.baseRef || pr.headRef) && (
                            <>
                              <span>·</span>
                              <span className="inline-flex items-center gap-1 font-mono text-xs">
                                <GitBranch className="size-3" />
                                {pr.baseRef ?? "?"} → {pr.headRef ?? "?"}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      <ChevronRight className="size-5 shrink-0 text-muted-foreground" />
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
