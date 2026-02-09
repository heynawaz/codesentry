"use client";

import { cn } from "@/lib/utils";

export type InlineAIPanelIssue = {
  kind: string;
  category?: string | null;
  severity: string | null;
  title: string;
  description?: string | null;
  suggestion?: string | null;
  snippet?: string | null;
  fixedCode?: string | null;
};

export type InlineAIPanelProps = {
  issues: InlineAIPanelIssue[];
  className?: string;
};

function severityBadgeClass(severity: string | null): string {
  if (severity === "high" || severity === "critical") return "bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/30";
  if (severity === "medium") return "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30";
  return "bg-muted text-muted-foreground border-border";
}

export function InlineAIPanel({ issues, className }: InlineAIPanelProps) {
  if (!issues.length) return null;

  return (
    <div className={cn("space-y-3 rounded-lg border border-border/80 bg-card p-3 text-left shadow-md", className)}>
      {issues.map((issue, idx) => (
        <div key={idx} className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={cn(
                "rounded-md border px-1.5 py-0.5 text-xs font-medium capitalize",
                severityBadgeClass(issue.severity)
              )}
            >
              {issue.severity ?? "low"}
            </span>
            {(issue.category ?? issue.kind) && (
              <span className="text-xs text-muted-foreground">{issue.category ?? issue.kind}</span>
            )}
          </div>
          <p className="font-medium text-sm text-foreground">{issue.title}</p>
          {issue.description && issue.description !== issue.title && (
            <p className="text-xs leading-relaxed text-muted-foreground">{issue.description}</p>
          )}
          {issue.snippet && (
            <pre className="mt-1.5 overflow-x-auto rounded border border-border/80 bg-muted/60 px-2 py-1.5 text-xs">
              {issue.snippet}
            </pre>
          )}
          {issue.suggestion && !issue.fixedCode && (
            <p className="text-xs text-primary">
              <span className="font-medium">Suggestion: </span>
              {issue.suggestion}
            </p>
          )}
          {(issue.fixedCode ?? issue.suggestion) && (
            <>
              <p className="mb-1 text-xs font-medium text-muted-foreground">Code fix</p>
              <pre className="overflow-x-auto rounded border border-primary/20 bg-primary/5 px-2 py-1.5 text-xs font-mono whitespace-pre-wrap">
                {issue.fixedCode ?? issue.suggestion}
              </pre>
            </>
          )}
        </div>
      ))}
    </div>
  );
}
