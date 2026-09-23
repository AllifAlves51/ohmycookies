import type { SupabaseClient } from "@supabase/supabase-js"
import type { DashboardOrder } from "@/lib/services/dashboard"
import type { OrderStatus, PaymentPreference } from "@/lib/services/order"

export type ReportOrder = DashboardOrder & { delivery_fee_cents: number }

export function getOrdersInRange(
  supabase: SupabaseClient,
  storeId: string,
  from: Date,
  to: Date,
) {
  return supabase
    .from("orders")
    .select("id, status, total_cents, delivery_fee_cents, created_at")
    .eq("store_id", storeId)
    .gte("created_at", from.toISOString())
    .lte("created_at", to.toISOString())
    .returns<ReportOrder[]>()
}

export type ProductSoldRow = {
  product_id: string | null
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
      "product_id, product_name, quantity, subtotal_cents, orders!inner(store_id, status, created_at)",
    )
    .eq("orders.store_id", storeId)
    .neq("orders.status", "cancelled")
    .gte("orders.created_at", from.toISOString())
    .lte("orders.created_at", to.toISOString())

  if (error || !data) {
    return { data: null as ProductSoldRow[] | null, error }
  }

  const totals = new Map<
    string,
    { product_id: string | null; quantity: number; revenueCents: number }
  >()
  for (const row of data as unknown as {
    product_id: string | null
    product_name: string
    quantity: number
    subtotal_cents: number
  }[]) {
    const current = totals.get(row.product_name) ?? {
      product_id: row.product_id,
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

export type RevenueByCategoryRow = { category: string; revenueCents: number }

/** Groups sold items' revenue by the product's category name (falling back
 * to "Sem categoria"), same store/date-range/cancelled-exclusion rules as
 * getProductsSoldInRange. */
export async function getRevenueByCategoryInRange(
  supabase: SupabaseClient,
  storeId: string,
  from: Date,
  to: Date,
) {
  const { data, error } = await supabase
    .from("order_items")
    .select(
      "subtotal_cents, products(category:categories(name)), orders!inner(store_id, status, created_at)",
    )
    .eq("orders.store_id", storeId)
    .neq("orders.status", "cancelled")
    .gte("orders.created_at", from.toISOString())
    .lte("orders.created_at", to.toISOString())

  if (error || !data) {
    return { data: null as RevenueByCategoryRow[] | null, error }
  }

  const totals = new Map<string, number>()
  for (const row of data as unknown as {
    subtotal_cents: number
    products: { category: { name: string } | null } | null
  }[]) {
    const category = row.products?.category?.name ?? "Sem categoria"
    totals.set(category, (totals.get(category) ?? 0) + row.subtotal_cents)
  }

  const sorted = Array.from(totals.entries())
    .map(([category, revenueCents]) => ({ category, revenueCents }))
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

export type ReportStats = {
  revenueCents: number
  orderCount: number
  averageTicketCents: number
  deliveryFeesCents: number
}

/** Cancelled orders never became real sales — excluded from every metric
 * except the raw status breakdown below. */
export function computeReportStats(orders: ReportOrder[]): ReportStats {
  const counted = orders.filter((o) => o.status !== "cancelled")
  const revenueCents = counted.reduce((sum, o) => sum + o.total_cents, 0)
  const deliveryFeesCents = counted.reduce(
    (sum, o) => sum + o.delivery_fee_cents,
    0,
  )
  const orderCount = counted.length

  return {
    revenueCents,
    orderCount,
    averageTicketCents:
      orderCount > 0 ? Math.round(revenueCents / orderCount) : 0,
    deliveryFeesCents,
  }
}

function percentDelta(current: number, previous: number): number | null {
  if (previous === 0) return null
  return Math.round(((current - previous) / previous) * 100)
}

export type ReportDeltas = {
  revenueDeltaPct: number | null
  orderCountDeltaPct: number | null
  averageTicketDeltaPct: number | null
  deliveryFeesDeltaPct: number | null
}

export function computeReportDeltas(
  current: ReportStats,
  previous: ReportStats,
): ReportDeltas {
  return {
    revenueDeltaPct: percentDelta(current.revenueCents, previous.revenueCents),
    orderCountDeltaPct: percentDelta(current.orderCount, previous.orderCount),
    averageTicketDeltaPct: percentDelta(
      current.averageTicketCents,
      previous.averageTicketCents,
    ),
    deliveryFeesDeltaPct: percentDelta(
      current.deliveryFeesCents,
      previous.deliveryFeesCents,
    ),
  }
}

export type OrdersByStatusCounts = {
  completed: number
  preparing: number
  outForDelivery: number
  cancelled: number
  total: number
}

export function computeOrdersByStatus(
  orders: ReportOrder[],
): OrdersByStatusCounts {
  return {
    completed: orders.filter((o) => o.status === "completed").length,
    preparing: orders.filter((o) => o.status === "preparing").length,
    outForDelivery: orders.filter((o) => o.status === "out_for_delivery")
      .length,
    cancelled: orders.filter((o) => o.status === "cancelled").length,
    total: orders.length,
  }
}

export type RevenueByDay = { date: string; revenueCents: number }

/** Buckets revenue by calendar day across the exact [from, to] range
 * (unlike the dashboard's trailing-N-days-from-today version). */
export function computeRevenueByDayInRange(
  orders: ReportOrder[],
  from: Date,
  to: Date,
): RevenueByDay[] {
  const counted = orders.filter((o) => o.status !== "cancelled")
  const buckets = new Map<string, number>()

  const cursor = new Date(from)
  cursor.setHours(0, 0, 0, 0)
  const end = new Date(to)
  end.setHours(0, 0, 0, 0)

  while (cursor.getTime() <= end.getTime()) {
    buckets.set(cursor.toISOString().slice(0, 10), 0)
    cursor.setDate(cursor.getDate() + 1)
  }

  for (const order of counted) {
    const key = order.created_at.slice(0, 10)
    if (buckets.has(key)) {
      buckets.set(key, (buckets.get(key) ?? 0) + order.total_cents)
    }
  }

  return Array.from(buckets.entries()).map(([date, revenueCents]) => ({
    date,
    revenueCents,
  }))
}

export type OrdersEvolutionDay = {
  date: string
  completed: number
  preparing: number
  outForDelivery: number
  cancelled: number
}

export function computeOrdersEvolutionByDay(
  orders: ReportOrder[],
  from: Date,
  to: Date,
): OrdersEvolutionDay[] {
  const buckets = new Map<string, OrdersEvolutionDay>()

  const cursor = new Date(from)
  cursor.setHours(0, 0, 0, 0)
  const end = new Date(to)
  end.setHours(0, 0, 0, 0)

  while (cursor.getTime() <= end.getTime()) {
    const key = cursor.toISOString().slice(0, 10)
    buckets.set(key, {
      date: key,
      completed: 0,
      preparing: 0,
      outForDelivery: 0,
      cancelled: 0,
    })
    cursor.setDate(cursor.getDate() + 1)
  }

  for (const order of orders) {
    const key = order.created_at.slice(0, 10)
    const bucket = buckets.get(key)
    if (!bucket) continue

    if (order.status === "completed") bucket.completed += 1
    else if (order.status === "preparing") bucket.preparing += 1
    else if (order.status === "out_for_delivery") bucket.outForDelivery += 1
    else if (order.status === "cancelled") bucket.cancelled += 1
  }

  return Array.from(buckets.values())
}
