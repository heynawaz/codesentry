"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

export type ReviewIssue = {
  id: string;
  kind: string;
  title: string;
  description: string | null;
  severity: string | null;
  suggestion?: string | null;
  filePath: string | null;
  lineStart: number | null;
  lineEnd: number | null;
  snippet: string | null;
};

export type IssueListProps = {
  issues: ReviewIssue[];
  kindFilter?: "security" | "improvement" | "secrets" | "all";
  severityFilter?: "low" | "medium" | "high" | "critical" | "all";
  onJumpToFile?: (path: string, line?: number) => void;
  className?: string;
};

export function IssueList({
  issues,
  kindFilter = "all",
  severityFilter = "all",
  onJumpToFile,
  className,
}: IssueListProps) {
  const filtered = issues.filter((i) => {
    if (kindFilter !== "all" && i.kind !== kindFilter) return false;
    if (severityFilter !== "all" && i.severity !== severityFilter) return false;
    return true;
  });

  const severityClass: Record<string, string> = {
    high: "bg-red-500/10 text-red-700 dark:text-red-400",
    medium: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
    low: "bg-slate-500/10 text-slate-600 dark:text-slate-400",
    critical: "bg-red-600/20 text-red-800 dark:text-red-300",
  };

  return (
    <ScrollArea className={cn("max-h-80", className)}>
      <ul className="space-y-3 pr-2">
        {filtered.map((issue) => (
          <li
            key={issue.id}
            className="rounded-xl border border-border/80 bg-muted/30 p-3.5 text-sm transition-colors hover:bg-muted/50"
          >
            <p className="font-medium leading-snug">{issue.title}</p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {issue.severity && (
                <span
                  className={cn(
                    "rounded-md px-1.5 py-0.5 text-xs font-medium capitalize",
                    severityClass[issue.severity] ?? "bg-muted text-muted-foreground"
                  )}
                >
                  {issue.severity}
                </span>
              )}
              {(issue.filePath ?? issue.lineStart != null) && (
                <button
                  type="button"
                  onClick={() =>
                    onJumpToFile?.(issue.filePath ?? "", issue.lineStart ?? undefined)
                  }
                  className="rounded border border-transparent px-1.5 py-0.5 text-xs text-primary hover:underline focus:border-primary focus:outline-none"
                >
                  {issue.filePath}
                  {issue.lineStart != null && `:${issue.lineStart}`}
                </button>
              )}
            </div>
            {issue.description && (
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{issue.description}</p>
            )}
            {issue.suggestion && (
              <p className="mt-2 text-xs text-muted-foreground">
                <span className="font-medium text-foreground">Suggestion: </span>
                {issue.suggestion}
              </p>
            )}
            {issue.snippet && (
              <pre className="mt-2 overflow-x-auto rounded-lg bg-muted/80 px-2.5 py-1.5 text-xs">
                {issue.snippet}
              </pre>
            )}
          </li>
        ))}
      </ul>
    </ScrollArea>
  );
}
