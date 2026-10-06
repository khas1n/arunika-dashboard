/**
 * The one rule for whether a pond is feeding or fasting on a date, and the
 * bibis (feed preparation) that follows from it.
 *
 * Pure functions on plain data. No database, no framework. Queries, API
 * handlers and components pass data in and must not repeat this logic.
 *
 * Days are calendar days in Asia/Jakarta (UTC+7, no daylight saving),
 * written as `YYYY-MM-DD`.
 */

export type CalendarDate = string

export type FastingReason = 'RECURRING' | 'OVERRIDE'

export interface FastingPatternInput {
  feedDayCount: number
  fastDayCount: number
  anchorOn: CalendarDate
  effectiveFrom: CalendarDate
}

/** Half-open interval `[startsAt, endsAt)`. A revoked override is ignored. */
export interface FastingOverrideInput {
  startsAt: Date
  endsAt: Date
  reason: string
  revokedAt?: Date | null
}

export interface PondScheduleInput {
  patterns: readonly FastingPatternInput[]
  overrides: readonly FastingOverrideInput[]
}

export interface PondFeedingSchedule {
  date: CalendarDate
  isFasting: boolean
  isFeedingDay: boolean
  /** 1-based day in the recurring cycle, or null when no pattern is in force. */
  cycleDay: number | null
  fastingReason: FastingReason | null
  /** The override that applies on this date, if any. */
  override: FastingOverrideInput | null
  /** First feeding day strictly after `date`, or null if none within the search horizon. */
  nextFeedingOn: CalendarDate | null
  /** First fasting day strictly after `date`, or null if none within the search horizon. */
  nextFastingOn: CalendarDate | null
}

const JAKARTA_OFFSET_MS = 7 * 60 * 60 * 1000
const DAY_MS = 24 * 60 * 60 * 1000
const NEXT_DAY_SEARCH_LIMIT = 400

function toEpochDay(date: CalendarDate): number {
  const [year, month, day] = date.split('-').map(Number)
  return Math.round(Date.UTC(year, month - 1, day) / DAY_MS)
}

function fromEpochDay(epochDay: number): CalendarDate {
  return new Date(epochDay * DAY_MS).toISOString().slice(0, 10)
}

export function addDays(date: CalendarDate, days: number): CalendarDate {
  return fromEpochDay(toEpochDay(date) + days)
}

/** The instant a Jakarta calendar day starts. */
export function jakartaDayStart(date: CalendarDate): Date {
  return new Date(toEpochDay(date) * DAY_MS - JAKARTA_OFFSET_MS)
}

/** Calendar date in Asia/Jakarta for an instant. */
export function formatJakartaDate(instant: Date): CalendarDate {
  return new Date(instant.getTime() + JAKARTA_OFFSET_MS)
    .toISOString()
    .slice(0, 10)
}

/** Today's calendar date in Asia/Jakarta. */
export function todayInJakarta(now = new Date()): CalendarDate {
  return formatJakartaDate(now)
}

function positiveModulo(value: number, divisor: number): number {
  return ((value % divisor) + divisor) % divisor
}

function findPattern(
  patterns: readonly FastingPatternInput[],
  date: CalendarDate,
): FastingPatternInput | null {
  let found: FastingPatternInput | null = null
  for (const pattern of patterns) {
    if (pattern.effectiveFrom > date) continue
    if (found === null || pattern.effectiveFrom > found.effectiveFrom) {
      found = pattern
    }
  }
  return found
}

function findOverride(
  overrides: readonly FastingOverrideInput[],
  date: CalendarDate,
): FastingOverrideInput | null {
  const dayStart = jakartaDayStart(date).getTime()
  const dayEnd = dayStart + DAY_MS
  for (const override of overrides) {
    if (override.revokedAt) continue
    if (
      override.startsAt.getTime() < dayEnd &&
      override.endsAt.getTime() > dayStart
    ) {
      return override
    }
  }
  return null
}

function evaluateDay(input: PondScheduleInput, date: CalendarDate) {
  const pattern = findPattern(input.patterns, date)
  const override = findOverride(input.overrides, date)

  let cycleDay: number | null = null
  let recurringFasting = false
  if (pattern) {
    const cycleLength = pattern.feedDayCount + pattern.fastDayCount
    if (cycleLength > 0) {
      const offset = toEpochDay(date) - toEpochDay(pattern.anchorOn)
      cycleDay = positiveModulo(offset, cycleLength) + 1
      recurringFasting = cycleDay > pattern.feedDayCount
    }
  }

  const fastingReason: FastingReason | null = override
    ? 'OVERRIDE'
    : recurringFasting
      ? 'RECURRING'
      : null

  return {
    cycleDay,
    override,
    fastingReason,
    isFasting: fastingReason !== null,
  }
}

function findNextDay(
  input: PondScheduleInput,
  date: CalendarDate,
  fasting: boolean,
): CalendarDate | null {
  for (let step = 1; step <= NEXT_DAY_SEARCH_LIMIT; step += 1) {
    const candidate = addDays(date, step)
    if (evaluateDay(input, candidate).isFasting === fasting) return candidate
  }
  return null
}

/**
 * Whether a pond is feeding or fasting on `date`, and why.
 *
 * An override wins over the recurring pattern. With no pattern in force the
 * pond feeds every day unless an override applies. Overrides never move the
 * recurring cycle: the cycle day is always counted from the pattern's anchor.
 */
export function getPondFeedingSchedule(
  input: PondScheduleInput,
  date: CalendarDate,
): PondFeedingSchedule {
  const today = evaluateDay(input, date)
  return {
    date,
    isFasting: today.isFasting,
    isFeedingDay: !today.isFasting,
    cycleDay: today.cycleDay,
    fastingReason: today.fastingReason,
    override: today.override,
    nextFeedingOn: findNextDay(input, date, false),
    nextFastingOn: findNextDay(input, date, true),
  }
}

/**
 * Feed to give once fasting is applied. The calculated amount is not changed:
 * callers keep it separately to explain a zero.
 */
export function getOperationalFeedGrams(
  calculatedFeedGrams: number | null,
  schedule: Pick<PondFeedingSchedule, 'isFasting'>,
): number | null {
  if (schedule.isFasting) return 0
  if (calculatedFeedGrams === null) return null
  return Math.floor(calculatedFeedGrams + 0.5)
}

export interface BibisCycleInput {
  batchPondId: string
  schedule: PondScheduleInput
  /** Calculated feed in grams for a feeding date, or null if it cannot be known. */
  getCalculatedFeedGrams: (feedingOn: CalendarDate) => number | null
  /** Grams already recorded as prepared for that feeding date (sum of bibis records). */
  getPreparedGrams: (feedingOn: CalendarDate) => number
}

export interface BibisItem {
  batchPondId: string
  feedingOn: CalendarDate
  calculatedFeedGrams: number | null
  /** Operational feed for the feeding day. 0 when fasting. */
  requiredGrams: number
  preparedGrams: number
  /** Still to prepare: required minus prepared, never below 0. */
  remainingGrams: number
  /** Why the required amount is 0, when fasting made it 0. */
  fastingReason: FastingReason | null
  /** Something was prepared that is no longer needed, for example after a new override. */
  preparedButNotNeeded: boolean
}

export interface BibisForDay {
  prepareOn: CalendarDate
  feedingOn: CalendarDate
  items: BibisItem[]
  totalRequiredGrams: number
  totalRemainingGrams: number
}

/**
 * The bibis to-do for `prepareOn`. Feed prepared today is for
 * `prepareOn + leadDays`. The required amount is 0 when that feeding day is
 * fasting, whether from the recurring pattern or from an override. It is
 * calculated every time, so a new override changes it without any row to
 * cancel. Records the user already saved reduce what is remaining.
 */
export function getBibisForDay(
  prepareOn: CalendarDate,
  cycles: readonly BibisCycleInput[],
  leadDays: number,
): BibisForDay {
  const feedingOn = addDays(prepareOn, leadDays)
  const items: BibisItem[] = []

  for (const cycle of cycles) {
    const schedule = getPondFeedingSchedule(cycle.schedule, feedingOn)
    const calculatedFeedGrams = cycle.getCalculatedFeedGrams(feedingOn)
    const requiredGrams =
      getOperationalFeedGrams(calculatedFeedGrams, schedule) ?? 0
    const preparedGrams = cycle.getPreparedGrams(feedingOn)
    items.push({
      batchPondId: cycle.batchPondId,
      feedingOn,
      calculatedFeedGrams,
      requiredGrams,
      preparedGrams,
      remainingGrams: Math.max(requiredGrams - preparedGrams, 0),
      fastingReason: schedule.fastingReason,
      preparedButNotNeeded: requiredGrams === 0 && preparedGrams > 0,
    })
  }

  return {
    prepareOn,
    feedingOn,
    items,
    totalRequiredGrams: items.reduce(
      (sum, item) => sum + item.requiredGrams,
      0,
    ),
    totalRemainingGrams: items.reduce(
      (sum, item) => sum + item.remainingGrams,
      0,
    ),
  }
}
