"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowDown, ArrowUp, ChevronDown, FileStack, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import * as Recharts from "recharts";

const chartData = [
  { date: "Apr 4", mobile: 120, desktop: 180 },
  { date: "Apr 10", mobile: 140, desktop: 200 },
  { date: "Apr 16", mobile: 160, desktop: 220 },
  { date: "Apr 22", mobile: 155, desktop: 210 },
  { date: "Apr 28", mobile: 180, desktop: 243 },
  { date: "May 4", mobile: 190, desktop: 250 },
  { date: "May 10", mobile: 210, desktop: 270 },
  { date: "May 16", mobile: 200, desktop: 265 },
  { date: "May 22", mobile: 230, desktop: 290 },
  { date: "May 29", mobile: 245, desktop: 310 },
  { date: "Jun 4", mobile: 260, desktop: 330 },
  { date: "Jun 10", mobile: 250, desktop: 320 },
  { date: "Jun 16", mobile: 270, desktop: 340 },
  { date: "Jun 22", mobile: 280, desktop: 350 },
  { date: "Jun 30", mobile: 290, desktop: 360 },
];

const chartConfig = {
  mobile: { label: "Mobile", color: "hsl(var(--chart-1))" },
  desktop: { label: "Desktop", color: "hsl(var(--chart-2))" },
  date: { label: "Date" },
};

const metrics = [
  {
    title: "Total Revenue",
    value: "$1,250.00",
    change: "+12.5%",
    trend: "up",
    description: "Trending up this month",
    detail: "Visitors for the last 6 months",
  },
  {
    title: "New Customers",
    value: "1,234",
    change: "-20%",
    trend: "down",
    description: "Down 20% this period",
    detail: "Acquisition needs attention",
  },
  {
    title: "Active Accounts",
    value: "45,678",
    change: "+12.5%",
    trend: "up",
    description: "Strong user retention",
    detail: "Engagement exceed targets",
  },
  {
    title: "Growth Rate",
    value: "4.5%",
    change: "+4.5%",
    trend: "up",
    description: "Steady performance increase",
    detail: "Meets growth projections",
  },
];

const tableData = [
  { header: "Executive Summary", sectionType: "Overview", status: "Draft", target: "Q2", limit: "—", reviewer: "—" },
  { header: "Market Analysis", sectionType: "Research", status: "Review", target: "Q2", limit: "—", reviewer: "Jane" },
  { header: "Financial Projections", sectionType: "Data", status: "Approved", target: "Q2", limit: "—", reviewer: "—" },
];

export function DashboardOverview() {
  const [timeframe, setTimeframe] = useState("3m");

  return (
    <div className="space-y-6">
      {/* Page header */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileStack className="size-5 text-muted-foreground" />
          <FileText className="size-5 text-muted-foreground" />
          <h1 className="text-xl font-semibold">Documents</h1>
        </div>
        <Link href="https://github.com" target="_blank" rel="noopener noreferrer" className="cursor-pointer text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
          GitHub
        </Link>
      </motion.div>

      {/* Metric cards */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.05 }} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric, i) => (
          <motion.div key={metric.title} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 + i * 0.05 }}>
            <Card className="rounded-xl border bg-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{metric.title}</CardTitle>
                <span className={`flex items-center gap-0.5 text-xs font-medium ${metric.trend === "up" ? "text-emerald-600" : "text-red-600"}`}>
                  {metric.change}
                  {metric.trend === "up" ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" />}
                </span>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{metric.value}</p>
                <p className="mt-1 text-xs text-muted-foreground">{metric.description}</p>
                <p className="mt-0.5 text-xs text-muted-foreground/80">{metric.detail}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Total Visitors chart */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <Card className="rounded-xl border bg-card">
          <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Total Visitors</CardTitle>
              <p className="text-sm text-muted-foreground">Total for the last 3 months</p>
            </div>
            <div className="flex gap-2">
              {[
                { id: "3m", label: "Last 3 months" },
                { id: "30d", label: "Last 30 days" },
                { id: "7d", label: "Last 7 days" },
              ].map((opt) => (
                <Button key={opt.id} variant={timeframe === opt.id ? "secondary" : "ghost"} size="sm" className="rounded-lg" onClick={() => setTimeframe(opt.id)}>
                  {opt.label}
                </Button>
              ))}
            </div>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[280px] w-full">
              <Recharts.AreaChart data={chartData} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
                <defs>
                  <linearGradient id="fillMobile" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-mobile)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="var(--color-mobile)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="fillDesktop" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-desktop)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="var(--color-desktop)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Recharts.XAxis dataKey="date" tickLine={false} axisLine={false} />
                <Recharts.YAxis tickLine={false} axisLine={false} tickFormatter={(v) => `${v}`} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Recharts.Area type="monotone" dataKey="mobile" stroke="var(--color-mobile)" fill="url(#fillMobile)" strokeWidth={2} />
                <Recharts.Area type="monotone" dataKey="desktop" stroke="var(--color-desktop)" fill="url(#fillDesktop)" strokeWidth={2} />
              </Recharts.AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </motion.div>

      {/* Table section */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
        <Card className="rounded-xl border bg-card">
          <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-4">
            <Tabs defaultValue="outline" className="w-full sm:w-auto">
              <TabsList className="rounded-lg bg-muted/50 p-0.5">
                <TabsTrigger value="outline" className="rounded-lg data-[state=active]:bg-background">
                  Outline
                </TabsTrigger>
                <TabsTrigger value="past" className="rounded-lg data-[state=active]:bg-background gap-1">
                  Past Performance
                  <Badge variant="secondary" className="ml-1 text-[10px] px-1.5">
                    3
                  </Badge>
                </TabsTrigger>
                <TabsTrigger value="personnel" className="rounded-lg data-[state=active]:bg-background gap-1">
                  Key Personnel
                  <Badge variant="secondary" className="ml-1 text-[10px] px-1.5">
                    2
                  </Badge>
                </TabsTrigger>
                <TabsTrigger value="focus" className="rounded-lg data-[state=active]:bg-background">
                  Focus Documents
                </TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="rounded-lg gap-1">
                Customize Columns
                <ChevronDown className="size-4" />
              </Button>
              <Button size="sm" className="rounded-lg gap-1">
                + Add Section
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="w-12">
                    <Checkbox />
                  </TableHead>
                  <TableHead>Header</TableHead>
                  <TableHead>Section Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Target</TableHead>
                  <TableHead>Limit</TableHead>
                  <TableHead>Reviewer</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tableData.map((row) => (
                  <TableRow key={row.header}>
                    <TableCell>
                      <Checkbox />
                    </TableCell>
                    <TableCell className="font-medium">{row.header}</TableCell>
                    <TableCell>{row.sectionType}</TableCell>
                    <TableCell>{row.status}</TableCell>
                    <TableCell>{row.target}</TableCell>
                    <TableCell>{row.limit}</TableCell>
                    <TableCell>{row.reviewer}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
