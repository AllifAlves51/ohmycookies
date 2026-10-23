import type { SupabaseClient } from "@supabase/supabase-js"
import { fetchAll } from "@/lib/supabase/fetch-all"
import type { AddressInput } from "@/lib/validations/store"

export type OrderStatus =
  | "new"
  | "confirmed"
  | "preparing"
  | "out_for_delivery"
  | "completed"
  | "cancelled"

export const STATUS_COLUMNS: {
  status: OrderStatus
  label: string
  badgeClassName: string
  /** Status dot on the board column header and the order card. */
  dotClassName: string
}[] = [
  {
    status: "new",
    label: "Novos",
    badgeClassName:
      "bg-red-50 text-red-700 ring-1 ring-red-600/15 dark:bg-red-950/50 dark:text-red-300",
    dotClassName: "bg-red-500",
  },
  {
    status: "confirmed",
    label: "Confirmados",
    badgeClassName:
      "bg-amber-50 text-amber-800 ring-1 ring-amber-600/20 dark:bg-amber-950/50 dark:text-amber-300",
    dotClassName: "bg-amber-500",
  },
  {
    status: "preparing",
    label: "Em preparo",
    badgeClassName:
      "bg-blue-50 text-blue-700 ring-1 ring-blue-600/15 dark:bg-blue-950/50 dark:text-blue-300",
    dotClassName: "bg-blue-500",
  },
  {
    status: "out_for_delivery",
    label: "Saiu para entrega",
    badgeClassName:
      "bg-violet-50 text-violet-700 ring-1 ring-violet-600/15 dark:bg-violet-950/50 dark:text-violet-300",
    dotClassName: "bg-violet-500",
  },
  {
    status: "completed",
    label: "Concluídos",
    badgeClassName:
      "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/15 dark:bg-emerald-950/50 dark:text-emerald-300",
    dotClassName: "bg-emerald-500",
  },
  {
    status: "cancelled",
    label: "Cancelados",
    badgeClassName:
      "bg-stone-100 text-stone-600 ring-1 ring-stone-500/15 dark:bg-stone-800 dark:text-stone-300",
    dotClassName: "bg-stone-400",
  },
]

export type PaymentPreference = "cash" | "pix" | "card"

export const PAYMENT_PREFERENCE_LABEL: Record<PaymentPreference, string> = {
  cash: "Dinheiro",
  pix: "Pix",
  card: "Cartão",
}

export type Order = {
  id: string
  store_id: string
  order_number: number
  status: OrderStatus
  fulfillment_type: "delivery" | "pickup"
  delivery_zone_name: string | null
  delivery_estimated_minutes: number | null
  delivery_address: AddressInput | null
  payment_preference: PaymentPreference | null
  subtotal_cents: number
  delivery_fee_cents: number
  discount_cents: number
  total_cents: number
  created_at: string
  updated_at: string
}

export type OrderWithCustomer = Order & {
  customer: { name: string; whatsapp: string } | null
}

/** How far back the board loads finished (completed/cancelled) orders.
 * Open orders are always loaded, however old. */
export const BOARD_HISTORY_DAYS = 30

export function getOrders(supabase: SupabaseClient, storeId: string) {
  const since = new Date(
    Date.now() - BOARD_HISTORY_DAYS * 24 * 60 * 60 * 1000,
  ).toISOString()

  return fetchAll((from, to) =>
    supabase
      .from("orders")
      .select("*, customer:customers(name, whatsapp)")
      .eq("store_id", storeId)
      .or(
        `status.in.(new,confirmed,preparing,out_for_delivery),created_at.gte.${since}`,
      )
      .order("created_at", { ascending: false })
      .order("id")
      .range(from, to)
      .returns<OrderWithCustomer[]>(),
  )
}

export function getOrderWithCustomer(
  supabase: SupabaseClient,
  orderId: string,
) {
  return supabase
    .from("orders")
    .select("*, customer:customers(name, whatsapp)")
    .eq("id", orderId)
    .single<OrderWithCustomer>()
}

export function updateOrderStatus(
  supabase: SupabaseClient,
  orderId: string,
  status: OrderStatus,
) {
  return supabase.from("orders").update({ status }).eq("id", orderId)
}

export type OrderTracking = {
  order_number: number
  status: OrderStatus
  fulfillment_type: "delivery" | "pickup"
  delivery_zone_name: string | null
  delivery_estimated_minutes: number | null
  total_cents: number
  created_at: string
}

export type OrderTrackingItem = {
  product_name: string
  quantity: number
  unit_price_cents: number
  subtotal_cents: number
}

export async function getOrderTracking(
  supabase: SupabaseClient,
  orderId: string,
) {
  const { data, error } = await supabase
    .rpc("get_order_tracking", { p_order_id: orderId })
    .single<OrderTracking>()

  if (error || !data || data.order_number === null) {
    return { data: null as OrderTracking | null, error }
  }

  return { data, error: null }
}

export async function getOrderTrackingItems(
  supabase: SupabaseClient,
  orderId: string,
) {
  const { data, error } = await supabase.rpc("get_order_tracking_items", {
    p_order_id: orderId,
  })

  return { data: (data ?? null) as OrderTrackingItem[] | null, error }
}
