"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer } from "@/components/ui/chart";
import type { ChartConfig } from "@/components/ui/chart";
import { RadialBar, RadialBarChart } from "recharts";
import { cn } from "@/lib/utils";

export type ReviewScoreGaugeProps = {
  score: number;
  label?: string;
  className?: string;
};

const chartConfig = {
  score: { label: "Score" },
  track: {
    label: "Track",
    theme: { light: "hsl(220 14% 96%)", dark: "hsl(220 13% 18%)" },
  },
  scoreGood: {
    label: "Good",
    theme: { light: "hsl(142 76% 36%)", dark: "hsl(142 70% 45%)" },
  },
  scoreWarn: {
    label: "Warning",
    theme: { light: "hsl(38 92% 50%)", dark: "hsl(38 92% 55%)" },
  },
  scoreBad: {
    label: "Bad",
    theme: { light: "hsl(0 84% 60%)", dark: "hsl(0 72% 51%)" },
  },
} satisfies ChartConfig;

function getScoreColorKey(s: number): "scoreGood" | "scoreWarn" | "scoreBad" {
  return s >= 80 ? "scoreGood" : s >= 50 ? "scoreWarn" : "scoreBad";
}

const scoreTextClass: Record<"scoreGood" | "scoreWarn" | "scoreBad", string> = {
  scoreGood: "text-green-600 dark:text-green-400",
  scoreWarn: "text-amber-600 dark:text-amber-400",
  scoreBad: "text-red-600 dark:text-red-400",
};

export function ReviewScoreGauge({ score, label = "Overall score", className }: ReviewScoreGaugeProps) {
  const clamped = Math.max(0, Math.min(100, score));
  const colorKey = getScoreColorKey(clamped);
  const data = [
    { name: "track", value: 100, fill: "var(--color-track)" },
    { name: "score", value: clamped, fill: `var(--color-${colorKey})` },
  ];

  return (
    <Card className={cn("overflow-hidden border-border/80", className)}>
      <CardHeader className="pb-1">
        <CardTitle className="text-center text-base font-semibold">{label}</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <ChartContainer config={chartConfig} className="mx-auto aspect-square h-[180px]">
          <RadialBarChart
            data={data}
            startAngle={90}
            endAngle={-270}
            innerRadius="65%"
            outerRadius="95%"
          >
            <RadialBar dataKey="value" cornerRadius={8} background />
          </RadialBarChart>
        </ChartContainer>
        <p className={cn("text-center text-2xl font-bold tabular-nums", scoreTextClass[colorKey])}>
          {score}/100
        </p>
      </CardContent>
    </Card>
  );
}
