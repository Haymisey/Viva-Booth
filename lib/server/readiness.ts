export type ReadinessInput = {
  verifiedRefsCount: number;
  ambiguousRefsCount: number;
  totalRefsCount?: number;
  latestTakeScore?: number | null;
  take1Score?: number | null;
  take2Score?: number | null;
  answeredQuestionsCount: number;
  passingQuestionsCount: number; // answerScore >= 60
  totalQuestionsCount: number;
};

export type ReadinessBreakdown = {
  overall: number; // 0 - 100
  citationsScore: number; // max 25
  takeQualityScore: number; // max 40
  improvementScore: number; // max 15
  examinerScore: number; // max 20
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Pure calculation of candidate defense readiness score (0–100).
 * - Citations: 25% (verified / 5, ambiguous counts as 0.5)
 * - Latest Take Quality: 40% (score of most recent debrief)
 * - Improvement: 15% (delta between Take 2 and Take 1)
 * - Examiner Readiness: 20% (answered questions with score >= 60)
 */
export function calculateReadinessScore(input: ReadinessInput): ReadinessBreakdown {
  // 1. Citations component (25%)
  const effectiveVerified = input.verifiedRefsCount + 0.5 * input.ambiguousRefsCount;
  const citationRatio = clamp(effectiveVerified / 5, 0, 1);
  const citationsScore = Math.round(citationRatio * 25);

  // 2. Latest take quality component (40%)
  const latestScore = input.latestTakeScore ?? 0;
  const takeRatio = clamp(latestScore / 100, 0, 1);
  const takeQualityScore = Math.round(takeRatio * 40);

  // 3. Improvement component (15%)
  let improvementScore = 0;
  if (
    input.take1Score !== undefined &&
    input.take1Score !== null &&
    input.take2Score !== undefined &&
    input.take2Score !== null
  ) {
    const delta = input.take2Score - input.take1Score;
    const improvementRatio = clamp(delta / 20 + 0.5, 0, 1);
    improvementScore = Math.round(improvementRatio * 15);
  }

  // 4. Examiner readiness component (20%)
  const divisor = Math.max(5, input.totalQuestionsCount || 5);
  const examinerRatio = clamp(input.passingQuestionsCount / divisor, 0, 1);
  const examinerScore = Math.round(examinerRatio * 20);

  const overall = clamp(
    citationsScore + takeQualityScore + improvementScore + examinerScore,
    0,
    100
  );

  return {
    overall,
    citationsScore,
    takeQualityScore,
    improvementScore,
    examinerScore,
  };
}
