import { addDays, isDayKey, storeDayBounds, storeDayKey } from "@/lib/utils/store-date"

export type ReportPreset = "today" | "7d" | "30d" | "month"
export type ReportPeriod = ReportPreset | "day" | "custom"

export const REPORT_PRESETS: { value: ReportPreset; label: string }[] = [
  { value: "today", label: "Hoje" },
  { value: "7d", label: "Últimos 7 dias" },
  { value: "30d", label: "Últimos 30 dias" },
  { value: "month", label: "Este mês" },
]

/** What the period dropdown offers: the presets plus the two date-driven
 * modes. */
export const REPORT_PERIOD_OPTIONS: { value: ReportPeriod; label: string }[] = [
  ...REPORT_PRESETS,
  { value: "day", label: "Dia específico" },
  { value: "custom", label: "Personalizado" },
]

/** A custom range this long is already more than a year of data; anything
 * longer just makes the charts unreadable and the queries heavy. */
const MAX_RANGE_DAYS = 366

export type ReportRange = {
  period: ReportPeriod
  /** Inclusive store-local calendar days, "YYYY-MM-DD". */
  fromKey: string
  toKey: string
  /** Exact instants covering fromKey 00:00 through the end of toKey. */
  from: Date
  to: Date
  days: number
}

function daysBetween(fromKey: string, toKey: string) {
  const ms =
    new Date(`${toKey}T00:00:00Z`).getTime() -
    new Date(`${fromKey}T00:00:00Z`).getTime()
  return Math.round(ms / 86_400_000) + 1
}

function toRange(
  period: ReportPeriod,
  fromKey: string,
  toKey: string,
): ReportRange {
  return {
    period,
    fromKey,
    toKey,
    from: storeDayBounds(fromKey).start,
    to: new Date(storeDayBounds(toKey).end.getTime() - 1),
    days: daysBetween(fromKey, toKey),
  }
}

type Param = string | string[] | undefined

function first(value: Param) {
  return Array.isArray(value) ? value[0] : value
}

/** Turns the page's search params into a validated range. Anything missing
 * or invalid falls back to the last 7 days; future days are clamped to
 * today and reversed ranges are swapped. */
export function resolveReportRange(params: {
  period?: Param
  date?: Param
  from?: Param
  to?: Param
}): ReportRange {
  const today = storeDayKey()
  const period = first(params.period)

  if (period === "today") return toRange("today", today, today)
  if (period === "30d") return toRange("30d", addDays(today, -29), today)
  if (period === "month") {
    return toRange("month", `${today.slice(0, 8)}01`, today)
  }

  if (period === "day") {
    const date = first(params.date)
    const day = isDayKey(date) && date <= today ? date : today
    return toRange("day", day, day)
  }

  if (period === "custom") {
    const rawFrom = first(params.from)
    const rawTo = first(params.to)
    if (isDayKey(rawFrom) && isDayKey(rawTo)) {
      let fromKey = rawFrom <= rawTo ? rawFrom : rawTo
      let toKey = rawFrom <= rawTo ? rawTo : rawFrom
      if (toKey > today) toKey = today
      if (fromKey > toKey) fromKey = toKey
      const earliest = addDays(toKey, -(MAX_RANGE_DAYS - 1))
      if (fromKey < earliest) fromKey = earliest
      return toRange("custom", fromKey, toKey)
    }
  }

  return toRange("7d", addDays(today, -6), today)
}

/** The equal-length window immediately before the range, used to compute
 * the percentage deltas shown on the report's stat cards. */
export function getPreviousRange(range: ReportRange): ReportRange {
  const toKey = addDays(range.fromKey, -1)
  const fromKey = addDays(toKey, -(range.days - 1))
  return toRange(range.period, fromKey, toKey)
}

function formatShort(dayKey: string) {
  const [year, month, day] = dayKey.split("-")
  return `${day}/${month}/${year}`
}

/** "15/10/2026" for a single day, "01/10/2026 a 15/10/2026" otherwise. */
export function formatRangeLabel(range: ReportRange) {
  return range.fromKey === range.toKey
    ? formatShort(range.fromKey)
    : `${formatShort(range.fromKey)} a ${formatShort(range.toKey)}`
}
