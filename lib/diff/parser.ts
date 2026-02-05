/**
 * Parse unified diff format into structured files and hunks for UI display.
 */

export type DiffLine = {
  type: "add" | "del" | "context";
  content: string;
  oldLineNumber: number | null;
  newLineNumber: number | null;
};

export type DiffHunk = {
  oldStart: number;
  oldLines: number;
  newStart: number;
  newLines: number;
  lines: DiffLine[];
};

export type ParsedFile = {
  path: string;
  oldPath?: string; // for renames
  hunks: DiffHunk[];
};

const HUNK_HEADER = /^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/;

export function parseUnifiedDiff(diff: string): ParsedFile[] {
  const files: ParsedFile[] = [];
  const blocks = diff.split(/(?=^diff --git )/m).filter(Boolean);

  for (const block of blocks) {
    const lines = block.split(/\n/);
    if (lines[0]?.startsWith("diff --git ")) {
      const matchA = lines[0].match(/^diff --git a\/(.+?) b\/(.+?)$/);
      const path = matchA?.[2] ?? matchA?.[1] ?? "unknown";
      const oldPath = matchA?.[1] !== matchA?.[2] ? matchA?.[1] : undefined;

      const hunks: DiffHunk[] = [];
      let i = 1;

      while (i < lines.length) {
        const hunkMatch = lines[i]?.match(HUNK_HEADER);
        if (hunkMatch) {
          const oldStart = parseInt(hunkMatch[1], 10);
          const oldLines = parseInt(hunkMatch[2] ?? "1", 10);
          const newStart = parseInt(hunkMatch[3], 10);
          const newLines = parseInt(hunkMatch[4] ?? "1", 10);

          const hunkLines: DiffLine[] = [];
          let oldLn = oldStart;
          let newLn = newStart;
          i++;

          while (i < lines.length && !lines[i]?.startsWith("diff --git ") && !lines[i]?.match(HUNK_HEADER)) {
            const raw = lines[i];
            const first = raw?.[0];
            const content = raw?.slice(1) ?? "";

            if (first === "+") {
              hunkLines.push({ type: "add", content, oldLineNumber: null, newLineNumber: newLn++ });
            } else if (first === "-") {
              hunkLines.push({ type: "del", content, oldLineNumber: oldLn++, newLineNumber: null });
            } else {
              // context or no prefix
              hunkLines.push({ type: "context", content: raw ?? "", oldLineNumber: oldLn++, newLineNumber: newLn++ });
            }
            i++;
          }

          hunks.push({ oldStart, oldLines, newStart, newLines, lines: hunkLines });
        } else {
          i++;
        }
      }

      files.push({ path, oldPath, hunks });
    }
  }

  return files;
}
