import type { SupabaseClient } from "@supabase/supabase-js"
import type { AddressInput } from "@/lib/validations/store"
import type { OrderStatus } from "@/lib/services/order"

export type Customer = {
  id: string
  store_id: string
  name: string
  whatsapp: string
  address: AddressInput | null
  created_at: string
  updated_at: string
}

export type CustomerOrder = {
  id: string
  order_number: number
  status: OrderStatus
  total_cents: number
  created_at: string
  customer_id: string
}

export type CustomerWithStats = Customer & {
  orders: CustomerOrder[]
  orderCount: number
  totalSpentCents: number
  lastOrderAt: string | null
}

export function getCustomers(supabase: SupabaseClient, storeId: string) {
  return supabase
    .from("customers")
    .select("*")
    .eq("store_id", storeId)
    .order("created_at", { ascending: false })
    .returns<Customer[]>()
}

export function getCustomerOrders(supabase: SupabaseClient, storeId: string) {
  return supabase
    .from("orders")
    .select("id, order_number, status, total_cents, created_at, customer_id")
    .eq("store_id", storeId)
    .order("created_at", { ascending: false })
    .returns<CustomerOrder[]>()
}

/**
 * A cancelled order never became a real sale, so it's excluded from the
 * order count, total spent, and "last purchase" date — but customers keep
 * showing up even with zero completed orders.
 */
export function buildCustomersWithStats(
  customers: Customer[],
  orders: CustomerOrder[],
): CustomerWithStats[] {
  const ordersByCustomer = new Map<string, CustomerOrder[]>()
  for (const order of orders) {
    const list = ordersByCustomer.get(order.customer_id) ?? []
    list.push(order)
    ordersByCustomer.set(order.customer_id, list)
  }

  return customers.map((customer) => {
    const customerOrders = ordersByCustomer.get(customer.id) ?? []
    const countedOrders = customerOrders.filter((o) => o.status !== "cancelled")

    return {
      ...customer,
      orders: customerOrders,
      orderCount: countedOrders.length,
      totalSpentCents: countedOrders.reduce((sum, o) => sum + o.total_cents, 0),
      lastOrderAt: countedOrders[0]?.created_at ?? null,
    }
  })
}
