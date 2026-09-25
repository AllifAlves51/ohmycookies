import type { OpeningHoursInput } from "@/lib/validations/store"

const DAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const

/** Stores don't carry a timezone yet; every current store is in Mato
 * Grosso. Servers (Vercel) run in UTC, so the local clock can't be used. */
export const STORE_TIME_ZONE = "America/Cuiaba"

function toMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number)
  return hours * 60 + minutes
}

function storeLocalTime(now: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: STORE_TIME_ZONE,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now)
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? ""
  const weekday = get("weekday").toLowerCase().slice(0, 3)
  return {
    day: DAY_KEYS.find((key) => key === weekday) ?? DAY_KEYS[now.getDay()],
    minutes: Number(get("hour")) * 60 + Number(get("minute")),
  }
}

export function isStoreOpenNow(
  openingHours: OpeningHoursInput | null,
  now = new Date(),
): boolean {
  if (!openingHours) return false

  const { day, minutes } = storeLocalTime(now)
  const today = openingHours[day]
  if (!today?.open) return false

  return minutes >= toMinutes(today.from) && minutes < toMinutes(today.to)
}
