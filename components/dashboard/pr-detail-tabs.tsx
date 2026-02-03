"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  parsedFiles: ParsedFile[];
  latestReview: Review;
};

export function PRDetailTabs({ repoFullName, githubPrId, parsedFiles, latestReview }: PRDetailTabsProps) {
  const [activeTab, setActiveTab] = useState("files");
  const [scrollToFilePath, setScrollToFilePath] = useState<string | null>(null);
  const [scrollToLine, setScrollToLine] = useState<number | null>(null);

  const onJumpToFile = useCallback((path: string, line?: number) => {
    setScrollToFilePath(path || null);
    setScrollToLine(line ?? null);
    setActiveTab("files");
  }, []);

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList>
        <TabsTrigger value="files">Files changed</TabsTrigger>
        <TabsTrigger value="review">AI Review</TabsTrigger>
      </TabsList>
      <TabsContent value="files" className="mt-4">
        <div className="rounded-lg border border-border bg-background">
          <div className="border-b border-border px-3 py-2 text-sm text-muted-foreground">
            <Link href={`https://github.com/${repoFullName}/pull/${githubPrId}`} target="_blank" rel="noopener noreferrer" className="hover:text-foreground hover:underline">
              View on GitHub →
            </Link>
          </div>
          <PRDiffViewer files={parsedFiles} className="max-h-[70vh]" scrollToFilePath={scrollToFilePath} scrollToLine={scrollToLine} />
        </div>
      </TabsContent>
      <TabsContent value="review" className="mt-4">
        <PRReviewPanel review={latestReview} onJumpToFile={onJumpToFile} />
      </TabsContent>
    </Tabs>
  );
}
