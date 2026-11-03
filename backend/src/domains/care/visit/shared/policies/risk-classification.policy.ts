/**
 * @deprecated Replaced by `RiskEngine` in `src/domains/ai/risk-engine`.
 * This old stub scored risk from the nurse's confidence alone and ignored vitals.
 * Nothing imports it any more; it is safe to delete this file.
 */
export class RiskClassificationPolicy {
  /** @deprecated Use RiskEngine.assess(). */
  public static calculateRiskTier(confidenceLevel: number): 'LOW' | 'MEDIUM' | 'HIGH' {
    if (confidenceLevel <= 2) return 'LOW';
    if (confidenceLevel <= 4) return 'MEDIUM';
    return 'HIGH';
  }

  /** @deprecated Use RiskEngine.assess(). */
  public static calculateFusedScore(confidenceLevel: number): number {
    return confidenceLevel / 5;
  }
}
