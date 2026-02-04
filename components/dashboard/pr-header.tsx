"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { GitBranch, Loader2, Sparkles } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { motion } from "framer-motion";

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
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="space-y-4">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/dashboard" className="cursor-pointer">
                Repositories
              </Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href={`/dashboard/repositories/${repositoryId}`} className="cursor-pointer">
                {repoFullName}
              </Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>
              #{pr.githubPrId} {pr.title}
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight flex flex-wrap items-center gap-2">
            {pr.title}
            <Badge variant={pr.state === "open" ? "default" : "secondary"} className="rounded-md">
              {pr.state}
            </Badge>
          </h1>
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            {(pr.baseRef || pr.headRef) && (
              <span className="flex items-center gap-1.5">
                <GitBranch className="size-4" />
                {pr.baseRef} → {pr.headRef}
              </span>
            )}
            {pr.author && (
              <span className="flex items-center gap-1.5">
                <Avatar className="size-5">
                  <AvatarImage src={pr.authorAvatar ?? undefined} alt={pr.author} />
                  <AvatarFallback className="text-[10px]">{pr.author.slice(0, 2)}</AvatarFallback>
                </Avatar>
                {pr.author}
              </span>
            )}
          </div>
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button onClick={handleRunReview} disabled={pending} className="rounded-lg shadow-sm gap-2">
                {pending ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Analyzing…
                  </>
                ) : (
                  <>
                    <Sparkles className="" />
                    Run AI Review
                  </>
                )}
              </Button>
            </motion.div>
          </TooltipTrigger>
          <TooltipContent>Analyze this PR with AI and get code quality feedback</TooltipContent>
        </Tooltip>
      </div>
      <Separator />
    </motion.div>
  );
}
