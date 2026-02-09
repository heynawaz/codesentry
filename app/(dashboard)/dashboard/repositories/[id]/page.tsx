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
import { GitPullRequest, ChevronRight, GitBranch, MessageSquare, User, Clock } from "lucide-react";
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
    <div className="space-y-8">
      {/* Page header */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-2">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href="/dashboard" className="text-muted-foreground hover:text-foreground text-sm transition-colors">
                    Repositories
                  </Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage className="text-muted-foreground font-normal text-sm">{repo.fullName}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{repo.fullName}</h1>
          <p className="text-sm text-muted-foreground">View and review pull requests</p>
        </div>
        <div className="shrink-0">
          <SyncPrsButton repositoryId={repo.id} />
        </div>
      </header>

      {/* Pull requests card */}
      <Card className="overflow-hidden rounded-2xl border border-border/80 bg-card shadow-sm p-0 gap-0">
        <CardHeader className="border-b border-border/80 px-6 py-3! gap-0 sm:px-8">
          <div className="flex items-center gap-4">
            <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <GitPullRequest className="size-6" />
            </div>
            <div>
              <CardTitle className="text-xl font-semibold">Pull requests</CardTitle>
              <p className="mt-0.5 text-sm text-muted-foreground">{repo.pullRequests.length === 0 ? "No PRs synced yet" : `${openCount} open · ${repo.pullRequests.length} total`}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {repo.pullRequests.length === 0 ? (
            <Empty className="min-h-[260px] border-0">
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
            <ul className="divide-y divide-border/80">
              {repo.pullRequests.map((pr) => {
                const state = pr.state.toLowerCase();
                const reviewCount = pr._count.codeReviews;
                return (
                  <li key={pr.id}>
                    <Link href={`/dashboard/repositories/${repo.id}/pr/${pr.id}`} className="group flex cursor-pointer items-start gap-4 px-6 py-5 transition-colors hover:bg-muted/40 sm:items-center sm:px-8">
                      <Avatar className="size-10 shrink-0 border-2 border-background shadow-sm ring-1 ring-border/50">
                        <AvatarImage src={pr.authorAvatar ?? undefined} alt={pr.author ?? ""} />
                        <AvatarFallback className="bg-muted text-sm font-medium">{pr.author?.slice(0, 2)?.toUpperCase() ?? "?"}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1 space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold text-foreground truncate">
                            #{pr.githubPrId} {pr.title}
                          </span>
                          <Badge variant={state === "open" ? "default" : "secondary"} className={cn("shrink-0 rounded-full text-xs font-medium px-2.5", state === "open" && "bg-emerald-600 hover:bg-emerald-600/90 text-white dark:bg-emerald-500 dark:hover:bg-emerald-500/90")}>
                            {state}
                          </Badge>
                          {reviewCount > 0 && (
                            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-muted/80 px-2.5 py-0.5 text-xs text-muted-foreground">
                              <MessageSquare className="size-3.5" />
                              {reviewCount} review{reviewCount !== 1 ? "s" : ""}
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-0.5 text-xs text-muted-foreground">
                          {pr.author && (
                            <span className="inline-flex items-center gap-1">
                              <User className="size-3.5 shrink-0" />
                              {pr.author}
                            </span>
                          )}
                          <span className="inline-flex items-center gap-1">
                            <Clock className="size-3.5 shrink-0" />
                            Updated {formatDistanceToNow(pr.updatedAt, { addSuffix: true })}
                          </span>
                          {(pr.baseRef || pr.headRef) && (
                            <span className="inline-flex items-center gap-1 font-mono">
                              <GitBranch className="size-3.5 shrink-0" />
                              {pr.baseRef ?? "?"} → {pr.headRef ?? "?"}
                            </span>
                          )}
                        </div>
                      </div>
                      <ChevronRight className="size-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
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
