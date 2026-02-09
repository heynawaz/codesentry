"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Shield, Lightbulb, KeyRound, Sparkles } from "lucide-react";
import {
  ReviewSummaryCard,
  ReviewScoresChart,
  IssueDistributionChart,
  ReviewScoreGauge,
  IssueList,
  ReviewEmpty,
  ReviewLoading,
  ReviewError,
} from "@/components/dashboard/review";
type Issue = {
  id: string;
  kind: string;
  category?: string | null;
  title: string;
  description: string | null;
  severity: string | null;
  suggestion?: string | null;
  filePath: string | null;
  lineStart: number | null;
  lineEnd: number | null;
  snippet: string | null;
  fixedCode?: string | null;
};

type Review = {
  id: string;
  status: "pending" | "completed" | "failed";
  qualityScore: number;
  codeQualityScore?: number;
  securityScore?: number;
  secretsScore?: number;
  performanceScore?: number;
  maintainabilityScore?: number;
  summary: string | null;
  executionTimeMs?: number | null;
  issues: Issue[];
} | null;

type PRReviewPanelProps = {
  review: Review;
  onJumpToFile?: (path: string, line?: number) => void;
  runReviewButton?: React.ReactNode;
  isLoading?: boolean;
};

export function PRReviewPanel({
  review,
  onJumpToFile,
  runReviewButton,
  isLoading = false,
}: PRReviewPanelProps) {
  if (isLoading) {
    return <ReviewLoading />;
  }

  if (!review) {
    return <ReviewEmpty runReviewButton={runReviewButton} />;
  }

  if (review.status === "pending") {
    return <ReviewLoading />;
  }

  if (review.status === "failed") {
    return (
      <ReviewError
        message="The last review run failed. You can try again with Run AI Review."
        retryButton={runReviewButton}
      />
    );
  }

  const securityIssues = review.issues.filter((i) => i.kind === "security");
  const secretsIssues = review.issues.filter((i) => i.kind === "secrets");
  const improvementIssues = review.issues.filter((i) => i.kind === "improvement" || i.kind === "performance" || i.kind === "global");
  const hasIssues = securityIssues.length > 0 || secretsIssues.length > 0 || improvementIssues.length > 0;

  return (
    <div className="rounded-2xl border border-border/80 bg-card/50 shadow-sm">
      <div className="border-b border-border/80 px-6 py-4">
        <h2 className="flex items-center gap-2 text-lg font-semibold tracking-tight">
          <Sparkles className="size-5 text-primary" aria-hidden />
          AI Review
        </h2>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Analysis of code changes in this PR (quality, security, and secrets).
        </p>
      </div>

      <div className="space-y-8 p-6">
        {/* Hero: overall score + summary */}
        <div className="grid gap-6 lg:grid-cols-[minmax(0,280px)_1fr]">
          <ReviewScoreGauge score={review.qualityScore} label="Overall score" className="shadow-none" />
          <ReviewSummaryCard
            summary={review.summary}
            overallScore={review.qualityScore}
            executionTimeMs={review.executionTimeMs}
            className="shadow-none"
          />
        </div>

        {/* Metrics row: bar chart + issue distribution */}
        <div>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Metrics
          </h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <ReviewScoresChart
              overall={review.qualityScore}
              codeQuality={review.codeQualityScore}
              security={review.securityScore}
              secrets={review.secretsScore}
              performance={review.performanceScore}
              maintainability={review.maintainabilityScore}
              className="shadow-none"
            />
            {hasIssues ? (
              <IssueDistributionChart
                securityCount={securityIssues.length}
                secretsCount={secretsIssues.length}
                improvementCount={improvementIssues.length}
                className="shadow-none"
              />
            ) : (
              <Card className="flex flex-col items-center justify-center py-10 shadow-none">
                <p className="text-sm text-muted-foreground">No issues reported</p>
              </Card>
            )}
          </div>
        </div>

        {/* Issues section: each finding shows title, code/location, description, suggestion */}
        {hasIssues && (
          <div>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Findings
            </h3>
            <p className="mb-3 text-sm text-muted-foreground">
              Issues with code location and suggested fixes. Use <strong>View in diff</strong> to jump to the line in the PR.
            </p>
            <Card className="overflow-hidden shadow-none">
              <ScrollArea className="max-h-[min(70vh,36rem)]">
                <CardContent className="divide-y divide-border/80 p-0">
                  {securityIssues.length > 0 && (
                    <div className="p-4">
                      <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-red-600 dark:text-red-400">
                        <Shield className="size-4 shrink-0" />
                        Security
                        <span className="rounded-full bg-red-500/10 px-2 py-0.5 text-xs font-medium tabular-nums text-red-600 dark:text-red-400">
                          {securityIssues.length}
                        </span>
                      </h4>
                      <IssueList
                        issues={securityIssues}
                        kindFilter="security"
                        onJumpToFile={onJumpToFile}
                        className="max-h-none"
                      />
                    </div>
                  )}
                  {secretsIssues.length > 0 && (
                    <div className="p-4">
                      <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-amber-600 dark:text-amber-400">
                        <KeyRound className="size-4 shrink-0" />
                        Secrets
                        <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-medium tabular-nums text-amber-600 dark:text-amber-400">
                          {secretsIssues.length}
                        </span>
                      </h4>
                      <IssueList
                        issues={secretsIssues}
                        kindFilter="secrets"
                        onJumpToFile={onJumpToFile}
                        className="max-h-none"
                      />
                    </div>
                  )}
                  {improvementIssues.length > 0 && (
                    <div className="p-4">
                      <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-blue-600 dark:text-blue-400">
                        <Lightbulb className="size-4 shrink-0" />
                        Suggestions
                        <span className="rounded-full bg-blue-500/10 px-2 py-0.5 text-xs font-medium tabular-nums text-blue-600 dark:text-blue-400">
                          {improvementIssues.length}
                        </span>
                      </h4>
                      <IssueList
                        issues={improvementIssues}
                        kindFilter="all"
                        onJumpToFile={onJumpToFile}
                        className="max-h-none"
                      />
                    </div>
                  )}
                </CardContent>
              </ScrollArea>
            </Card>
          </div>
        )}

        {review.issues.length === 0 && (
          <Card className="border-dashed shadow-none">
            <CardContent className="py-8 text-center">
              <p className="text-sm text-muted-foreground">
                No issues or suggestions from the AI review.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
