import { addDays, storeDayKey } from "@/lib/utils/store-date"

export type SeasonId =
  "halloween" | "christmas" | "easter" | "valentines" | "june" | "mothers_day"

/** What the owner picks in Configurações. "auto" follows the calendar. */
export type SeasonalThemeSetting = "none" | "auto" | SeasonId

export const SEASONS: {
  id: SeasonId
  label: string
  window: string
  /** Hero swatch for the picker (mirrors --season-hero in globals.css). */
  swatch: string
}[] = [
  {
    id: "halloween",
    label: "Halloween",
    window: "15/out – 2/nov",
    swatch: "linear-gradient(160deg, #1a0b2e, #4c1d95 70%, #f97316)",
  },
  {
    id: "christmas",
    label: "Natal",
    window: "1/dez – 26/dez",
    swatch: "linear-gradient(160deg, #072a1c, #14532d 70%, #b91c1c)",
  },
  {
    id: "easter",
    label: "Páscoa",
    window: "2 semanas antes da Páscoa",
    swatch: "linear-gradient(160deg, #e9dcff, #fde2f0 55%, #d9f5e8)",
  },
  {
    id: "mothers_day",
    label: "Dia das Mães",
    window: "1/mai – 2º domingo de maio",
    swatch: "linear-gradient(160deg, #fde2ec, #fbcfe1 55%, #f5d0fe)",
  },
  {
    id: "valentines",
    label: "Dia dos Namorados",
    window: "1/jun – 12/jun",
    swatch: "linear-gradient(160deg, #6b0f2a, #be123c 70%, #fda4af)",
  },
  {
    id: "june",
    label: "Festa Junina",
    window: "13/jun – 31/jul",
    swatch: "linear-gradient(160deg, #1e1b4b, #4c1d4f 50%, #f97316)",
  },
]

const SEASON_IDS = new Set<string>(SEASONS.map((s) => s.id))

export function isSeasonId(value: unknown): value is SeasonId {
  return typeof value === "string" && SEASON_IDS.has(value)
}

export function isSeasonalThemeSetting(
  value: unknown,
): value is SeasonalThemeSetting {
  return value === "none" || value === "auto" || isSeasonId(value)
}

/** Easter Sunday (anonymous Gregorian algorithm) as a day key. */
function easterDayKey(year: number) {
  const a = year % 19
  const b = Math.floor(year / 100)
  const c = year % 100
  const d = Math.floor(b / 4)
  const e = b % 4
  const f = Math.floor((b + 8) / 25)
  const g = Math.floor((b - f + 1) / 3)
  const h = (19 * a + b - d - g + 15) % 30
  const i = Math.floor(c / 4)
  const k = c % 4
  const l = (32 + 2 * e + 2 * i - h - k) % 7
  const m = Math.floor((a + 11 * h + 22 * l) / 451)
  const month = Math.floor((h + l - 7 * m + 114) / 31)
  const day = ((h + l - 7 * m + 114) % 31) + 1
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`
}

/** Second Sunday of May (Dia das Mães in Brazil). */
function mothersDayKey(year: number) {
  const firstWeekday = new Date(Date.UTC(year, 4, 1)).getUTCDay()
  const firstSunday = 1 + ((7 - firstWeekday) % 7)
  return `${year}-05-${String(firstSunday + 7).padStart(2, "0")}`
}

/** The season whose window contains `dayKey` (store calendar), if any. */
export function seasonForDay(dayKey: string = storeDayKey()): SeasonId | null {
  const year = Number(dayKey.slice(0, 4))
  const md = dayKey.slice(5)

  if (md >= "10-15" && md <= "11-02") return "halloween"
  if (md >= "12-01" && md <= "12-26") return "christmas"

  const easter = easterDayKey(year)
  if (dayKey >= addDays(easter, -14) && dayKey <= addDays(easter, 1)) {
    return "easter"
  }

  if (md >= "05-01" && dayKey <= mothersDayKey(year)) return "mothers_day"
  if (md >= "06-01" && md <= "06-12") return "valentines"
  if (md >= "06-13" && md <= "07-31") return "june"

  return null
}

/** Turns the stored setting into the season to render right now. */
export function resolveSeason(
  setting: string | null | undefined,
  dayKey?: string,
): SeasonId | null {
  if (setting === "auto") return seasonForDay(dayKey)
  return isSeasonId(setting) ? setting : null
}
