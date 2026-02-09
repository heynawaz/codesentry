"use client";

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { InlineAIPanel } from "@/components/dashboard/review";
import { ChevronDown, ChevronRight, MessageSquare, MoreVertical, ArrowUp, Copy, Code, Expand, Minus, AlertCircle } from "lucide-react";
import { FileIcon } from "@/components/ui/file-icon";
import { useState, useEffect, useCallback, memo, useMemo } from "react";
import { useTheme } from "next-themes";
import { Light as SyntaxHighlighter } from "react-syntax-highlighter";
import githubGist from "react-syntax-highlighter/dist/esm/styles/hljs/github-gist";
import atomOneDark from "react-syntax-highlighter/dist/esm/styles/hljs/atom-one-dark";

const githubGistStyle = {
  ...githubGist,
  hljs: { ...githubGist.hljs, background: "transparent" },
  "hljs-meta-keyword": { color: "#d73a49" },
  "hljs-meta-string": { color: "#032f62" },
  "hljs-symbol": { color: "#0086b3" },
  "hljs-tag": { color: "#22863a" },
  "hljs-name": { color: "#6f42c1" },
  "hljs-attr": { color: "#005cc5" },
};

const atomOneDarkStyle = {
  ...atomOneDark,
  hljs: { ...atomOneDark.hljs, background: "transparent" },
  "hljs-meta-keyword": { color: "#c678dd" },
  "hljs-tag": { color: "#e6c07b" },
  "hljs-name": { color: "#e06c75" },
  "hljs-attr": { color: "#d19a66" },
};
import { getLanguageFromPath, type ParsedFile } from "@/lib/diff";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// Register languages so the Light (lowlight) build can highlight them.
// Register xml first so typescript/javascript JSX sublanguages resolve.
import xml from "react-syntax-highlighter/dist/esm/languages/hljs/xml";
import typescript from "react-syntax-highlighter/dist/esm/languages/hljs/typescript";
import javascript from "react-syntax-highlighter/dist/esm/languages/hljs/javascript";
import css from "react-syntax-highlighter/dist/esm/languages/hljs/css";
import scss from "react-syntax-highlighter/dist/esm/languages/hljs/scss";
import json from "react-syntax-highlighter/dist/esm/languages/hljs/json";
import markdown from "react-syntax-highlighter/dist/esm/languages/hljs/markdown";
import yaml from "react-syntax-highlighter/dist/esm/languages/hljs/yaml";
import bash from "react-syntax-highlighter/dist/esm/languages/hljs/bash";
import python from "react-syntax-highlighter/dist/esm/languages/hljs/python";
import ruby from "react-syntax-highlighter/dist/esm/languages/hljs/ruby";
import go from "react-syntax-highlighter/dist/esm/languages/hljs/go";
import rust from "react-syntax-highlighter/dist/esm/languages/hljs/rust";
import java from "react-syntax-highlighter/dist/esm/languages/hljs/java";
import cpp from "react-syntax-highlighter/dist/esm/languages/hljs/cpp";
import c from "react-syntax-highlighter/dist/esm/languages/hljs/c";
import sql from "react-syntax-highlighter/dist/esm/languages/hljs/sql";

const registerLang = (SyntaxHighlighter as unknown as { registerLanguage: (name: string, lang: unknown) => void }).registerLanguage;
registerLang("xml", xml);
registerLang("markup", xml);
registerLang("typescript", typescript);
registerLang("tsx", typescript);
registerLang("javascript", javascript);
registerLang("jsx", javascript);
registerLang("css", css);
registerLang("scss", scss);
registerLang("json", json);
registerLang("markdown", markdown);
registerLang("yaml", yaml);
registerLang("bash", bash);
registerLang("python", python);
registerLang("ruby", ruby);
registerLang("go", go);
registerLang("rust", rust);
registerLang("java", java);
registerLang("cpp", cpp);
registerLang("c", c);
registerLang("sql", sql);

const SUPPORTED_LANGUAGES = new Set(["typescript", "tsx", "javascript", "jsx", "css", "scss", "json", "markdown", "yaml", "bash", "python", "ruby", "go", "rust", "java", "cpp", "c", "sql", "html", "xml", "markup"]);

function safeId(path: string): string {
  return path.replace(/\//g, "-").replace(/[^a-zA-Z0-9-_]/g, "_");
}

/** Issue from AI review to show on a specific line. */
export type DiffReviewIssue = {
  kind: string;
  category?: string | null;
  severity: string | null;
  title: string;
  description?: string | null;
  suggestion?: string | null;
  snippet?: string | null;
  fixedCode?: string | null;
};

/** Renders a single line of code with syntax highlighting (GitHub-style in light, Atom One Dark in dark). */
const DiffLineContent = memo(function DiffLineContent({ content, language, theme, className }: { content: string; language: string; theme: "light" | "dark"; className?: string }) {
  const code = content || " ";
  let lang = language && SUPPORTED_LANGUAGES.has(language) ? language : "plain";

  if (lang === "plain") {
    return <span className={cn("whitespace-pre", className)}>{code}</span>;
  }

  // Use XML grammar for lines that are clearly JSX/HTML so tags and attributes get highlighted
  const trimmed = code.trim();
  if ((lang === "tsx" || lang === "jsx") && (trimmed.startsWith("<") || trimmed.startsWith("</"))) {
    lang = "xml";
  }

  const style = theme === "dark" ? atomOneDarkStyle : githubGistStyle;
  return (
    <span className={cn("diff-line-code", className)}>
      <SyntaxHighlighter language={lang} style={style} useInlineStyles={true} PreTag="span" codeTagProps={{ className: "whitespace-pre", style: { background: "transparent", padding: 0 } }} customStyle={{ background: "transparent", padding: 0, margin: 0, fontSize: "inherit" }} showLineNumbers={false} wrapLongLines className="!m-0 !p-0 inline border-0">
        {code}
      </SyntaxHighlighter>
    </span>
  );
});

type PRDiffViewerProps = {
  files: ParsedFile[];
  repoFullName?: string | null;
  headRef?: string | null;
  className?: string;
  scrollToFilePath?: string | null;
  scrollToLine?: number | null;
  reviewIssues?: ReviewIssueForDiff[] | null;
  expandedLineKey?: string | null;
  onExpandedLineChange?: (key: string | null) => void;
};

/** Severity: left border + row highlight so the line stands out on the diff. */
function issueBorderClass(severity: string | null): string {
  if (severity === "high" || severity === "critical") return "border-l-4 border-l-red-500 dark:border-l-red-400 bg-[var(--diff-issue-high-bg)]";
  if (severity === "medium") return "border-l-4 border-l-amber-500 dark:border-l-amber-400 bg-[var(--diff-issue-medium-bg)]";
  return "border-l-4 border-l-muted-foreground/50 bg-[var(--diff-issue-low-bg)]";
}

/** Extra highlight on the code span so the exact code to fix is obvious. */
function issueCodeHighlightClass(severity: string | null): string {
  if (severity === "high" || severity === "critical") return "rounded-r border-l-2 border-l-red-500/60 dark:border-l-red-400/60 bg-red-500/5 dark:bg-red-500/10";
  if (severity === "medium") return "rounded-r border-l-2 border-l-amber-500/60 dark:border-l-amber-400/60 bg-amber-500/5 dark:bg-amber-500/10";
  return "rounded-r border-l-2 border-l-muted-foreground/40 bg-muted/30";
}

/** Single diff line – GitHub PR style. Optional review-issue marker; click opens InlineAIPanel in Popover. */
const DiffLine = memo(function DiffLine({
  line,
  showOld,
  showNew,
  lineId,
  highlighted,
  language,
  resolvedTheme,
  lineIssues,
  lineKey,
  isExpanded,
  onExpandedChange,
}: {
  line: ParsedFile["hunks"][0]["lines"][0];
  showOld: boolean;
  showNew: boolean;
  lineId?: string;
  highlighted?: boolean;
  language: string;
  resolvedTheme: "light" | "dark";
  lineIssues?: DiffReviewIssue[];
  lineKey?: string;
  isExpanded?: boolean;
  onExpandedChange?: (open: boolean) => void;
}) {
  const isAdd = line.type === "add";
  const isDel = line.type === "del";
  const rowBg = isAdd ? "bg-[var(--diff-add-bg)]" : isDel ? "bg-[var(--diff-del-bg)]" : "";
  const oldNumBg = isDel ? "bg-[var(--diff-del-num-bg)]" : "";
  const newNumBg = isAdd ? "bg-[var(--diff-add-num-bg)]" : "";
  const oldNumFg = isDel ? "text-[var(--diff-del-fg)]" : "text-muted-foreground";
  const newNumFg = isAdd ? "text-[var(--diff-add-fg)]" : "text-muted-foreground";
  const signFg = isAdd ? "text-[var(--diff-add-fg)]" : isDel ? "text-[var(--diff-del-fg)]" : "text-muted-foreground";
  const hasIssues = lineIssues && lineIssues.length > 0;
  const worstSeverity = hasIssues ? lineIssues.reduce((s, i) => (i.severity === "high" || i.severity === "critical" ? i.severity : s), null as string | null) : null;
  const issueSeverity = worstSeverity ?? lineIssues?.[0]?.severity ?? null;

  const lineEl = (
    <div
      id={lineId}
      className={cn(
        "flex w-full min-w-min font-mono text-xs leading-relaxed py-0",
        !hasIssues && rowBg,
        highlighted && "ring-inset ring-2 ring-primary/50 bg-primary/10",
        hasIssues && issueBorderClass(issueSeverity),
        hasIssues && lineKey && "cursor-pointer hover:opacity-95"
      )}
      data-issue-line={hasIssues ? "true" : undefined}
      title={hasIssues && lineKey ? "Click to see issue details and suggested fix" : undefined}
    >
      {hasIssues && (
        <span className="flex shrink-0 items-center pl-1 pr-1.5 text-amber-600 dark:text-amber-400" title="AI review issue – click for details">
          <AlertCircle className="size-3.5" aria-hidden />
        </span>
      )}
      <span className={cn("flex w-12 shrink-0 justify-end pr-3 tabular-nums select-none border-r border-border/50", oldNumBg, oldNumFg)}>{showOld ? (line.oldLineNumber ?? "") : ""}</span>
      <span className={cn("flex w-12 shrink-0 justify-end pr-3 tabular-nums select-none border-r border-border/50", newNumBg, newNumFg)}>{showNew ? (line.newLineNumber ?? "") : ""}</span>
      <span className={cn("w-4 shrink-0 pr-2 select-none", signFg)}>{isAdd ? "+" : isDel ? "-" : " "}</span>
      <span
        className={cn(
          "min-w-0 flex-1 overflow-x-auto text-foreground py-0.5 pl-1",
          hasIssues && issueCodeHighlightClass(issueSeverity)
        )}
      >
        <DiffLineContent content={line.content} language={language} theme={resolvedTheme} />
      </span>
    </div>
  );

  if (hasIssues && lineKey) {
    return (
      <Popover open={isExpanded} onOpenChange={onExpandedChange}>
        <PopoverTrigger asChild>{lineEl}</PopoverTrigger>
        <PopoverContent side="left" className="w-80 p-0" align="start">
          <InlineAIPanel issues={lineIssues!.map((i) => ({ kind: i.kind, category: i.category, severity: i.severity, title: i.title, description: i.description, suggestion: i.suggestion, snippet: i.snippet ?? null, fixedCode: i.fixedCode ?? null }))} />
        </PopoverContent>
      </Popover>
    );
  }
  if (hasIssues) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{lineEl}</TooltipTrigger>
        <TooltipContent side="left" className="max-w-sm text-xs font-normal" sideOffset={8}>
          <div className="space-y-2">
            {lineIssues!.map((issue, idx) => (
              <div key={idx}>
                <p className="font-semibold text-foreground">{issue.title}</p>
                {issue.description && <p className="text-muted-foreground mt-0.5">{issue.description}</p>}
                {(issue.fixedCode ?? issue.suggestion) && (
                  <p className="mt-1 text-primary font-mono text-[11px] bg-primary/10 rounded px-1.5 py-1">{(issue.fixedCode ?? issue.suggestion)!}</p>
                )}
                <span className="text-muted-foreground capitalize">{issue.kind}</span>
                {issue.severity && <span className="ml-1 text-muted-foreground">· {issue.severity}</span>}
              </div>
            ))}
          </div>
        </TooltipContent>
      </Tooltip>
    );
  }
  return lineEl;
});

/** Review issue with file/line for matching to diff lines. */
export type ReviewIssueForDiff = {
  filePath: string | null;
  lineStart: number | null;
  lineEnd: number | null;
  kind: string;
  category?: string | null;
  severity: string | null;
  title: string;
  description?: string | null;
  suggestion?: string | null;
  snippet?: string | null;
  fixedCode?: string | null;
};

function filePathMatches(filePath: string, issuePath: string | null): boolean {
  if (!issuePath?.trim()) return false;
  const norm = (p: string) => p.trim().replace(/^\/+/, "");
  const a = norm(filePath);
  const b = norm(issuePath);
  if (!a || !b) return false;
  return a === b || a.endsWith("/" + b) || b.endsWith("/" + a);
}

/** Normalize for snippet matching: trim, collapse spaces, strip diff +/- prefix if present. */
function normalizeLineForMatch(s: string): string {
  const t = s.trim();
  const withoutPrefix = (t.startsWith("+") || t.startsWith("-")) ? t.slice(1).trim() : t;
  return withoutPrefix.replace(/\s+/g, " ");
}

function issueAppliesToLine(issue: ReviewIssueForDiff, lineNum: number, lineContent?: string): boolean {
  const start = issue.lineStart;
  const end = issue.lineEnd ?? start;
  const inRange = start != null && end != null && lineNum >= start && lineNum <= end;
  const hasSnippet = issue.snippet?.trim();

  // When we have a snippet, prefer matching by code so the correct line is highlighted (fixes wrong AI line numbers).
  if (lineContent != null && hasSnippet) {
    const lineNorm = normalizeLineForMatch(lineContent);
    const snippetLines = issue.snippet!.trim().split(/\r?\n/).map((l) => normalizeLineForMatch(l)).filter(Boolean);
    const firstSnippet = snippetLines[0];
    const snippetMatches =
      firstSnippet &&
      (lineNorm === firstSnippet || lineNorm.includes(firstSnippet) || firstSnippet.includes(lineNorm));
    if (snippetMatches) return true;
    // If snippet is set but this line doesn't match, do NOT use line number — avoid showing issue on wrong line.
    if (hasSnippet) return false;
  }

  return inRange;
}

function FileBlock({
  file,
  scrollToLine,
  scrollToFilePath,
  repoFullName,
  headRef,
  reviewIssuesForFile,
  expandedLineKey,
  onExpandedLineChange,
}: {
  file: ParsedFile;
  scrollToLine?: number | null;
  scrollToFilePath?: string | null;
  repoFullName?: string | null;
  headRef?: string | null;
  reviewIssuesForFile?: ReviewIssueForDiff[];
  expandedLineKey?: string | null;
  onExpandedLineChange?: (key: string | null) => void;
}) {
  const { resolvedTheme } = useTheme();

  // Theme for syntax highlighter: init from DOM so light/dark is correct on first paint and when expanding files
  const [effectiveTheme, setEffectiveTheme] = useState<"light" | "dark">(() => {
    if (typeof document === "undefined") return "light";
    return document.documentElement.classList.contains("dark") ? "dark" : "light";
  });
  useEffect(() => {
    if (resolvedTheme === "dark" || resolvedTheme === "light") setEffectiveTheme(resolvedTheme);
  }, [resolvedTheme]);

  const isTargetFile = scrollToFilePath != null && (file.path === scrollToFilePath || file.path.endsWith(scrollToFilePath) || scrollToFilePath.endsWith(file.path));
  const [open, setOpen] = useState(true);
  const [viewed, setViewed] = useState(false);
  const [showFullView, setShowFullView] = useState(false);
  const [fullFileContent, setFullFileContent] = useState<string | null>(null);
  const [fullFileLoading, setFullFileLoading] = useState(false);
  const [fullFileError, setFullFileError] = useState<string | null>(null);
  const theme = effectiveTheme;

  useEffect(() => {
    if (!isTargetFile) return;
    const t = setTimeout(() => setOpen(true), 0);
    return () => clearTimeout(t);
  }, [isTargetFile]);

  const canExpandFull = !!repoFullName && !!headRef;

  const fetchFullFile = useCallback(async () => {
    if (!repoFullName?.trim() || !headRef?.trim()) {
      toast.error("Branch not available. Showing changes only.");
      setShowFullView(false);
      return;
    }
    setFullFileLoading(true);
    setFullFileError(null);
    try {
      const { getFileContentAction } = await import("@/app/actions/github");
      const result = await getFileContentAction(repoFullName, file.path, headRef);
      if (result.ok) {
        setFullFileContent(result.content);
      } else {
        toast.error("Couldn't load full file. Showing changes only.");
        setFullFileError(null);
        setShowFullView(false);
      }
    } catch {
      toast.error("Couldn't load full file. Showing changes only.");
      setFullFileError(null);
      setShowFullView(false);
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

  const { added, removed, addedLineNumbers } = useMemo(() => {
    let a = 0;
    let r = 0;
    const addedNums = new Set<number>();
    for (const h of file.hunks) {
      for (const l of h.lines) {
        if (l.type === "add") {
          a++;
          if (l.newLineNumber != null) addedNums.add(l.newLineNumber);
        } else if (l.type === "del") r++;
      }
    }
    return { added: a, removed: r, addedLineNumbers: addedNums };
  }, [file.hunks]);

  const fileId = `diff-file-${safeId(file.path)}`;

  const fullFileLines = useMemo(() => fullFileContent?.split(/\r?\n/) ?? [], [fullFileContent]);

  const language = useMemo(() => getLanguageFromPath(file.path), [file.path]);

  const copyPath = useCallback(() => {
    void navigator.clipboard.writeText(file.path);
  }, [file.path]);

  const getIssuesForLine = useCallback(
    (lineNum: number, lineContent?: string): DiffReviewIssue[] => {
      if (!reviewIssuesForFile?.length) return [];
      return reviewIssuesForFile
        .filter((issue) => issueAppliesToLine(issue, lineNum, lineContent))
        .map((issue) => ({
          kind: issue.kind,
          category: issue.category,
          severity: issue.severity,
          title: issue.title,
          description: issue.description,
          suggestion: issue.suggestion,
          snippet: issue.snippet ?? null,
          fixedCode: issue.fixedCode ?? null,
        }));
    },
    [reviewIssuesForFile]
  );

  return (
    <div className="min-w-0">
      <Collapsible open={open} onOpenChange={setOpen} className="min-w-0 rounded-lg" id={fileId}>
        <div className="sticky top-0 z-10 flex items-center border-border bg-card">
          <CollapsibleTrigger className="flex min-w-0 flex-1 cursor-pointer items-center gap-2 px-3 py-2.5 text-left text-sm font-medium hover:bg-muted/50 transition-colors">
            {open ? <ChevronDown className="size-4 shrink-0 text-muted-foreground" /> : <ChevronRight className="size-4 shrink-0 text-muted-foreground" />}
            <FileIcon path={file.path} />
            <span className="min-w-0 truncate">{file.path}</span>
            {file.oldPath && file.oldPath !== file.path && <span className="shrink-0 text-muted-foreground text-xs">← {file.oldPath}</span>}
          </CollapsibleTrigger>
          <span className="shrink-0 text-sm font-medium text-[var(--diff-add-fg)]">+{added}</span>
          <span className="shrink-0 text-sm font-medium px-1 text-[var(--diff-del-fg)]">-{removed}</span>
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
          <div className="border-t border-border bg-background overflow-x-auto min-w-0" data-diff-viewer>
            {showFullView ? (
              <div className="min-h-[120px]">
                {fullFileLoading && (
                  <div className="flex flex-col items-center justify-center gap-3 py-12 text-muted-foreground">
                    <Spinner className="size-8" />
                    <span className="text-sm font-medium">Loading full file…</span>
                  </div>
                )}
                {!fullFileLoading && fullFileLines.length > 0 && (
                  <div className="diff-full-file" data-language={language}>
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
                      const lineIssues = getIssuesForLine(lineNum, content);
                      const lineKey = `${file.path}:${lineNum}`;
                      return <DiffLine key={lineNum} line={syntheticLine} showOld showNew lineId={lineId} highlighted={highlighted} language={language} resolvedTheme={theme} lineIssues={lineIssues.length ? lineIssues : undefined} lineKey={lineKey} isExpanded={expandedLineKey === lineKey} onExpandedChange={(open) => onExpandedLineChange?.(open ? lineKey : null)} />;
                    })}
                  </div>
                )}
              </div>
            ) : (
              file.hunks.map((hunk, hi) => (
                <div key={hi} className="border-b border-border last:border-b-0">
                  <div className="flex items-center gap-2 px-3 py-1.5 font-mono text-xs text-muted-foreground border-b bg-[var(--diff-hunk-bg)] border-[var(--diff-hunk-border)]">
                    <Button variant="ghost" size="icon" className="size-6 rounded shrink-0" aria-label="Previous change">
                      <ArrowUp className="size-3.5" />
                    </Button>
                    <span>
                      @@ -{hunk.oldStart},{hunk.oldLines} +{hunk.newStart},{hunk.newLines} @@
                    </span>
                  </div>
                  <div>
                    {hunk.lines.map((line, li) => {
                      const lineNum = line.newLineNumber ?? line.oldLineNumber ?? li;
                      const lineId = `diff-line-${safeId(file.path)}-${lineNum}`;
                      const highlighted = isTargetFile && scrollToLine != null && lineNum === scrollToLine;
                      const lineIssues = getIssuesForLine(lineNum, line.content);
                      const lineKey = `${file.path}:${lineNum}`;
                      return <DiffLine key={`${hi}-${li}`} line={line} showOld={line.type !== "add"} showNew={line.type !== "del"} lineId={lineId} highlighted={highlighted} language={language} resolvedTheme={theme} lineIssues={lineIssues.length ? lineIssues : undefined} lineKey={lineKey} isExpanded={expandedLineKey === lineKey} onExpandedChange={(open) => onExpandedLineChange?.(open ? lineKey : null)} />;
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}

export function PRDiffViewer({ files, repoFullName = null, headRef = null, className, scrollToFilePath = null, scrollToLine = null, reviewIssues = null, expandedLineKey = null, onExpandedLineChange }: PRDiffViewerProps) {
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
    <div className={cn("h-full w-full overflow-auto min-w-0", className)}>
      <div className="min-w-0 min-h-full space-y-1">
        {files.map((file, i) => (
          <FileBlock
            key={`${file.path}-${i}`}
            file={file}
            scrollToFilePath={scrollToFilePath}
            scrollToLine={scrollToLine}
            repoFullName={repoFullName}
            headRef={headRef}
            reviewIssuesForFile={reviewIssues?.filter((issue) => filePathMatches(file.path, issue.filePath))}
            expandedLineKey={expandedLineKey}
            onExpandedLineChange={onExpandedLineChange}
          />
        ))}
      </div>
    </div>
  );
}
