import type { SupabaseClient } from "@supabase/supabase-js"
import type { OrderStatus } from "@/lib/services/order"

export type DashboardOrder = {
  id: string
  status: OrderStatus
  total_cents: number
  created_at: string
}

export function getDashboardOrders(supabase: SupabaseClient, storeId: string) {
  return supabase
    .from("orders")
    .select("id, status, total_cents, created_at")
    .eq("store_id", storeId)
    .returns<DashboardOrder[]>()
}

export function getCustomerCount(supabase: SupabaseClient, storeId: string) {
  return supabase
    .from("customers")
    .select("id", { count: "exact", head: true })
    .eq("store_id", storeId)
}

export type TopProductRow = {
  product_name: string
  quantity: number
}

/**
 * order_items has no store_id of its own, so store scoping goes through an
 * inner join on orders; cancelled orders never became real sales and are
 * excluded, same convention as the customers stats.
 */
export async function getTopProducts(
  supabase: SupabaseClient,
  storeId: string,
  limit = 5,
) {
  const { data, error } = await supabase
    .from("order_items")
    .select("product_name, quantity, orders!inner(store_id, status)")
    .eq("orders.store_id", storeId)
    .neq("orders.status", "cancelled")

  if (error || !data) {
    return { data: null as TopProductRow[] | null, error }
  }

  const totals = new Map<string, number>()
  for (const row of data as unknown as {
    product_name: string
    quantity: number
  }[]) {
    totals.set(
      row.product_name,
      (totals.get(row.product_name) ?? 0) + row.quantity,
    )
  }

  const sorted = Array.from(totals.entries())
    .map(([product_name, quantity]) => ({ product_name, quantity }))
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, limit)

  return { data: sorted, error: null }
}

export type DashboardStats = {
  revenueCents: number
  orderCount: number
  averageTicketCents: number
}

/** Cancelled orders never became real sales — excluded from every metric here. */
export function computeDashboardStats(
  orders: DashboardOrder[],
): DashboardStats {
  const counted = orders.filter((o) => o.status !== "cancelled")
  const revenueCents = counted.reduce((sum, o) => sum + o.total_cents, 0)
  const orderCount = counted.length

  return {
    revenueCents,
    orderCount,
    averageTicketCents:
      orderCount > 0 ? Math.round(revenueCents / orderCount) : 0,
  }
}

export type DashboardDeltas = {
  revenueDeltaPct: number | null
  orderCountDeltaPct: number | null
  averageTicketDeltaPct: number | null
}

function percentDelta(current: number, previous: number): number | null {
  if (previous === 0) return null
  return Math.round(((current - previous) / previous) * 100)
}

/**
 * Compares the trailing `days`-day window against the equal-length window
 * before it — independent of computeDashboardStats' all-time totals, which
 * the stat cards keep showing as their headline value.
 */
export function computeDashboardDeltas(
  orders: DashboardOrder[],
  days = 30,
): DashboardDeltas {
  const dayMs = 24 * 60 * 60 * 1000
  const now = Date.now()
  const currentStart = now - days * dayMs
  const previousStart = now - days * 2 * dayMs

  const currentOrders = orders.filter((o) => {
    const t = new Date(o.created_at).getTime()
    return t >= currentStart && t <= now
  })
  const previousOrders = orders.filter((o) => {
    const t = new Date(o.created_at).getTime()
    return t >= previousStart && t < currentStart
  })

  const current = computeDashboardStats(currentOrders)
  const previous = computeDashboardStats(previousOrders)

  return {
    revenueDeltaPct: percentDelta(current.revenueCents, previous.revenueCents),
    orderCountDeltaPct: percentDelta(current.orderCount, previous.orderCount),
    averageTicketDeltaPct: percentDelta(
      current.averageTicketCents,
      previous.averageTicketCents,
    ),
  }
}

export type RevenueByDay = { date: string; revenueCents: number }

export function computeRevenueByDay(
  orders: DashboardOrder[],
  days: number,
): RevenueByDay[] {
  const counted = orders.filter((o) => o.status !== "cancelled")
  const buckets = new Map<string, number>()

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    buckets.set(d.toISOString().slice(0, 10), 0)
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
