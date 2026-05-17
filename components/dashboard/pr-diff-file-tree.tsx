"use client";

import { useState, useMemo, useEffect } from "react";
import { ChevronDown, ChevronRight, Folder, FolderOpen, Search, SlidersHorizontal, FilePlus, FileMinus, FileEdit } from "lucide-react";
import { Input } from "@/components/ui/input";
import { FileIcon } from "@/components/ui/file-icon";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { ParsedFile } from "@/lib/diff";

type FileEntry = { path: string; added: number; removed: number };

type TreeNode =
  | { type: "folder"; name: string; children: Record<string, TreeNode> }
  | { type: "file"; name: string; path: string; added: number; removed: number };

function buildTree(entries: FileEntry[]): TreeNode[] {
  const root: Record<string, TreeNode> = {};
  for (const { path, added, removed } of entries) {
    const parts = path.split("/");
    let current: Record<string, TreeNode> = root;
    for (let i = 0; i < parts.length; i++) {
      const name = parts[i]!;
      const isLast = i === parts.length - 1;
      if (isLast) {
        current[name] = { type: "file", name, path, added, removed };
      } else {
        if (!current[name]) {
          current[name] = { type: "folder", name, children: {} };
        }
        const node = current[name];
        if (node.type === "folder") {
          current = node.children;
        }
      }
    }
  }
  const sortKey = (n: TreeNode) => (n.type === "folder" ? `0:${n.name}` : `1:${n.name}`);
  return Object.values(root).sort((a, b) => sortKey(a).localeCompare(sortKey(b)));
}

function folderChildrenArray(node: TreeNode): TreeNode[] {
  if (node.type !== "folder") return [];
  return Object.values(node.children).sort((a, b) => {
    const aFolder = a.type === "folder" ? 0 : 1;
    const bFolder = b.type === "folder" ? 0 : 1;
    return aFolder !== bFolder ? aFolder - bFolder : a.name.localeCompare(b.name);
  });
}

function folderHasMatchingDescendant(node: TreeNode, filter: string, folderPath: string): boolean {
  if (node.type === "file") return node.path.toLowerCase().includes(filter.toLowerCase());
  const expKey = folderPath ? `${folderPath}/${node.name}` : node.name;
  return folderChildrenArray(node).some((c) => folderHasMatchingDescendant(c, filter, expKey));
}

export type ChangeTypeFilter = "all" | "added" | "modified" | "deleted";

type PRDiffFileTreeProps = {
  files: ParsedFile[];
  selectedPath: string | null;
  onSelectFile: (path: string) => void;
  changeType: ChangeTypeFilter;
  onChangeType: (value: ChangeTypeFilter) => void;
  className?: string;
};

function TreeFolder({
  node,
  depth,
  folderPath,
  filter,
  selectedPath,
  onSelectFile,
  expandedSet,
  setExpanded,
}: {
  node: TreeNode;
  depth: number;
  folderPath: string;
  filter: string;
  selectedPath: string | null;
  onSelectFile: (path: string) => void;
  expandedSet: Set<string>;
  setExpanded: (key: string, open: boolean) => void;
}) {
  if (node.type === "file") {
    const isSelected = selectedPath === node.path;
    return (
      <button
        type="button"
        onClick={() => onSelectFile(node.path)}
        className={cn(
          "flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors hover:bg-muted",
          isSelected && "bg-muted font-medium"
        )}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
      >
        <FileIcon path={node.path} />
        <span className="min-w-0 truncate">{node.name}</span>
        <span className="ml-auto shrink-0 text-xs text-emerald-600 dark:text-emerald-400">+{node.added}</span>
        <span className="shrink-0 text-xs text-red-600 dark:text-red-400">-{node.removed}</span>
      </button>
    );
  }

  const expKey = folderPath ? `${folderPath}/${node.name}` : node.name;
  const isExpanded = expandedSet.has(expKey);
  const childrenArr = folderChildrenArray(node);
  const filteredChildren = filter
    ? childrenArr.filter((c) => {
        if (c.type === "file") return c.path.toLowerCase().includes(filter.toLowerCase());
        const childPath = `${expKey}/${c.name}`;
        const pathMatches = childPath.toLowerCase().includes(filter.toLowerCase());
        const hasMatchingDescendant = folderHasMatchingDescendant(c, filter, childPath);
        return pathMatches || hasMatchingDescendant;
      })
    : childrenArr;
  if (filteredChildren.length === 0) return null;

  return (
    <div className="py-0.5">
      <button
        type="button"
        onClick={() => setExpanded(expKey, !isExpanded)}
        className="flex w-full cursor-pointer items-center gap-1 rounded-md px-2 py-1.5 text-left text-sm transition-colors hover:bg-muted"
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
      >
        {isExpanded ? <ChevronDown className="size-4 shrink-0" /> : <ChevronRight className="size-4 shrink-0" />}
        {isExpanded ? <FolderOpen className="size-4 shrink-0 text-muted-foreground" /> : <Folder className="size-4 shrink-0 text-muted-foreground" />}
        <span className="min-w-0 truncate">{node.name}</span>
      </button>
      {isExpanded && (
        <div className="border-l border-border ml-2 pl-0">
          {filteredChildren.map((child) => (
            <TreeFolder
              key={child.type === "file" ? child.path : `${expKey}/${child.name}`}
              node={child}
              depth={depth + 1}
              folderPath={expKey}
              filter={filter}
              selectedPath={selectedPath}
              onSelectFile={onSelectFile}
              expandedSet={expandedSet}
              setExpanded={setExpanded}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function PRDiffFileTree({ files, selectedPath, onSelectFile, changeType, onChangeType, className }: PRDiffFileTreeProps) {
  const [filter, setFilter] = useState("");
  const [expanded, setExpandedState] = useState<Set<string>>(() => new Set());

  const entries: FileEntry[] = useMemo(
    () =>
      files.map((f) => ({
        path: f.path,
        added: f.hunks.reduce((a, h) => a + h.lines.filter((l) => l.type === "add").length, 0),
        removed: f.hunks.reduce((a, h) => a + h.lines.filter((l) => l.type === "del").length, 0),
      })),
    [files]
  );

  const tree = useMemo(() => buildTree(entries), [entries]);

  useEffect(() => {
    setExpandedState((prev) => {
      const next = new Set(prev);
      tree.forEach((n) => {
        if (n.type === "folder") next.add(n.name);
      });
      if (selectedPath) {
        const parts = selectedPath.split("/");
        for (let i = 0; i < parts.length - 1; i++) {
          next.add(parts.slice(0, i + 1).join("/"));
        }
      }
      if (filter.trim()) {
        entries.forEach((e) => {
          if (e.path.toLowerCase().includes(filter.toLowerCase())) {
            const parts = e.path.split("/");
            for (let i = 0; i < parts.length - 1; i++) {
              next.add(parts.slice(0, i + 1).join("/"));
            }
          }
        });
      }
      return next;
    });
    // Keep deps fixed-size: tree changes when entries change, so we don't list entries
  }, [tree, selectedPath, filter]);

  const setExpanded = (key: string, open: boolean) => {
    setExpandedState((prev) => {
      const next = new Set(prev);
      if (open) next.add(key);
      else next.delete(key);
      return next;
    });
  };

  const filteredTree = filter
    ? tree.filter((n) =>
        n.type === "file" ? n.path.toLowerCase().includes(filter.toLowerCase()) : folderHasMatchingDescendant(n, filter, "")
      )
    : tree;

  return (
    <div className={cn("flex flex-col border-r border-border bg-muted/30", className)}>
      <div className="flex items-center gap-1 border-b border-border p-2">
        <div className="relative flex-1 flex items-center">
          <Search className="pointer-events-none absolute left-2.5 size-4 shrink-0 text-muted-foreground" />
          <Input
            placeholder="Filter files..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="h-8 w-full rounded-md border-border bg-background pl-8 pr-2 text-sm"
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="size-8 shrink-0" aria-label="Filter by change type">
              <SlidersHorizontal className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>Show files</DropdownMenuLabel>
            <DropdownMenuRadioGroup value={changeType} onValueChange={(v) => onChangeType(v as ChangeTypeFilter)}>
              <DropdownMenuRadioItem value="all">All files</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="added">
                <span className="flex items-center gap-2">
                  <FilePlus className="size-4 text-emerald-600 dark:text-emerald-400" />
                  Added only
                </span>
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="modified">
                <span className="flex items-center gap-2">
                  <FileEdit className="size-4 text-amber-600 dark:text-amber-400" />
                  Modified only
                </span>
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="deleted">
                <span className="flex items-center gap-2">
                  <FileMinus className="size-4 text-red-600 dark:text-red-400" />
                  Deleted only
                </span>
              </DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <ScrollArea className="flex-1 min-h-0">
        <div className="p-2">
          {filteredTree.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">No files match</p>
          ) : (
            filteredTree.map((node) => (
              <TreeFolder
                key={node.type === "file" ? node.path : node.name}
                node={node}
                depth={0}
                folderPath=""
                filter={filter}
                selectedPath={selectedPath}
                onSelectFile={onSelectFile}
                expandedSet={expanded}
                setExpanded={setExpanded}
              />
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
