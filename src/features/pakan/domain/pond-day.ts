/**
 * Population, biomass, the three feed amounts, and FCR for one pond cycle.
 *
 * Pure functions. Actual feed is only the grams passed in for that pond.
 * Fasting comes from getPondFeedingSchedule, so a recurring pattern and a
 * puasa dadakan both zero the operational amount without moving the cycle.
 */

import {
  cultureDay,
  getOperationalFeedGrams,
  getPondFeedingSchedule,
} from '#/features/pakan/domain/feeding-schedule'
import type {
  CalendarDate,
  FastingReason,
  PondScheduleInput,
} from '#/features/pakan/domain/feeding-schedule'

export type PondFastingLabel = 'pola' | 'dadakan'

export interface PondStockingInput {
  occurredOn: CalendarDate
  quantity: number
}

export interface PondDaySource {
  date: CalendarDate | null
  doc: number
  averageWeightGrams: number | null
  frMin: number | null
  frMax: number | null
  deaths: number
  actualFeedGrams: number
}

export interface PondDayRow {
  date: CalendarDate | null
  doc: number
  averageWeightGrams: number | null
  frMin: number | null
  frMax: number | null
  deaths: number
  population: number | null
  biomassGrams: number | null
  calculatedFeedGrams: number | null
  operationalFeedGrams: number | null
  actualFeedGrams: number
  fastingReason: PondFastingLabel | null
}

export interface PondCycleSummary {
  rows: PondDayRow[]
  initialBiomassGrams: number | null
  latestBiomassGrams: number | null
}

export function fastingLabel(
  reason: FastingReason | null,
): PondFastingLabel | null {
  if (reason === 'OVERRIDE') return 'dadakan'
  if (reason === 'RECURRING') return 'pola'
  return null
}

function stockedOnOrBefore(
  stockings: readonly PondStockingInput[],
  date: CalendarDate | null,
): number {
  return stockings.reduce((sum, stocking) => {
    if (date != null && stocking.occurredOn > date) return sum
    return sum + stocking.quantity
  }, 0)
}

function calculatedFeedGrams(
  biomassGrams: number | null,
  frMin: number | null,
  frMax: number | null,
): number | null {
  if (biomassGrams == null || frMin == null || frMax == null) return null
  return ((frMin + frMax) / 2) * biomassGrams
}

function byReportingDate(left: PondDaySource, right: PondDaySource) {
  if (left.date != null && right.date != null && left.date !== right.date) {
    return left.date < right.date ? -1 : 1
  }
  if (left.date != null && right.date == null) return -1
  if (left.date == null && right.date != null) return 1
  return left.doc - right.doc
}

/**
 * Walks dated days in calendar order so a backfilled day sits where it
 * happened. The number on the row is the calendar day of culture when the
 * cycle has a stocking date. Stored `doc` only orders a row that has no date.
 * A blank weight blanks that day's population and biomass, and the deaths on
 * that day still count afterward. Initial biomass is the first weight times
 * fish stocked by that date, before deaths.
 */
export function summarizePondCycle(
  days: readonly PondDaySource[],
  stockings: readonly PondStockingInput[],
  schedule: PondScheduleInput,
  cultureStart: CalendarDate | null = null,
): PondCycleSummary {
  const ordered = [...days].sort(byReportingDate)
  const rows: PondDayRow[] = []
  let deathsSoFar = 0
  let initialBiomassGrams: number | null = null
  let latestBiomassGrams: number | null = null

  for (const day of ordered) {
    deathsSoFar += day.deaths
    const weight = day.averageWeightGrams
    const population =
      weight == null
        ? null
        : stockedOnOrBefore(stockings, day.date) - deathsSoFar
    const biomassGrams =
      population == null || weight == null ? null : weight * population
    if (weight != null && initialBiomassGrams == null) {
      initialBiomassGrams = weight * stockedOnOrBefore(stockings, day.date)
    }
    if (biomassGrams != null) latestBiomassGrams = biomassGrams

    const feeding = day.date ? getPondFeedingSchedule(schedule, day.date) : null
    const calculated = calculatedFeedGrams(biomassGrams, day.frMin, day.frMax)

    rows.push({
      date: day.date,
      doc:
        cultureStart != null && day.date != null
          ? cultureDay(cultureStart, day.date)
          : day.doc,
      averageWeightGrams: weight,
      frMin: day.frMin,
      frMax: day.frMax,
      deaths: day.deaths,
      population,
      biomassGrams,
      calculatedFeedGrams: calculated,
      operationalFeedGrams: feeding
        ? getOperationalFeedGrams(calculated, feeding)
        : calculated == null
          ? null
          : getOperationalFeedGrams(calculated, { isFasting: false }),
      actualFeedGrams: day.actualFeedGrams,
      fastingReason: fastingLabel(feeding?.fastingReason ?? null),
    })
  }

  return { rows, initialBiomassGrams, latestBiomassGrams }
}

/**
 * FCR is this pond's actual feed divided by the change in its biomass.
 * Blank when no actual feed was recorded. A fall in biomass stays negative.
 */
export function feedConversionRatio(
  totalActualFeedGrams: number,
  initialBiomassGrams: number | null,
  latestBiomassGrams: number | null,
): number | null {
  if (totalActualFeedGrams <= 0) return null
  if (initialBiomassGrams == null || latestBiomassGrams == null) return null
  const change = latestBiomassGrams - initialBiomassGrams
  if (change === 0) return null
  return totalActualFeedGrams / change
}

/**
 * Calculated feed for a feeding date, using the latest known weight and FR
 * on or before that date and the population up to that date. Used for bibis,
 * which is prepared before that day's weight is written down.
 */
export function projectedCalculatedFeedGrams(
  feedingOn: CalendarDate,
  days: readonly PondDaySource[],
  stockings: readonly PondStockingInput[],
): number | null {
  const known = days
    .filter(
      (day) =>
        day.averageWeightGrams != null &&
        day.date != null &&
        day.date <= feedingOn,
    )
    .sort((left, right) => {
      const leftDate = left.date ?? ''
      const rightDate = right.date ?? ''
      if (leftDate === rightDate) return left.doc - right.doc
      return leftDate < rightDate ? -1 : 1
    })
  const latest = known.at(-1)
  if (!latest || latest.averageWeightGrams == null) return null

  const deaths = days.reduce((sum, day) => {
    if (day.date != null && day.date > feedingOn) return sum
    return sum + day.deaths
  }, 0)
  const population = stockedOnOrBefore(stockings, feedingOn) - deaths
  return calculatedFeedGrams(
    latest.averageWeightGrams * population,
    latest.frMin,
    latest.frMax,
  )
}
