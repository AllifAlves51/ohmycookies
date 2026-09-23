import type { SupabaseClient } from "@supabase/supabase-js"
import type { AddressInput, OpeningHoursInput } from "@/lib/validations/store"

export type Store = {
  id: string
  owner_id: string
  name: string
  slug: string
  whatsapp_number: string | null
  logo_url: string | null
  address: AddressInput | null
  opening_hours: OpeningHoursInput | null
  instagram_url: string | null
  facebook_url: string | null
  website_url: string | null
  created_at: string
  updated_at: string
}

export type StoreSettings = {
  id: string
  store_id: string
  min_order_cents: number
  pickup_enabled: boolean
  delivery_enabled: boolean
  latitude: number | null
  longitude: number | null
}

export function getStoreByOwnerId(supabase: SupabaseClient, ownerId: string) {
  return supabase
    .from("stores")
    .select("*")
    .eq("owner_id", ownerId)
    .single<Store>()
}

export function getStoreBySlug(supabase: SupabaseClient, slug: string) {
  return supabase
    .from("stores")
    .select("*")
    .eq("slug", slug)
    .maybeSingle<Store>()
}

export function getStoreSettings(supabase: SupabaseClient, storeId: string) {
  return supabase
    .from("store_settings")
    .select("*")
    .eq("store_id", storeId)
    .single<StoreSettings>()
}

export function updateStore(
  supabase: SupabaseClient,
  storeId: string,
  patch: Partial<
    Pick<
      Store,
      | "name"
      | "slug"
      | "whatsapp_number"
      | "address"
      | "opening_hours"
      | "logo_url"
    >
  >,
) {
  return supabase.from("stores").update(patch).eq("id", storeId)
}

export function updateStoreLinks(
  supabase: SupabaseClient,
  storeId: string,
  patch: Partial<
    Pick<Store, "instagram_url" | "facebook_url" | "website_url">
  >,
) {
  return supabase.from("stores").update(patch).eq("id", storeId)
}

export function updateStoreSettings(
  supabase: SupabaseClient,
  storeId: string,
  patch: Partial<
    Pick<
      StoreSettings,
      "min_order_cents" | "pickup_enabled" | "delivery_enabled"
    >
  >,
) {
  return supabase.from("store_settings").update(patch).eq("store_id", storeId)
}
