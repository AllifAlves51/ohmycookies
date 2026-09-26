import { STORE_TIME_ZONE } from "@/lib/utils/opening-hours"

/** Calendar-day helpers in the store's timezone. Servers run in UTC, where
 * the day turns at 20:00 in Mato Grosso — using UTC days pushed evening
 * orders into "tomorrow". Day keys are "YYYY-MM-DD" strings. */

const dayKeyFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: STORE_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
})

export function storeDayKey(date: Date = new Date()) {
  return dayKeyFormatter.format(date)
}

export function isDayKey(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    !Number.isNaN(Date.parse(`${value}T00:00:00Z`))
  )
}

/** Shifts a day key by whole days (calendar arithmetic, no timezone). */
export function addDays(dayKey: string, days: number) {
  const date = new Date(`${dayKey}T00:00:00Z`)
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}

/** The store's UTC offset on that day, e.g. "-04:00". */
function offsetFor(dayKey: string) {
  const name =
    new Intl.DateTimeFormat("en-US", {
      timeZone: STORE_TIME_ZONE,
      timeZoneName: "longOffset",
    })
      .formatToParts(new Date(`${dayKey}T12:00:00Z`))
      .find((part) => part.type === "timeZoneName")?.value ?? "GMT-04:00"
  const match = name.match(/GMT([+-]\d{2}):?(\d{2})?/)
  return match ? `${match[1]}:${match[2] ?? "00"}` : "-04:00"
}

/** [start, end) instants of a store-local calendar day. */
export function storeDayBounds(dayKey: string) {
  const start = new Date(`${dayKey}T00:00:00${offsetFor(dayKey)}`)
  const nextKey = addDays(dayKey, 1)
  const end = new Date(`${nextKey}T00:00:00${offsetFor(nextKey)}`)
  return { start, end }
}

const MONTH_LONG = [
  "janeiro",
  "fevereiro",
  "março",
  "abril",
  "maio",
  "junho",
  "julho",
  "agosto",
  "setembro",
  "outubro",
  "novembro",
  "dezembro",
]

/** "26 de setembro de 2026" */
export function formatDayKeyLong(dayKey: string) {
  const [year, month, day] = dayKey.split("-").map(Number)
  return `${day} de ${MONTH_LONG[month - 1]} de ${year}`
}
