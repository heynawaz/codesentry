/**
 * Map file path/extension to language alias for syntax highlighting.
 * Used by react-syntax-highlighter in the diff viewer.
 */
const EXT_TO_LANG: Record<string, string> = {
  ts: "typescript",
  tsx: "tsx",
  js: "javascript",
  jsx: "jsx",
  mjs: "javascript",
  cjs: "javascript",
  css: "css",
  scss: "scss",
  sass: "sass",
  less: "less",
  html: "markup",
  htm: "markup",
  json: "json",
  md: "markdown",
  mdx: "markdown",
  yaml: "yaml",
  yml: "yaml",
  sql: "sql",
  sh: "bash",
  bash: "bash",
  py: "python",
  rb: "ruby",
  go: "go",
  rs: "rust",
  java: "java",
  c: "c",
  cpp: "cpp",
  h: "c",
  hpp: "cpp",
};

export function getLanguageFromPath(filePath: string): string {
  const ext = filePath.split(".").pop()?.toLowerCase() ?? "";
  return EXT_TO_LANG[ext] ?? "";
}
