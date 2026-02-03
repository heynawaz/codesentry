"use client";

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { ChevronDown, ChevronRight, FileCode } from "lucide-react";
import { useState, useEffect } from "react";
import type { ParsedFile } from "@/lib/diff-parser";
import { cn } from "@/lib/utils";

function safeId(path: string): string {
  return path.replace(/\//g, "-").replace(/[^a-zA-Z0-9-_]/g, "_");
}

type PRDiffViewerProps = {
  files: ParsedFile[];
  className?: string;
  /** When set, scroll to this file (and optionally line) and highlight. */
  scrollToFilePath?: string | null;
  scrollToLine?: number | null;
};

function DiffLine({ line, showOld, showNew, lineId, highlighted }: { line: ParsedFile["hunks"][0]["lines"][0]; showOld: boolean; showNew: boolean; lineId?: string; highlighted?: boolean }) {
  const bg = line.type === "add" ? "bg-emerald-500/10 dark:bg-emerald-500/10" : line.type === "del" ? "bg-red-500/10 dark:bg-red-500/10" : "";
  return (
    <div id={lineId} className={cn("flex font-mono text-sm leading-relaxed", line.type === "add" && "text-emerald-700 dark:text-emerald-400", line.type === "del" && "text-red-700 dark:text-red-400", highlighted && "ring-inset ring-2 ring-primary/50 bg-primary/10", bg)}>
      <span className="flex w-12 shrink-0 justify-end pr-3 text-muted-foreground tabular-nums select-none">{showOld ? line.oldLineNumber ?? "" : ""}</span>
      <span className="flex w-12 shrink-0 justify-end pr-3 text-muted-foreground tabular-nums select-none border-r border-border">{showNew ? line.newLineNumber ?? "" : ""}</span>
      <span className="w-4 shrink-0 pr-2 text-muted-foreground">{line.type === "add" ? "+" : line.type === "del" ? "-" : " "}</span>
      <span className="min-w-0 break-all">{line.content || " "}</span>
    </div>
  );
}

function FileBlock({ file, scrollToLine, scrollToFilePath }: { file: ParsedFile; scrollToLine?: number | null; scrollToFilePath?: string | null }) {
  const isTargetFile = scrollToFilePath != null && (file.path === scrollToFilePath || file.path.endsWith(scrollToFilePath) || scrollToFilePath.endsWith(file.path));
  const [open, setOpen] = useState(true);

  useEffect(() => {
    if (isTargetFile) setOpen(true);
  }, [isTargetFile]);
  const added = file.hunks.reduce((a, h) => a + h.lines.filter((l) => l.type === "add").length, 0);
  const removed = file.hunks.reduce((a, h) => a + h.lines.filter((l) => l.type === "del").length, 0);
  const fileId = `diff-file-${safeId(file.path)}`;

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="rounded-md border border-border overflow-hidden" id={fileId}>
      <CollapsibleTrigger className="flex w-full items-center gap-2 bg-muted/50 px-3 py-2 text-left text-sm font-medium hover:bg-muted/70">
        {open ? <ChevronDown className="size-4 shrink-0" /> : <ChevronRight className="size-4 shrink-0" />}
        <FileCode className="size-4 shrink-0 text-muted-foreground" />
        <span className="min-w-0 truncate">{file.path}</span>
        {file.oldPath && file.oldPath !== file.path && <span className="shrink-0 text-muted-foreground">← {file.oldPath}</span>}
        <span className="ml-auto shrink-0 text-emerald-600 dark:text-emerald-400">+{added}</span>
        <span className="shrink-0 text-red-600 dark:text-red-400">-{removed}</span>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="border-t border-border bg-background">
          {file.hunks.map((hunk, hi) => (
            <div key={hi} className="border-b border-border last:border-b-0">
              <div className="bg-muted/30 px-4 py-1 font-mono text-xs text-muted-foreground">
                @@ -{hunk.oldStart},{hunk.oldLines} +{hunk.newStart},{hunk.newLines} @@
              </div>
              <div className="divide-y divide-border/50">
                {hunk.lines.map((line, li) => {
                  const lineNum = line.newLineNumber ?? line.oldLineNumber ?? li;
                  const lineId = `diff-line-${safeId(file.path)}-${lineNum}`;
                  const highlighted = isTargetFile && scrollToLine != null && lineNum === scrollToLine;
                  return <DiffLine key={li} line={line} showOld={line.type !== "add"} showNew={line.type !== "del"} lineId={lineId} highlighted={highlighted} />;
                })}
              </div>
            </div>
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

export function PRDiffViewer({ files, className, scrollToFilePath = null, scrollToLine = null }: PRDiffViewerProps) {
  useEffect(() => {
    if (!scrollToFilePath) return;
    const fileId = `diff-file-${safeId(scrollToFilePath)}`;
    const fileEl = document.getElementById(fileId);
    if (fileEl) {
      fileEl.scrollIntoView({ behavior: "smooth", block: "start" });
      const trigger = fileEl.querySelector("[data-state]") ?? fileEl.querySelector("button");
      if (trigger?.getAttribute("aria-expanded") === "false") {
        (trigger as HTMLElement).click();
      }
    }
    if (scrollToLine != null) {
      const lineId = `diff-line-${safeId(scrollToFilePath)}-${scrollToLine}`;
      requestAnimationFrame(() => {
        const lineEl = document.getElementById(lineId);
        if (lineEl) {
          lineEl.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      });
    }
  }, [scrollToFilePath, scrollToLine]);

  if (files.length === 0) {
    return <div className={cn("rounded-md border border-dashed border-border p-8 text-center text-muted-foreground", className)}>No diff to display. The PR may have no file changes or the diff could not be loaded.</div>;
  }

  return (
    <ScrollArea className={cn("w-full", className)}>
      <div className="space-y-1 p-2">
        {files.map((file, i) => (
          <FileBlock key={`${file.path}-${i}`} file={file} scrollToFilePath={scrollToFilePath} scrollToLine={scrollToLine} />
        ))}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
}
