"use client";

import { useState, useCallback, useMemo } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { PRDiffFileTree, type ChangeTypeFilter } from "@/components/dashboard/pr-diff-file-tree";
import { PRReviewPanel } from "@/components/dashboard/pr-review-panel";
import { Spinner } from "@/components/ui/spinner";
import type { ParsedFile } from "@/lib/diff";

function filterFilesByChangeType(files: ParsedFile[], changeType: ChangeTypeFilter): ParsedFile[] {
  if (changeType === "all") return files;
  return files.filter((f) => {
    const added = f.hunks.reduce((a, h) => a + h.lines.filter((l) => l.type === "add").length, 0);
    const removed = f.hunks.reduce((a, h) => a + h.lines.filter((l) => l.type === "del").length, 0);
    if (changeType === "added") return added > 0 && removed === 0;
    if (changeType === "modified") return added > 0 && removed > 0;
    if (changeType === "deleted") return added === 0 && removed > 0;
    return true;
  });
}

const PRDiffViewer = dynamic(() => import("@/components/dashboard/pr-diff-viewer").then((m) => ({ default: m.PRDiffViewer })), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full flex-col items-center justify-center gap-3 text-muted-foreground">
      <Spinner className="size-8" />
      <span className="text-sm font-medium">Loading diff…</span>
    </div>
  ),
});

type Issue = {
  id: string;
  kind: string;
  category?: string | null;
  title: string;
  description: string | null;
  severity: string | null;
  suggestion?: string | null;
  filePath: string | null;
  lineStart: number | null;
  lineEnd: number | null;
  snippet: string | null;
};

type Review = {
  id: string;
  status: "pending" | "completed" | "failed";
  qualityScore: number;
  codeQualityScore?: number;
  securityScore?: number;
  secretsScore?: number;
  performanceScore?: number;
  maintainabilityScore?: number;
  summary: string | null;
  executionTimeMs?: number | null;
  scoreBreakdown?: unknown;
  issues: Issue[];
} | null;

type PRDetailTabsProps = {
  repoFullName: string;
  githubPrId: number;
  headRef: string | null;
  parsedFiles: ParsedFile[];
  latestReview: Review;
};

export function PRDetailTabs({ repoFullName, githubPrId, headRef, parsedFiles, latestReview }: PRDetailTabsProps) {
  const [activeTab, setActiveTab] = useState("files");
  const [scrollToFilePath, setScrollToFilePath] = useState<string | null>(null);
  const [scrollToLine, setScrollToLine] = useState<number | null>(null);
  const [changeType, setChangeType] = useState<ChangeTypeFilter>("all");
  const [expandedLineKey, setExpandedLineKey] = useState<string | null>(null);

  const filteredFiles = useMemo(
    () => filterFilesByChangeType(parsedFiles, changeType),
    [parsedFiles, changeType]
  );

  const pathSet = useMemo(() => new Set(filteredFiles.map((f) => f.path)), [filteredFiles]);
  const effectivePath =
    scrollToFilePath && pathSet.has(scrollToFilePath) ? scrollToFilePath : filteredFiles[0]?.path ?? null;

  const filteredReviewIssues = useMemo(() => {
    if (!latestReview?.issues?.length) return null;
    return latestReview.issues.map((i) => ({
      filePath: i.filePath,
      lineStart: i.lineStart,
      lineEnd: i.lineEnd,
      kind: i.kind,
      category: i.category,
      severity: i.severity,
      title: i.title,
      description: i.description,
      suggestion: i.suggestion,
    }));
  }, [latestReview]);

  const onJumpToFile = useCallback((path: string, line?: number) => {
    setScrollToFilePath(path || null);
    setScrollToLine(line ?? null);
    setActiveTab("files");
  }, []);

  const githubPrUrl = `https://github.com/${repoFullName}/pull/${githubPrId}`;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }} className="w-full">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <TabsList className="bg-muted/50 p-0.5 rounded-xl">
            <TabsTrigger value="files" className="rounded-lg data-[state=active]:shadow-sm">
              Files changed
            </TabsTrigger>
            <TabsTrigger value="review" className="rounded-lg data-[state=active]:shadow-sm">
              AI Review
            </TabsTrigger>
          </TabsList>
          <Link href={githubPrUrl} target="_blank" rel="noopener noreferrer" className="cursor-pointer text-sm text-muted-foreground hover:text-foreground hover:underline transition-colors shrink-0">
            View on GitHub →
          </Link>
        </div>
        <TabsContent value="files" className="mt-4 w-full min-w-0">
          <AnimatePresence mode="wait">
            <motion.div key="files" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.2 }} className="h-[calc(100vh-15rem)] w-full min-w-0 overflow-hidden rounded-xl border border-border bg-background shadow-sm">
              <ResizablePanelGroup direction="horizontal" className="h-full w-full">
                <ResizablePanel defaultSize={22} minSize={16} maxSize={45} className="min-w-0">
                  <PRDiffFileTree
                    files={filteredFiles}
                    selectedPath={effectivePath}
                    onSelectFile={(path) => {
                      setScrollToFilePath(path);
                      setScrollToLine(null);
                    }}
                    changeType={changeType}
                    onChangeType={setChangeType}
                    className="h-full w-full"
                  />
                </ResizablePanel>
                <ResizableHandle withHandle className="shrink-0" />
                <ResizablePanel defaultSize={78} minSize={50} className="min-w-0">
                  <div className="h-full w-full overflow-hidden">
                    <PRDiffViewer
                      files={filteredFiles}
                      repoFullName={repoFullName}
                      headRef={headRef}
                      className="h-full w-full"
                      scrollToFilePath={effectivePath}
                      scrollToLine={scrollToLine}
                      reviewIssues={filteredReviewIssues}
                      expandedLineKey={expandedLineKey}
                      onExpandedLineChange={setExpandedLineKey}
                    />
                  </div>
                </ResizablePanel>
              </ResizablePanelGroup>
            </motion.div>
          </AnimatePresence>
        </TabsContent>
        <TabsContent value="review" className="mt-4">
          <AnimatePresence mode="wait">
            <motion.div key="review" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.2 }}>
              <PRReviewPanel review={latestReview} onJumpToFile={onJumpToFile} />
            </motion.div>
          </AnimatePresence>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
