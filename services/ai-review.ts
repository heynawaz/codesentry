/**
 * AI Code Review service (stub).
 * TODO: Replace with real OpenAI/LLM integration.
 */

export type ReviewIssue = {
  kind: "security" | "improvement";
  title: string;
  description: string | null;
  severity: string | null;
  filePath: string | null;
  lineStart: number | null;
  lineEnd: number | null;
  snippet: string | null;
};

export type ReviewResult = {
  qualityScore: number;
  summary: string | null;
  securityIssues: ReviewIssue[];
  improvements: ReviewIssue[];
  rawResponse?: string;
};

/**
 * Generates a code review from a PR diff.
 * Currently returns a mocked response.
 */
export async function reviewPullRequestDiff(_diff: string): Promise<ReviewResult> {
  // TODO: Call OpenAI (or other provider) with diff and structured output.
  return {
    qualityScore: 78,
    summary: "Mock review: Overall code quality is good. Consider adding error handling and tests.",
    securityIssues: [
      {
        kind: "security",
        title: "Potential SQL injection",
        description: "User input is concatenated into query without sanitization.",
        severity: "high",
        filePath: "src/api/users.ts",
        lineStart: 42,
        lineEnd: 44,
        snippet: "const query = `SELECT * FROM users WHERE id = ${id}`;",
      },
    ],
    improvements: [
      {
        kind: "improvement",
        title: "Add error handling",
        description: "Wrap async logic in try/catch and return meaningful errors.",
        severity: "medium",
        filePath: "src/lib/fetch.ts",
        lineStart: 10,
        lineEnd: 15,
        snippet: null,
      },
    ],
    rawResponse: "Mock AI response",
  };
}
