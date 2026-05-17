"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import type { ChartConfig } from "@/components/ui/chart";
import { Bar, BarChart, Cell, LabelList, XAxis, YAxis } from "recharts";
import { cn } from "@/lib/utils";

export type ReviewScoresChartProps = {
  overall: number;
  codeQuality?: number | null;
  security?: number | null;
  secrets?: number | null;
  performance?: number | null;
  maintainability?: number | null;
  className?: string;
};

const chartConfig = {
  score: { label: "Score" },
  overall: {
    label: "Overall",
    theme: { light: "hsl(142 76% 36%)", dark: "hsl(142 70% 45%)" },
  },
  codeQuality: {
    label: "Code quality",
    theme: { light: "hsl(221 83% 53%)", dark: "hsl(221 83% 58%)" },
  },
  security: {
    label: "Security",
    theme: { light: "hsl(0 84% 60%)", dark: "hsl(0 72% 51%)" },
  },
  secrets: {
    label: "Secrets risk",
    theme: { light: "hsl(38 92% 50%)", dark: "hsl(38 92% 55%)" },
  },
  performance: {
    label: "Performance",
    theme: { light: "hsl(262 83% 58%)", dark: "hsl(262 83% 62%)" },
  },
  maintainability: {
    label: "Maintainability",
    theme: { light: "hsl(173 80% 40%)", dark: "hsl(173 80% 45%)" },
  },
} satisfies ChartConfig;

export function ReviewScoresChart({
  overall,
  codeQuality,
  security,
  secrets,
  performance,
  maintainability,
  className,
}: ReviewScoresChartProps) {
  const data = [
    { name: "overall", score: overall, fill: "var(--color-overall)" },
    ...(codeQuality != null ? [{ name: "codeQuality", score: codeQuality, fill: "var(--color-codeQuality)" }] : []),
    ...(security != null ? [{ name: "security", score: security, fill: "var(--color-security)" }] : []),
    ...(secrets != null ? [{ name: "secrets", score: secrets, fill: "var(--color-secrets)" }] : []),
    ...(performance != null ? [{ name: "performance", score: performance, fill: "var(--color-performance)" }] : []),
    ...(maintainability != null ? [{ name: "maintainability", score: maintainability, fill: "var(--color-maintainability)" }] : []),
  ];

  if (data.length === 0) return null;

  return (
    <Card className={cn("border-border/80 overflow-visible", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">Scores</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[220px] w-full min-w-0 overflow-visible">
          <BarChart data={data} layout="vertical" margin={{ left: 0, right: 56 }}>
            <XAxis type="number" domain={[0, 100]} hide />
            <YAxis
              type="category"
              dataKey="name"
              tickFormatter={(value) => chartConfig[value as keyof typeof chartConfig]?.label ?? value}
              tickLine={false}
              axisLine={false}
              width={100}
            />
            <ChartTooltip content={<ChartTooltipContent hideLabel formatter={(v) => [`${v}/100`, "Score"]} />} />
            <Bar dataKey="score" radius={4} maxBarSize={28} minPointSize={4}>
              {data.map((entry, index) => (
                <Cell key={index} fill={entry.fill as string} />
              ))}
              <LabelList
                dataKey="score"
                position="right"
                formatter={(value: number) => `${value}/100`}
                className="fill-muted-foreground text-xs font-medium tabular-nums"
                style={{ overflow: "visible" }}
              />
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
