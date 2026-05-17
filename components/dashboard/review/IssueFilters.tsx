"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { Filter, ChevronDown, X } from "lucide-react";

export type IssueFiltersProps = {
  severityFilter: "all" | "low" | "medium" | "high";
  categoryFilter: string | null;
  categories: string[];
  onSeverityChange: (v: "all" | "low" | "medium" | "high") => void;
  onCategoryChange: (v: string | null) => void;
  onCollapseAll?: () => void;
  collapseLabel?: string;
  className?: string;
};

export function IssueFilters({
  severityFilter,
  categoryFilter,
  categories,
  onSeverityChange,
  onCategoryChange,
  onCollapseAll,
  collapseLabel = "Collapse all",
  className,
}: IssueFiltersProps) {
  const hasActiveFilters = severityFilter !== "all" || categoryFilter != null;

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      <div className="flex items-center gap-1.5 rounded-md border border-border/80 bg-muted/30 px-2 py-1">
        <Filter className="size-3.5 text-muted-foreground" aria-hidden />
        <span className="text-xs font-medium text-muted-foreground">Severity</span>
        {(["all", "high", "medium", "low"] as const).map((s) => (
          <Button
            key={s}
            variant="ghost"
            size="sm"
            className={cn(
              "h-6 rounded px-2 text-xs",
              severityFilter === s ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground"
            )}
            onClick={() => onSeverityChange(s)}
          >
            {s === "all" ? "All" : s}
          </Button>
        ))}
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="h-8 gap-1 text-xs">
            Category
            {categoryFilter ? `: ${categoryFilter}` : ""}
            <ChevronDown className="size-3.5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="max-h-64 overflow-y-auto">
          <DropdownMenuLabel>Filter by category</DropdownMenuLabel>
          <DropdownMenuCheckboxItem
            checked={!categoryFilter}
            onCheckedChange={() => onCategoryChange(null)}
          >
            All
          </DropdownMenuCheckboxItem>
          {[...new Set(categories)].filter(Boolean).map((cat) => (
            <DropdownMenuCheckboxItem
              key={cat}
              checked={categoryFilter === cat}
              onCheckedChange={(checked) => onCategoryChange(checked ? cat : null)}
            >
              {cat}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          className="h-8 gap-1 text-xs text-muted-foreground"
          onClick={() => {
            onSeverityChange("all");
            onCategoryChange(null);
          }}
        >
          <X className="size-3.5" /> Clear filters
        </Button>
      )}
      {onCollapseAll && (
        <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={onCollapseAll}>
          {collapseLabel}
        </Button>
      )}
    </div>
  );
}
