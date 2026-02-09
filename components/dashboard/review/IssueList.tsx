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
  fixedCode?: string | null;
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
        {filtered.map((issue) => {
          const hasLocation = issue.filePath ?? issue.lineStart != null;
          return (
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
                {hasLocation && (
                  <button
                    type="button"
                    onClick={() =>
                      onJumpToFile?.(issue.filePath ?? "", issue.lineStart ?? undefined)
                    }
                    className="rounded border border-primary/30 bg-primary/5 px-2 py-1 text-xs font-medium text-primary hover:bg-primary/10 hover:underline focus:outline-none focus:ring-2 focus:ring-primary/50"
                  >
                    {issue.filePath ?? "File"}
                    {issue.lineStart != null && `:${issue.lineStart}`}
                    <span className="ml-1 opacity-80">→ View in diff</span>
                  </button>
                )}
              </div>
              {/* Code: always show a "Code" block — snippet or prompt to view in diff */}
              <div className="mt-3">
                <p className="mb-1 text-xs font-medium text-muted-foreground">Code</p>
                {issue.snippet ? (
                  <pre className="overflow-x-auto rounded-lg border border-border/80 bg-background px-2.5 py-1.5 text-xs font-mono">
                    {issue.snippet}
                  </pre>
                ) : hasLocation ? (
                  <p className="rounded-lg border border-dashed border-border/80 bg-muted/50 px-2.5 py-2 text-xs text-muted-foreground">
                    Code not shown here. Use <strong>View in diff</strong> above to jump to the line in the PR diff.
                  </p>
                ) : (
                  <p className="rounded-lg border border-dashed border-border/80 bg-muted/50 px-2.5 py-2 text-xs text-muted-foreground">
                    No code location for this finding. Re-run <strong>AI Review</strong> to get line-specific issues with file and snippet.
                  </p>
                )}
              </div>
              {issue.description && (
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{issue.description}</p>
              )}
              {issue.suggestion && !issue.fixedCode && (
                <p className="mt-2 text-xs">
                  <span className="font-medium text-foreground">Suggestion: </span>
                  <span className="text-muted-foreground">{issue.suggestion}</span>
                </p>
              )}
              {(issue.fixedCode || issue.suggestion) && (
                <div className="mt-3">
                  <p className="mb-1 text-xs font-medium text-muted-foreground">Code fix</p>
                  <pre className="overflow-x-auto rounded-lg border border-primary/20 bg-primary/5 px-2.5 py-1.5 text-xs font-mono whitespace-pre-wrap">
                    {issue.fixedCode ?? issue.suggestion}
                  </pre>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </ScrollArea>
  );
}
