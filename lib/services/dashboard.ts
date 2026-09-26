import type { SupabaseClient } from "@supabase/supabase-js"
import type { OrderStatus } from "@/lib/services/order"
import { addDays, storeDayBounds, storeDayKey } from "@/lib/utils/store-date"

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

export type DashboardCustomer = { id: string; created_at: string }

export function getDashboardCustomers(
  supabase: SupabaseClient,
  storeId: string,
) {
  return supabase
    .from("customers")
    .select("id, created_at")
    .eq("store_id", storeId)
    .returns<DashboardCustomer[]>()
}

export type TopProductRow = {
  product_id: string | null
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
    .select(
      "product_id, product_name, quantity, orders!inner(store_id, status)",
    )
    .eq("orders.store_id", storeId)
    .neq("orders.status", "cancelled")

  if (error || !data) {
    return { data: null as TopProductRow[] | null, error }
  }

  const totals = new Map<
    string,
    { product_id: string | null; quantity: number }
  >()
  for (const row of data as unknown as {
    product_id: string | null
    product_name: string
    quantity: number
  }[]) {
    const current = totals.get(row.product_name) ?? {
      product_id: row.product_id,
      quantity: 0,
    }
    current.quantity += row.quantity
    totals.set(row.product_name, current)
  }

  const sorted = Array.from(totals.entries())
    .map(([product_name, stats]) => ({ product_name, ...stats }))
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

function isWithin(iso: string, start: Date, end: Date) {
  const t = new Date(iso).getTime()
  return t >= start.getTime() && t < end.getTime()
}

function onDay<T extends { created_at: string }>(rows: T[], dayKey: string) {
  const { start, end } = storeDayBounds(dayKey)
  return rows.filter((row) => isWithin(row.created_at, start, end))
}

export type DayComparison = DashboardStats & {
  revenueDeltaPct: number | null
  orderCountDeltaPct: number | null
  averageTicketDeltaPct: number | null
}

/** A store-local day's headline stats vs. the day before — the dashboard's
 * stat cards, for whichever day the date picker selects. */
export function computeDayVsPrevious(
  orders: DashboardOrder[],
  dayKey: string,
): DayComparison {
  const dayStats = computeDashboardStats(onDay(orders, dayKey))
  const previousStats = computeDashboardStats(
    onDay(orders, addDays(dayKey, -1)),
  )

  return {
    ...dayStats,
    revenueDeltaPct: percentDelta(
      dayStats.revenueCents,
      previousStats.revenueCents,
    ),
    orderCountDeltaPct: percentDelta(
      dayStats.orderCount,
      previousStats.orderCount,
    ),
    averageTicketDeltaPct: percentDelta(
      dayStats.averageTicketCents,
      previousStats.averageTicketCents,
    ),
  }
}

export function computeNewCustomersDayVsPrevious(
  customers: DashboardCustomer[],
  dayKey: string,
) {
  const count = onDay(customers, dayKey).length
  const previousCount = onDay(customers, addDays(dayKey, -1)).length
  return { count, deltaPct: percentDelta(count, previousCount) }
}

export type OrdersInProgressCounts = {
  preparing: number
  outForDelivery: number
  completed: number
  cancelled: number
}

/** How many of that day's orders currently sit in each of these statuses. */
export function computeOrdersInProgressOn(
  orders: DashboardOrder[],
  dayKey: string,
): OrdersInProgressCounts {
  const dayOrders = onDay(orders, dayKey)

  return {
    preparing: dayOrders.filter((o) => o.status === "preparing").length,
    outForDelivery: dayOrders.filter((o) => o.status === "out_for_delivery")
      .length,
    completed: dayOrders.filter((o) => o.status === "completed").length,
    cancelled: dayOrders.filter((o) => o.status === "cancelled").length,
  }
}

export type RevenueByDay = { date: string; revenueCents: number }

/** Revenue per store-local day for the `days` days ending today. */
export function computeRevenueByDay(
  orders: DashboardOrder[],
  days: number,
): RevenueByDay[] {
  const counted = orders.filter((o) => o.status !== "cancelled")
  const buckets = new Map<string, number>()
  const today = storeDayKey()

  for (let i = days - 1; i >= 0; i--) {
    buckets.set(addDays(today, -i), 0)
  }

  for (const order of counted) {
    const key = storeDayKey(new Date(order.created_at))
    if (buckets.has(key)) {
      buckets.set(key, (buckets.get(key) ?? 0) + order.total_cents)
    }
  }

  return Array.from(buckets.entries()).map(([date, revenueCents]) => ({
    date,
    revenueCents,
  }))
}
