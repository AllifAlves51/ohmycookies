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

const DAY_NAMES: Record<(typeof DAY_KEYS)[number], string> = {
  sun: "domingo",
  mon: "segunda-feira",
  tue: "terça-feira",
  wed: "quarta-feira",
  thu: "quinta-feira",
  fri: "sexta-feira",
  sat: "sábado",
}

/** When the store next opens, e.g. "hoje às 13:00", "amanhã às 13:00",
 * "quinta-feira às 13:00" — or null if no day is open at all. */
export function nextOpeningLabel(
  openingHours: OpeningHoursInput | null,
  now = new Date(),
): string | null {
  if (!openingHours) return null

  const { day, minutes } = storeLocalTime(now)
  const todayIndex = DAY_KEYS.indexOf(day)

  for (let offset = 0; offset < 8; offset++) {
    const key = DAY_KEYS[(todayIndex + offset) % 7]
    const hours = openingHours[key]
    if (!hours?.open) continue
    // Today only counts if opening time is still ahead.
    if (offset === 0 && toMinutes(hours.from) <= minutes) continue

    const when =
      offset === 0 ? "hoje" : offset === 1 ? "amanhã" : DAY_NAMES[key]
    return `${when} às ${hours.from}`
  }
  return null
}

/** Customer-facing reason orders are blocked right now. */
export function closedMessage(openingHours: OpeningHoursInput | null) {
  const next = nextOpeningLabel(openingHours)
  return next
    ? `Estamos fechados agora e não recebemos pedidos neste horário. Abrimos ${next}.`
    : "Estamos fechados no momento e não estamos recebendo pedidos."
}
