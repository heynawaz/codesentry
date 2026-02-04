import type { PrismTheme } from "prism-react-renderer";

/**
 * Softer, diff-friendly syntax theme. Designed to sit nicely on top of
 * add (green) / delete (red) line backgrounds without clashing.
 */
export const prismDiffLight: PrismTheme = {
  plain: {
    color: "#475569",
    backgroundColor: "transparent",
  },
  styles: [
    { types: ["comment", "prolog", "doctype", "cdata"], style: { color: "#64748b", fontStyle: "italic" } },
    { types: ["namespace"], style: { opacity: 0.7 } },
    { types: ["string", "attr-value"], style: { color: "#0d9488" } },
    { types: ["punctuation", "operator"], style: { color: "#64748b" } },
    { types: ["entity", "url", "symbol", "number", "boolean", "variable", "constant", "property", "regex", "inserted"], style: { color: "#7c3aed" } },
    { types: ["atrule", "keyword", "attr-name", "selector"], style: { color: "#2563eb" } },
    { types: ["function", "class-name", "deleted"], style: { color: "#dc2626" } },
    { types: ["tag"], style: { color: "#059669" } },
  ],
};

export const prismDiffDark: PrismTheme = {
  plain: {
    color: "#94a3b8",
    backgroundColor: "transparent",
  },
  styles: [
    { types: ["comment", "prolog", "doctype", "cdata"], style: { color: "#64748b", fontStyle: "italic" } },
    { types: ["namespace"], style: { opacity: 0.7 } },
    { types: ["string", "attr-value"], style: { color: "#2dd4bf" } },
    { types: ["punctuation", "operator"], style: { color: "#94a3b8" } },
    { types: ["entity", "url", "symbol", "number", "boolean", "variable", "constant", "property", "regex", "inserted"], style: { color: "#a78bfa" } },
    { types: ["atrule", "keyword", "attr-name", "selector"], style: { color: "#60a5fa" } },
    { types: ["function", "class-name", "deleted"], style: { color: "#f87171" } },
    { types: ["tag"], style: { color: "#34d399" } },
  ],
};
