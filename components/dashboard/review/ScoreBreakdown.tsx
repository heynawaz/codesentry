"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

export type ScoreBreakdownProps = {
  overall: number;
  codeQuality?: number | null;
  security?: number | null;
  secrets?: number | null;
  performance?: number | null;
  maintainability?: number | null;
  className?: string;
};

const labels: Record<string, string> = {
  overall: "Overall",
  codeQuality: "Code quality",
  security: "Security",
  secrets: "Secrets risk",
  performance: "Performance",
  maintainability: "Maintainability",
};

export function ScoreBreakdown({
  overall,
  codeQuality,
  security,
  secrets,
  performance,
  maintainability,
  className,
}: ScoreBreakdownProps) {
  const items = [
    { key: "overall", value: overall },
    ...(codeQuality != null ? [{ key: "codeQuality", value: codeQuality }] : []),
    ...(security != null ? [{ key: "security", value: security }] : []),
    ...(secrets != null ? [{ key: "secrets", value: secrets }] : []),
    ...(performance != null ? [{ key: "performance", value: performance }] : []),
    ...(maintainability != null ? [{ key: "maintainability", value: maintainability }] : []),
  ];

  return (
    <div className={cn("space-y-3", className)}>
      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Score breakdown
      </h3>
      <Card className="border-border/80 shadow-none">
        <CardContent className="pt-4">
          <div className="space-y-4">
            {items.map(({ key, value }) => (
              <div key={key} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{labels[key] ?? key}</span>
                  <span className="font-medium tabular-nums">{value}/100</span>
                </div>
                <Progress value={value} className="h-2 rounded-full" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
