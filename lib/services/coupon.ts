import type { SupabaseClient } from "@supabase/supabase-js"

export type DiscountType = "percentage" | "fixed"

export type Coupon = {
  id: string
  store_id: string
  code: string
  discount_type: DiscountType
  discount_value: number
  min_order_cents: number
  usage_limit: number | null
  usage_count: number
  active: boolean
  expires_at: string | null
  created_at: string
}

export function getCoupons(supabase: SupabaseClient, storeId: string) {
  return supabase
    .from("coupons")
    .select("*")
    .eq("store_id", storeId)
    .order("created_at", { ascending: false })
    .returns<Coupon[]>()
}

export function createCoupon(
  supabase: SupabaseClient,
  storeId: string,
  patch: Pick<
    Coupon,
    | "code"
    | "discount_type"
    | "discount_value"
    | "min_order_cents"
    | "usage_limit"
    | "active"
    | "expires_at"
  >,
) {
  return supabase
    .from("coupons")
    .insert({ store_id: storeId, ...patch, code: patch.code.toUpperCase() })
    .select()
    .single<Coupon>()
}

export function updateCoupon(
  supabase: SupabaseClient,
  couponId: string,
  patch: Partial<
    Pick<
      Coupon,
      | "code"
      | "discount_type"
      | "discount_value"
      | "min_order_cents"
      | "usage_limit"
      | "active"
      | "expires_at"
    >
  >,
) {
  return supabase
    .from("coupons")
    .update(patch.code ? { ...patch, code: patch.code.toUpperCase() } : patch)
    .eq("id", couponId)
}

export function deleteCoupon(supabase: SupabaseClient, couponId: string) {
  return supabase.from("coupons").delete().eq("id", couponId)
}
