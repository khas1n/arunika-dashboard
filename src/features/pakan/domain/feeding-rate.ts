/**
 * Feeding-rate snapshot for one weight.
 *
 * Bands are already fractions. The match is the band with the greatest
 * minimum that is still at or below the weight. Zero and a weight below
 * every band have no rate.
 */

export interface FeedingRateBand {
  minWeightGrams: number
  frMin: number
  frMax: number
}

export function feedingRateForWeight(
  weightGrams: number,
  bands: readonly FeedingRateBand[],
): { frMin: number; frMax: number } | null {
  if (!(weightGrams > 0)) return null
  let match: FeedingRateBand | null = null
  for (const band of bands) {
    if (
      band.minWeightGrams <= weightGrams &&
      (match == null || band.minWeightGrams > match.minWeightGrams)
    ) {
      match = band
    }
  }
  if (match == null) return null
  return { frMin: match.frMin, frMax: match.frMax }
}
