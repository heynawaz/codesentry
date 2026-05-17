/**
 * Chunk large PR diffs for context window. Splits on file boundaries to keep hunks intact.
 * TODO: Multi-chunk summarization then final analysis for very large PRs.
 */

const DEFAULT_MAX_CHARS = 85_000;

export type DiffChunk = {
  content: string;
  filePaths: string[];
  isTruncated: boolean;
  omittedChars?: number;
};

/**
 * Split a unified diff into chunks by file. Each chunk is one or more complete "diff --git" blocks.
 * If total size is under maxChars, returns a single chunk. Otherwise returns one chunk with
 * content truncated to maxChars and isTruncated true.
 */
export function chunkDiff(diff: string, maxChars: number = DEFAULT_MAX_CHARS): DiffChunk[] {
  const trimmed = diff.trim();
  if (!trimmed) {
    return [{ content: "", filePaths: [], isTruncated: false }];
  }

  const blocks = trimmed.split(/(?=^diff --git )/m).filter(Boolean);
  const filePaths: string[] = [];
  for (const block of blocks) {
    const match = block.match(/^diff --git a\/(.+?) b\/(.+?)$/m);
    const path = match?.[2] ?? match?.[1] ?? "unknown";
    filePaths.push(path.trim());
  }

  if (trimmed.length <= maxChars) {
    return [{ content: trimmed, filePaths, isTruncated: false }];
  }

  let accumulated = "";
  let omitted = trimmed.length;
  for (const block of blocks) {
    if (accumulated.length + block.length > maxChars) {
      if (accumulated.length === 0) {
        accumulated = block.slice(0, maxChars);
        omitted = block.length - maxChars;
      }
      break;
    }
    accumulated += block;
    omitted -= block.length;
  }
  const note = `\n\n... [DIFF TRUNCATED: ${omitted} chars omitted. Review only the visible changes.]`;
  return [
    {
      content: accumulated.length + note.length > maxChars ? accumulated : accumulated + note,
      filePaths,
      isTruncated: true,
      omittedChars: omitted,
    },
  ];
}

/**
 * Single chunk for prompt: either full diff or truncated to maxChars with a note.
 */
export function truncateDiffForContext(diff: string, maxChars: number = DEFAULT_MAX_CHARS): string {
  const [chunk] = chunkDiff(diff, maxChars);
  return chunk.content;
}
