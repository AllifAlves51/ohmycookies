import type { OpeningHoursInput } from "@/lib/validations/store"

const DAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const

function toMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number)
  return hours * 60 + minutes
}

/** Uses the server's local time — a known simplification until stores carry an explicit timezone. */
export function isStoreOpenNow(
  openingHours: OpeningHoursInput | null,
  now = new Date(),
): boolean {
  if (!openingHours) return false

  const today = openingHours[DAY_KEYS[now.getDay()]]
  if (!today.open) return false

  const current = now.getHours() * 60 + now.getMinutes()
  return current >= toMinutes(today.from) && current < toMinutes(today.to)
}
