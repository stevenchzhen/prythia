/**
 * Data Quality Score (0.0 - 1.0)
 *
 * Composite of four factors, each worth 0.25:
 * - Volume depth: how much money is behind this price
 * - Source diversity: how many platforms cover it
 * - Freshness: recency of last trade
 * - Spread tightness: how much platforms agree
 */

interface QualityInputs {
  totalVolume: number
  sourceCount: number
  lastTradeMinutesAgo: number
  crossPlatformSpread: number // max - min probability across sources
}

export function calculateQualityScore(inputs: QualityInputs): number {
  const { totalVolume, sourceCount, lastTradeMinutesAgo, crossPlatformSpread } = inputs

  // Volume depth (0 - 0.25)
  // $1M+ = full score, scales linearly below
  const volumeScore = Math.min(totalVolume / 1_000_000, 1) * 0.25

  // Source diversity (0 - 0.25)
  // 3+ sources = full score
  const diversityScore = Math.min(sourceCount / 3, 1) * 0.25

  // Freshness (0 - 0.25)
  // <5 min = full score, decays over 24 hours
  const freshnessScore =
    lastTradeMinutesAgo <= 5
      ? 0.25
      : lastTradeMinutesAgo <= 60
      ? 0.25 * 0.9
      : lastTradeMinutesAgo <= 1440
      ? 0.25 * (1 - lastTradeMinutesAgo / 1440)
      : 0

  // Spread tightness (0 - 0.25)
  // <2% spread = full score, >15% = zero
  const spreadScore =
    sourceCount <= 1
      ? 0.125 // Can't measure spread with 1 source, give half credit
      : crossPlatformSpread <= 0.02
      ? 0.25
      : crossPlatformSpread >= 0.15
      ? 0
      : 0.25 * (1 - (crossPlatformSpread - 0.02) / 0.13)

  return Math.round((volumeScore + diversityScore + freshnessScore + spreadScore) * 100) / 100
}
