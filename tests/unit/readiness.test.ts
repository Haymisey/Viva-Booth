import { describe, it } from "vitest";
import assert from "node:assert/strict";
import { calculateReadinessScore } from "../../lib/server/readiness";

describe("Readiness Score Engine", () => {
  it("gives 25% readiness for 5 verified citations with no takes", () => {
    const score = calculateReadinessScore({
      verifiedRefsCount: 5,
      ambiguousRefsCount: 0,
      answeredQuestionsCount: 0,
      passingQuestionsCount: 0,
      totalQuestionsCount: 0,
    });

    assert.equal(score.citationsScore, 25);
    assert.equal(score.takeQualityScore, 0);
    assert.equal(score.improvementScore, 0);
    assert.equal(score.examinerScore, 0);
    assert.equal(score.overall, 25);
  });

  it("counts ambiguous references as half credit (0.5)", () => {
    // 2 verified + 2 ambiguous = 2 + 1 = 3/5 => 60% of 25 = 15
    const score = calculateReadinessScore({
      verifiedRefsCount: 2,
      ambiguousRefsCount: 2,
      answeredQuestionsCount: 0,
      passingQuestionsCount: 0,
      totalQuestionsCount: 0,
    });

    assert.equal(score.citationsScore, 15);
  });

  it("calculates improvement bonus when Take 2 improves over Take 1", () => {
    // Take 1 = 60, Take 2 = 80 => delta = +20 => ratio = 1.0 => 15 pts
    const score = calculateReadinessScore({
      verifiedRefsCount: 5,
      ambiguousRefsCount: 0,
      latestTakeScore: 80,
      take1Score: 60,
      take2Score: 80,
      answeredQuestionsCount: 0,
      passingQuestionsCount: 0,
      totalQuestionsCount: 0,
    });

    assert.equal(score.citationsScore, 25);
    assert.equal(score.takeQualityScore, 32); // 80 * 0.4 = 32
    assert.equal(score.improvementScore, 15); // max improvement bonus
    assert.equal(score.overall, 72);
  });

  it("achieves 100% readiness when all components are fully mastered", () => {
    const score = calculateReadinessScore({
      verifiedRefsCount: 5,
      ambiguousRefsCount: 0,
      latestTakeScore: 100,
      take1Score: 80,
      take2Score: 100,
      answeredQuestionsCount: 5,
      passingQuestionsCount: 5,
      totalQuestionsCount: 5,
    });

    assert.equal(score.citationsScore, 25);
    assert.equal(score.takeQualityScore, 40);
    assert.equal(score.improvementScore, 15);
    assert.equal(score.examinerScore, 20);
    assert.equal(score.overall, 100);
  });
});
