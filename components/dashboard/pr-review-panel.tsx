"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { AlertTriangle, CheckCircle2, Lightbulb, Shield } from "lucide-react";
import { motion } from "framer-motion";

type Issue = {
  id: string;
  kind: string;
  title: string;
  description: string | null;
  severity: string | null;
  filePath: string | null;
  lineStart: number | null;
  lineEnd: number | null;
  snippet: string | null;
};

type Review = {
  id: string;
  qualityScore: number;
  summary: string | null;
  issues: Issue[];
} | null;

type PRReviewPanelProps = {
  review: Review;
  onJumpToFile?: (path: string, line?: number) => void;
};

function IssueRow({ issue, onJumpToFile }: { issue: Issue; onJumpToFile?: (path: string, line?: number) => void }) {
  const isSecurity = issue.kind === "security";
  const Icon = isSecurity ? Shield : Lightbulb;
  const severityColor = issue.severity === "critical" ? "text-red-600 dark:text-red-400" : issue.severity === "high" ? "text-orange-600 dark:text-orange-400" : issue.severity === "medium" ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground";

  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} className="rounded-lg border border-border bg-card p-3 text-sm shadow-sm">
      <div className="flex items-start gap-2">
        <Icon className={cn("mt-0.5 size-4 shrink-0", isSecurity ? "text-red-500" : "text-amber-500")} />
        <div className="min-w-0 flex-1">
          <p className="font-medium">{issue.title}</p>
          {issue.severity && <span className={cn("text-xs", severityColor)}>{issue.severity}</span>}
          {issue.description && <p className="mt-1 text-muted-foreground">{issue.description}</p>}
          {(issue.filePath || issue.lineStart != null) && (
            <button type="button" onClick={() => onJumpToFile?.(issue.filePath ?? "", issue.lineStart ?? undefined)} className="mt-2 cursor-pointer text-xs text-primary hover:underline">
              {issue.filePath}
              {issue.lineStart != null && `:${issue.lineStart}`}
            </button>
          )}
          {issue.snippet && <pre className="mt-2 overflow-x-auto rounded bg-muted px-2 py-1 text-xs">{issue.snippet}</pre>}
        </div>
      </div>
    </motion.div>
  );
}

export function PRReviewPanel({ review, onJumpToFile }: PRReviewPanelProps) {
  if (!review) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <AlertTriangle className="size-5" />
            AI Review
          </CardTitle>
          <CardContent className="text-muted-foreground text-sm">No review yet. Click &quot;Run AI Review&quot; to analyze this pull request with AI.</CardContent>
        </CardHeader>
      </Card>
    );
  }

  const securityIssues = review.issues.filter((i) => i.kind === "security");
  const improvements = review.issues.filter((i) => i.kind === "improvement");

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <CheckCircle2 className="size-5 text-emerald-500" />
          AI Review
        </CardTitle>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Progress value={review.qualityScore} className="h-2 w-24" />
            <span className="text-sm font-medium">{review.qualityScore}/100</span>
          </div>
        </div>
        {review.summary && <p className="text-muted-foreground text-sm">{review.summary}</p>}
      </CardHeader>
      <CardContent className="space-y-4">
        {securityIssues.length > 0 && (
          <div>
            <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold text-red-600 dark:text-red-400">
              <Shield className="size-4" />
              Security &amp; issues ({securityIssues.length})
            </h4>
            <ScrollArea className="max-h-64">
              <div className="space-y-2 pr-2">
                {securityIssues.map((issue) => (
                  <IssueRow key={issue.id} issue={issue} onJumpToFile={onJumpToFile} />
                ))}
              </div>
            </ScrollArea>
          </div>
        )}
        {improvements.length > 0 && (
          <div>
            <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold text-amber-600 dark:text-amber-400">
              <Lightbulb className="size-4" />
              Suggestions ({improvements.length})
            </h4>
            <ScrollArea className="max-h-64">
              <div className="space-y-2 pr-2">
                {improvements.map((issue) => (
                  <IssueRow key={issue.id} issue={issue} onJumpToFile={onJumpToFile} />
                ))}
              </div>
            </ScrollArea>
          </div>
        )}
        {review.issues.length === 0 && <p className="text-muted-foreground text-sm">No issues or suggestions from the AI review.</p>}
      </CardContent>
    </Card>
  );
}
