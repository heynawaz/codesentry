export type { DiffLine, DiffHunk, ParsedFile } from "./parser";
export { parseUnifiedDiff, getDiffNewLineNumbers, getDiffAddedLineNumbers } from "./parser";
export { getLanguageFromPath } from "./syntax-highlight";
