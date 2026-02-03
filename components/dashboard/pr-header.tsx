"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GitBranch, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

type PRHeaderProps = {
  repositoryId: string;
  repoFullName: string;
  pr: {
    id: string;
    githubPrId: number;
    title: string;
    state: string;
    author: string | null;
    authorAvatar: string | null;
    baseRef: string | null;
    headRef: string | null;
  };
  runReviewAction: (pullRequestId: string) => Promise<{ ok: true; reviewId: string; qualityScore: number } | { ok: false; error: string }>;
};

export function PRHeader({ repositoryId, repoFullName, pr, runReviewAction }: PRHeaderProps) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const handleRunReview = () => {
    startTransition(async () => {
      const result = await runReviewAction(pr.id);
      if (result.ok) {
        router.refresh();
      }
    });
  };

  return (
    <div className="space-y-3 border-b border-border pb-4">
      <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
        <Link href="/dashboard" className="hover:text-foreground hover:underline">
          Repositories
        </Link>
        <span>/</span>
        <Link href={`/dashboard/repositories/${repositoryId}`} className="hover:text-foreground hover:underline">
          {repoFullName}
        </Link>
        <span>/</span>
        <span className="text-foreground font-medium">
          #{pr.githubPrId} {pr.title}
        </span>
      </div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold tracking-tight">
            {pr.title}
            <Badge variant={pr.state === "open" ? "default" : "secondary"} className="ml-2">
              {pr.state}
            </Badge>
          </h1>
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            {(pr.baseRef || pr.headRef) && (
              <span className="flex items-center gap-1">
                <GitBranch className="size-4" />
                {pr.baseRef} → {pr.headRef}
              </span>
            )}
            {pr.author && (
              <span className="flex items-center gap-1">
                <Avatar className="size-4">
                  <AvatarImage src={pr.authorAvatar ?? undefined} alt={pr.author} />
                  <AvatarFallback className="text-[10px]">{pr.author.slice(0, 2)}</AvatarFallback>
                </Avatar>
                {pr.author}
              </span>
            )}
          </div>
        </div>
        <Button onClick={handleRunReview} disabled={pending}>
          {pending ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" />
              Analyzing…
            </>
          ) : (
            "Run AI Review"
          )}
        </Button>
      </div>
    </div>
  );
}
