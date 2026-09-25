import type { SupabaseClient } from "@supabase/supabase-js"

export type DeliveryZone = {
  id: string
  store_id: string
  name: string
  fee_cents: number
  estimated_time_minutes: number
  radius_km: number | null
  active: boolean
  position: number
  created_at: string
  updated_at: string
}

export function getDeliveryZones(supabase: SupabaseClient, storeId: string) {
  return supabase
    .from("delivery_zones")
    .select("*")
    .eq("store_id", storeId)
    .order("position", { ascending: true })
    .order("created_at", { ascending: true })
    .returns<DeliveryZone[]>()
}

export function createDeliveryZone(
  supabase: SupabaseClient,
  storeId: string,
  patch: Pick<
    DeliveryZone,
    "name" | "fee_cents" | "estimated_time_minutes" | "active" | "radius_km"
  >,
) {
  return supabase
    .from("delivery_zones")
    .insert({ store_id: storeId, ...patch })
    .select()
    .single<DeliveryZone>()
}

export function updateDeliveryZone(
  supabase: SupabaseClient,
  zoneId: string,
  patch: Partial<
    Pick<
      DeliveryZone,
      "name" | "fee_cents" | "estimated_time_minutes" | "active" | "radius_km"
    >
  >,
) {
  return supabase.from("delivery_zones").update(patch).eq("id", zoneId)
}

/** The smallest active radius tier that still covers the given distance —
 * mirrors how the km ranges in the admin table are meant to be read
 * (each row is "up to X km"). */
export function findZoneForDistanceKm(
  zones: DeliveryZone[],
  distanceKm: number,
): DeliveryZone | null {
  const tiers = zones
    .filter((zone) => zone.active && zone.radius_km !== null)
    .sort((a, b) => (a.radius_km ?? 0) - (b.radius_km ?? 0))

  return tiers.find((zone) => distanceKm <= (zone.radius_km ?? 0)) ?? null
}
