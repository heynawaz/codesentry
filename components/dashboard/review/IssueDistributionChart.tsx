"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import type { ChartConfig } from "@/components/ui/chart";
import { Cell, Pie, PieChart } from "recharts";
import { cn } from "@/lib/utils";
import { Shield, Lightbulb, KeyRound } from "lucide-react";

export type IssueDistributionChartProps = {
  securityCount: number;
  secretsCount: number;
  improvementCount: number;
  className?: string;
};

const chartConfig = {
  security: {
    label: "Security",
    theme: { light: "hsl(0 84% 60%)", dark: "hsl(0 72% 51%)" },
  },
  secrets: {
    label: "Secrets",
    theme: { light: "hsl(38 92% 50%)", dark: "hsl(38 92% 55%)" },
  },
  improvement: {
    label: "Suggestions",
    theme: { light: "hsl(221 83% 53%)", dark: "hsl(221 83% 58%)" },
  },
} satisfies ChartConfig;

const KIND_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  security: Shield,
  secrets: KeyRound,
  improvement: Lightbulb,
};

export function IssueDistributionChart({
  securityCount,
  secretsCount,
  improvementCount,
  className,
}: IssueDistributionChartProps) {
  const data = [
    { name: "security", value: securityCount, fill: "var(--color-security)" },
    { name: "secrets", value: secretsCount, fill: "var(--color-secrets)" },
    { name: "improvement", value: improvementCount, fill: "var(--color-improvement)" },
  ].filter((d) => d.value > 0);

  if (data.length === 0) return null;

  return (
    <Card className={cn("overflow-hidden border-border/80", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">Issues by type</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="mx-auto aspect-square h-[200px]">
          <PieChart>
            <ChartTooltip content={<ChartTooltipContent nameKey="name" />} />
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius={52}
              strokeWidth={2}
              paddingAngle={2}
            >
              {data.map((entry, index) => (
                <Cell key={index} fill={entry.fill} stroke="var(--background)" />
              ))}
            </Pie>
          </PieChart>
        </ChartContainer>
        <div className="mt-2 flex flex-wrap justify-center gap-4 text-xs">
          {data.map((entry) => {
            const Icon = KIND_ICONS[entry.name];
            const label = chartConfig[entry.name as keyof typeof chartConfig]?.label ?? entry.name;
            return (
              <div key={entry.name} className="flex items-center gap-1.5">
                {Icon && <Icon className="size-3.5 text-muted-foreground" />}
                <span className="text-muted-foreground">{label}</span>
                <span className="font-medium tabular-nums">{entry.value}</span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
