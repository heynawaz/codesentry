export {
  clampScore,
  computeOverallScore,
  computeOverallScoreFromFive,
  normalizeScores,
  normalizeFiveScores,
} from "./scoring";
export type { FiveScores } from "./scoring";
export { filterInlineIssuesToDiff, inlineIssuesToDbIssues } from "./mapping";
export type { InlineIssueForDiff } from "./mapping";
export { compareSeverity, isAtLeast, normalizeSeverity, type SeverityLevel } from "./severity";
export { countByKind, countBySeverity, uniqueFiles, type IssueForStats } from "./statistics";
