/**
 * Normalize and clamp review scores (0–100).
 */

const MIN = 0;
const MAX = 100;

export function clampScore(value: number): number {
  if (typeof value !== "number" || Number.isNaN(value)) return MIN;
  return Math.round(Math.max(MIN, Math.min(MAX, value)));
}

export function normalizeScores(scores: {
  overall?: number | null;
  codeQuality?: number | null;
  security?: number | null;
  secrets?: number | null;
}): {
  overall: number;
  codeQuality: number;
  security: number;
  secrets: number;
} {
  return {
    overall: clampScore(scores.overall ?? MIN),
    codeQuality: clampScore(scores.codeQuality ?? scores.overall ?? MIN),
    security: clampScore(scores.security ?? MIN),
    secrets: clampScore(scores.secrets ?? MIN),
  };
}

/**
 * Compute overall score from sub-scores when AI does not return it.
 */
export function computeOverallScore(weights: {
  codeQuality: number;
  security: number;
  secrets: number;
}): number {
  const { codeQuality, security, secrets } = weights;
  // Weight: quality 50%, security 35%, secrets 15%
  const raw = codeQuality * 0.5 + security * 0.35 + secrets * 0.15;
  return clampScore(raw);
}

export type FiveScores = {
  codeQuality: number;
  security: number;
  secrets: number;
  performance: number;
  maintainability: number;
};

/**
 * Normalize and clamp the five category scores (enterprise schema).
 */
export function normalizeFiveScores(scores: Partial<FiveScores>): FiveScores {
  return {
    codeQuality: clampScore(scores.codeQuality ?? 0),
    security: clampScore(scores.security ?? 0),
    secrets: clampScore(scores.secrets ?? 0),
    performance: clampScore(scores.performance ?? 0),
    maintainability: clampScore(scores.maintainability ?? 0),
  };
}

/**
 * Compute overall score from five category scores (weighted).
 */
export function computeOverallScoreFromFive(s: FiveScores): number {
  const raw =
    s.codeQuality * 0.25 +
    s.security * 0.25 +
    s.secrets * 0.2 +
    s.performance * 0.15 +
    s.maintainability * 0.15;
  return clampScore(raw);
}
