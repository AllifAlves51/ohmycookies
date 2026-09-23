import type { SupabaseClient } from "@supabase/supabase-js"
import type { DashboardOrder } from "@/lib/services/dashboard"
import type { OrderStatus, PaymentPreference } from "@/lib/services/order"

export function getOrdersInRange(
  supabase: SupabaseClient,
  storeId: string,
  from: Date,
  to: Date,
) {
  return supabase
    .from("orders")
    .select("id, status, total_cents, created_at")
    .eq("store_id", storeId)
    .gte("created_at", from.toISOString())
    .lte("created_at", to.toISOString())
    .returns<DashboardOrder[]>()
}

export type ProductSoldRow = {
  product_name: string
  quantity: number
  revenueCents: number
}

/**
 * order_items has no store_id or created_at of its own, so both the store
 * scope and the date range go through an inner join on orders; cancelled
 * orders never became real sales and are excluded.
 */
export async function getProductsSoldInRange(
  supabase: SupabaseClient,
  storeId: string,
  from: Date,
  to: Date,
) {
  const { data, error } = await supabase
    .from("order_items")
    .select(
      "product_name, quantity, subtotal_cents, orders!inner(store_id, status, created_at)",
    )
    .eq("orders.store_id", storeId)
    .neq("orders.status", "cancelled")
    .gte("orders.created_at", from.toISOString())
    .lte("orders.created_at", to.toISOString())

  if (error || !data) {
    return { data: null as ProductSoldRow[] | null, error }
  }

  const totals = new Map<string, { quantity: number; revenueCents: number }>()
  for (const row of data as unknown as {
    product_name: string
    quantity: number
    subtotal_cents: number
  }[]) {
    const current = totals.get(row.product_name) ?? {
      quantity: 0,
      revenueCents: 0,
    }
    current.quantity += row.quantity
    current.revenueCents += row.subtotal_cents
    totals.set(row.product_name, current)
  }

  const sorted = Array.from(totals.entries())
    .map(([product_name, stats]) => ({ product_name, ...stats }))
    .sort((a, b) => b.revenueCents - a.revenueCents)

  return { data: sorted, error: null }
}

type OrderPaymentRow = {
  payment_preference: PaymentPreference | null
  status: OrderStatus
}

export function getOrdersPaymentInRange(
  supabase: SupabaseClient,
  storeId: string,
  from: Date,
  to: Date,
) {
  return supabase
    .from("orders")
    .select("payment_preference, status")
    .eq("store_id", storeId)
    .gte("created_at", from.toISOString())
    .lte("created_at", to.toISOString())
    .returns<OrderPaymentRow[]>()
}

export type PaymentBreakdownRow = { method: PaymentPreference; count: number }

/** Cancelled orders and orders placed before this feature existed (null
 * preference) are excluded — the chart only reflects real, known choices. */
export function computePaymentBreakdown(
  rows: OrderPaymentRow[],
): PaymentBreakdownRow[] {
  const totals = new Map<PaymentPreference, number>()

  for (const row of rows) {
    if (row.status === "cancelled" || !row.payment_preference) continue
    totals.set(
      row.payment_preference,
      (totals.get(row.payment_preference) ?? 0) + 1,
    )
  }

  return Array.from(totals.entries()).map(([method, count]) => ({
    method,
    count,
  }))
}
