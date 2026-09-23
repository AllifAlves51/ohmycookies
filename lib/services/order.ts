import type { SupabaseClient } from "@supabase/supabase-js"

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
}[] = [
  {
    status: "new",
    label: "Novo",
    badgeClassName: "bg-red-100 text-red-700",
  },
  {
    status: "confirmed",
    label: "Confirmado",
    badgeClassName: "bg-amber-100 text-amber-700",
  },
  {
    status: "preparing",
    label: "Em preparo",
    badgeClassName: "bg-blue-100 text-blue-700",
  },
  {
    status: "out_for_delivery",
    label: "Saiu para entrega",
    badgeClassName: "bg-purple-100 text-purple-700",
  },
  {
    status: "completed",
    label: "Concluído",
    badgeClassName: "bg-green-100 text-green-700",
  },
  {
    status: "cancelled",
    label: "Cancelado",
    badgeClassName: "bg-gray-200 text-gray-600",
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

export function getOrders(supabase: SupabaseClient, storeId: string) {
  return supabase
    .from("orders")
    .select("*, customer:customers(name, whatsapp)")
    .eq("store_id", storeId)
    .order("created_at", { ascending: false })
    .returns<OrderWithCustomer[]>()
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
