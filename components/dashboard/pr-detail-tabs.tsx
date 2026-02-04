"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PRDiffFileTree } from "@/components/dashboard/pr-diff-file-tree";
import { PRDiffViewer } from "@/components/dashboard/pr-diff-viewer";
import { PRReviewPanel } from "@/components/dashboard/pr-review-panel";
import type { ParsedFile } from "@/lib/diff-parser";

type Issue = {
  id: string;
  kind: string;
  title: string;
  description: string | null;
  severity: string | null;
  filePath: string | null;
  lineStart: number | null;
  lineEnd: number | null;
  snippet: string | null;
};

type Review = {
  id: string;
  qualityScore: number;
  summary: string | null;
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
            <motion.div key="files" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.2 }} className="flex h-[70vh] w-full min-w-0 overflow-hidden rounded-xl border border-border bg-background shadow-sm">
              <PRDiffFileTree
                files={parsedFiles}
                selectedPath={scrollToFilePath}
                onSelectFile={(path) => {
                  setScrollToFilePath(path);
                  setScrollToLine(null);
                }}
                className="h-full w-64 shrink-0"
              />
              <div className="min-h-0 min-w-0 flex-1 border-l border-border overflow-hidden">
                <PRDiffViewer files={parsedFiles} repoFullName={repoFullName} headRef={headRef} className="h-full w-full" scrollToFilePath={scrollToFilePath} scrollToLine={scrollToLine} />
              </div>
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
