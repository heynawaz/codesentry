"use client";

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ChevronDown, ChevronRight, MessageSquare, MoreVertical, ArrowUp, Copy, Code, Expand, Minus } from "lucide-react";
import { FileIcon } from "@/lib/file-icon";
import { useState, useEffect, useCallback } from "react";
import { useTheme } from "next-themes";
import { motion } from "framer-motion";
import { Highlight } from "prism-react-renderer";
import type { ParsedFile } from "@/lib/diff-parser";
import { getLanguageFromPath } from "@/lib/syntax-highlight";
import { prismDiffDark, prismDiffLight } from "@/lib/prism-diff-theme";
import { cn } from "@/lib/utils";

// Load Prism and register languages (prism-setup sets global Prism before language components load)
import "@/lib/prism-languages";
import { Prism } from "@/lib/prism-setup";

function safeId(path: string): string {
  return path.replace(/\//g, "-").replace(/[^a-zA-Z0-9-_]/g, "_");
}

/** Renders a single line of code with optional syntax highlighting and preserved indentation. */
function DiffLineContent({ content, language, theme, className }: { content: string; language: string; theme: "light" | "dark"; className?: string }) {
  const code = content || " ";
  const lang = language && Prism.languages[language] ? language : "plain";

  if (lang === "plain") {
    return <span className={cn("whitespace-pre", className)}>{code}</span>;
  }

  const prismTheme = theme === "dark" ? prismDiffDark : prismDiffLight;
  return (
    <Highlight prism={Prism} code={code} language={lang} theme={prismTheme}>
      {({ tokens, getTokenProps }) => (
        <span className={cn("whitespace-pre", className)}>
          {(tokens[0] ?? []).map((token, i) => {
            const { key: tokenKey, ...tokenProps } = getTokenProps({ token, key: i });
            return <span key={(tokenKey as React.Key) ?? i} {...tokenProps} />;
          })}
        </span>
      )}
    </Highlight>
  );
}

type PRDiffViewerProps = {
  files: ParsedFile[];
  repoFullName?: string | null;
  headRef?: string | null;
  className?: string;
  scrollToFilePath?: string | null;
  scrollToLine?: number | null;
};

function DiffLine({ line, showOld, showNew, lineId, highlighted, language, resolvedTheme }: { line: ParsedFile["hunks"][0]["lines"][0]; showOld: boolean; showNew: boolean; lineId?: string; highlighted?: boolean; language: string; resolvedTheme: "light" | "dark" }) {
  const bg = line.type === "add" ? "bg-emerald-500/10 dark:bg-emerald-500/10" : line.type === "del" ? "bg-red-500/10 dark:bg-red-500/10" : "";
  return (
    <div id={lineId} className={cn("flex w-full min-w-min font-mono text-xs leading-relaxed py-0.5", line.type === "add" && "text-emerald-700 dark:text-emerald-400", line.type === "del" && "text-red-700 dark:text-red-400", highlighted && "ring-inset ring-2 ring-primary/50 bg-primary/10", bg)}>
      <span className="flex w-12 shrink-0 justify-end pr-3 text-muted-foreground tabular-nums select-none">{showOld ? line.oldLineNumber ?? "" : ""}</span>
      <span className="flex w-12 shrink-0 justify-end pr-3 text-muted-foreground tabular-nums select-none border-r border-border">{showNew ? line.newLineNumber ?? "" : ""}</span>
      <span className="w-4 shrink-0 pr-2 text-muted-foreground select-none">{line.type === "add" ? "+" : line.type === "del" ? "-" : " "}</span>
      <span className="min-w-min shrink-0 overflow-visible">
        <DiffLineContent content={line.content} language={language} theme={resolvedTheme} />
      </span>
    </div>
  );
}

function FileBlock({ file, scrollToLine, scrollToFilePath, repoFullName, headRef }: { file: ParsedFile; scrollToLine?: number | null; scrollToFilePath?: string | null; repoFullName?: string | null; headRef?: string | null }) {
  const { resolvedTheme } = useTheme();
  const isTargetFile = scrollToFilePath != null && (file.path === scrollToFilePath || file.path.endsWith(scrollToFilePath) || scrollToFilePath.endsWith(file.path));
  const [open, setOpen] = useState(true);
  const [viewed, setViewed] = useState(false);
  const [showFullView, setShowFullView] = useState(false);
  const [fullFileContent, setFullFileContent] = useState<string | null>(null);
  const [fullFileLoading, setFullFileLoading] = useState(false);
  const [fullFileError, setFullFileError] = useState<string | null>(null);
  const theme = (resolvedTheme === "dark" ? "dark" : "light") as "light" | "dark";

  useEffect(() => {
    if (!isTargetFile) return;
    const t = setTimeout(() => setOpen(true), 0);
    return () => clearTimeout(t);
  }, [isTargetFile]);

  const canExpandFull = !!repoFullName && !!headRef;

  const fetchFullFile = useCallback(async () => {
    if (!repoFullName?.trim() || !headRef?.trim()) {
      setFullFileError("Branch not available");
      return;
    }
    setFullFileLoading(true);
    setFullFileError(null);
    try {
      const { getFileContentAction } = await import("@/app/actions/github");
      const result = await getFileContentAction(repoFullName, file.path, headRef);
      if (result.ok) setFullFileContent(result.content);
      else setFullFileError(result.error);
    } catch {
      setFullFileError("Failed to load file");
    } finally {
      setFullFileLoading(false);
    }
  }, [repoFullName, file.path, headRef]);

  const toggleFullView = () => {
    setShowFullView((prev) => !prev);
  };

  useEffect(() => {
    if (showFullView && canExpandFull && fullFileContent === null && !fullFileLoading && !fullFileError) {
      void fetchFullFile();
    }
  }, [showFullView, canExpandFull, fullFileContent, fullFileLoading, fullFileError, fetchFullFile]);

  const added = file.hunks.reduce((a, h) => a + h.lines.filter((l) => l.type === "add").length, 0);
  const removed = file.hunks.reduce((a, h) => a + h.lines.filter((l) => l.type === "del").length, 0);
  const fileId = `diff-file-${safeId(file.path)}`;

  // Line numbers (in new file) that are additions — for full-file view diff highlighting
  const addedLineNumbers = new Set(
    file.hunks.flatMap((h) =>
      h.lines
        .filter((l) => l.type === "add")
        .map((l) => l.newLineNumber)
        .filter((n): n is number => n != null)
    )
  );

  const copyPath = () => {
    void navigator.clipboard.writeText(file.path);
  };

  const fullFileLines = fullFileContent?.split(/\r?\n/) ?? [];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.15 }} className="min-w-0">
      <Collapsible open={open} onOpenChange={setOpen} className="min-w-0 rounded-lg" id={fileId}>
        <div className="sticky top-0 z-10 flex items-center border-border bg-card border-b">
          <CollapsibleTrigger className="flex min-w-0 flex-1 cursor-pointer items-center gap-2 px-3 py-2.5 text-left text-sm font-medium hover:bg-muted/50 transition-colors">
            {open ? <ChevronDown className="size-4 shrink-0 text-muted-foreground" /> : <ChevronRight className="size-4 shrink-0 text-muted-foreground" />}
            <FileIcon path={file.path} />
            <span className="min-w-0 truncate">{file.path}</span>
            {file.oldPath && file.oldPath !== file.path && <span className="shrink-0 text-muted-foreground text-xs">← {file.oldPath}</span>}
          </CollapsibleTrigger>
          <span className="shrink-0 text-sm text-emerald-600 dark:text-emerald-400 font-medium">+{added}</span>
          <span className="shrink-0 text-sm text-red-600 dark:text-red-400 font-medium px-1">-{removed}</span>
          <div className="flex shrink-0 items-center gap-0.5 pr-2">
            {canExpandFull && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 gap-1 shrink-0 text-xs text-muted-foreground hover:text-foreground"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  toggleFullView();
                }}
                title={showFullView ? "Show only changes" : "Expand to full view"}
              >
                {showFullView ? <Minus className="size-3.5" /> : <Expand className="size-3.5" />}
              </Button>
            )}
            <Button variant="ghost" size="icon" className="size-7 rounded" aria-label="View file">
              <Code className="size-3.5 text-muted-foreground" />
            </Button>
            <Button variant="ghost" size="icon" className="size-7 rounded" onClick={copyPath} aria-label="Copy path">
              <Copy className="size-3.5 text-muted-foreground" />
            </Button>
            <Checkbox checked={viewed} onCheckedChange={(c) => setViewed(!!c)} className="rounded border-muted-foreground/50" aria-label="Mark as viewed" />
            <Button variant="ghost" size="icon" className="size-7 rounded" aria-label="Comments">
              <MessageSquare className="size-3.5 text-muted-foreground" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="size-7 rounded" aria-label="More options">
                  <MoreVertical className="size-3.5 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={copyPath}>Copy file path</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setViewed(true)}>Mark as viewed</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        <CollapsibleContent>
          <div className="border-t border-border bg-background overflow-x-auto min-w-0">
            {showFullView ? (
              <div className="min-h-[120px] bg-muted/20">
                {fullFileLoading && (
                  <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
                    <span className="animate-pulse">Loading full file…</span>
                  </div>
                )}
                {fullFileError && !fullFileLoading && <div className="px-4 py-4 text-sm text-destructive">{fullFileError}</div>}
                {!fullFileLoading && !fullFileError && fullFileLines.length > 0 && (
                  <div className="diff-full-file" data-language={getLanguageFromPath(file.path)}>
                    {fullFileLines.map((content, i) => {
                      const lineNum = i + 1;
                      const lineId = `diff-line-${safeId(file.path)}-${lineNum}`;
                      const isAddedLine = addedLineNumbers.has(lineNum);
                      const syntheticLine = {
                        type: (isAddedLine ? "add" : "context") as "add" | "context",
                        content,
                        oldLineNumber: lineNum,
                        newLineNumber: lineNum,
                      };
                      const highlighted = isTargetFile && scrollToLine != null && lineNum === scrollToLine;
                      return <DiffLine key={lineNum} line={syntheticLine} showOld showNew lineId={lineId} highlighted={highlighted} language={getLanguageFromPath(file.path)} resolvedTheme={theme} />;
                    })}
                  </div>
                )}
              </div>
            ) : (
              file.hunks.map((hunk, hi) => {
                const linesToShow = hunk.lines.filter((l) => l.type === "add" || l.type === "del");
                return (
                  <div key={hi} className="border-b border-border last:border-b-0">
                    <div className="flex items-center gap-2 bg-primary/5 dark:bg-primary/10 px-3 py-1.5 font-mono text-xs text-muted-foreground border-b border-border/50">
                      <Button variant="ghost" size="icon" className="size-6 rounded shrink-0" aria-label="Previous change">
                        <ArrowUp className="size-3.5" />
                      </Button>
                      <span>
                        @@ -{hunk.oldStart},{hunk.oldLines} +{hunk.newStart},{hunk.newLines} @@
                      </span>
                    </div>
                    <div>
                      {linesToShow.map((line, li) => {
                        const lineNum = line.newLineNumber ?? line.oldLineNumber ?? li;
                        const lineId = `diff-line-${safeId(file.path)}-${lineNum}`;
                        const highlighted = isTargetFile && scrollToLine != null && lineNum === scrollToLine;
                        return <DiffLine key={`${hi}-${li}`} line={line} showOld={line.type !== "add"} showNew={line.type !== "del"} lineId={lineId} highlighted={highlighted} language={getLanguageFromPath(file.path)} resolvedTheme={theme} />;
                      })}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </motion.div>
  );
}

export function PRDiffViewer({ files, repoFullName = null, headRef = null, className, scrollToFilePath = null, scrollToLine = null }: PRDiffViewerProps) {
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
    <div className={cn("h-full w-full overflow-y-auto overflow-x-hidden min-w-0", className)}>
      <div className="min-w-0 min-h-full space-y-1 p-2">
        {files.map((file, i) => (
          <FileBlock key={`${file.path}-${i}`} file={file} scrollToFilePath={scrollToFilePath} scrollToLine={scrollToLine} repoFullName={repoFullName} headRef={headRef} />
        ))}
      </div>
    </div>
  );
}
