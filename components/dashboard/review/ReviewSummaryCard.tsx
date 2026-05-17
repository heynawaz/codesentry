"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Clock } from "lucide-react";

export type ReviewSummaryCardProps = {
  summary: string | null;
  overallScore: number;
  executionTimeMs?: number | null;
  className?: string;
};

export function ReviewSummaryCard({
  summary,
  overallScore,
  executionTimeMs,
  className,
}: ReviewSummaryCardProps) {
  return (
    <Card className={cn("border-border/80", className)}>
      <CardHeader className="space-y-1 pb-3">
        <CardTitle className="text-base font-semibold">Summary</CardTitle>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span className="font-medium tabular-nums text-foreground">{overallScore}/100</span>
          {executionTimeMs != null && (
            <span className="flex items-center gap-1">
              <Clock className="size-3.5" aria-hidden />
              {(executionTimeMs / 1000).toFixed(1)}s
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {summary ? (
          <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap">{summary}</p>
        ) : (
          <p className="text-sm italic text-muted-foreground">No summary.</p>
        )}
      </CardContent>
    </Card>
  );
}
