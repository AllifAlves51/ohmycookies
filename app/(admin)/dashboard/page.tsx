import { Wallet, ClipboardList, Receipt, UserPlus } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { getStoreByOwnerId } from "@/lib/services/store"
import { getProducts } from "@/lib/services/product"
import {
  getDashboardOrders,
  getDashboardCustomers,
  getTopProducts,
  computeTodayVsYesterday,
  computeNewCustomersTodayVsYesterday,
  computeOrdersInProgressToday,
  computeRevenueByDay,
} from "@/lib/services/dashboard"
import { formatBRL } from "@/lib/utils/money"
import { firstNameFromEmail } from "@/lib/utils/user"
import { StatCard } from "@/components/admin/dashboard/stat-card"
import { DashboardHeader } from "@/components/admin/dashboard/dashboard-header"
import { RevenueChart } from "@/components/admin/dashboard/revenue-chart"
import { TopProductsList } from "@/components/admin/dashboard/top-products-list"
import { OrdersInProgressPanel } from "@/components/admin/dashboard/orders-in-progress-panel"
import { PromoBanner } from "@/components/admin/dashboard/promo-banner"

const REVENUE_CHART_DAYS = 30

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  const { data: store } = await getStoreByOwnerId(supabase, user.id)

  if (!store) {
    return (
      <main className="p-6">
        <p className="text-muted-foreground text-sm">
          Não foi possível carregar os dados da loja. Tente recarregar a página.
        </p>
      </main>
    )
  }

  const [
    { data: dashboardOrders },
    { data: dashboardCustomers },
    { data: topProducts },
    { data: products },
  ] = await Promise.all([
    getDashboardOrders(supabase, store.id),
    getDashboardCustomers(supabase, store.id),
    getTopProducts(supabase, store.id),
    getProducts(supabase, store.id),
  ])

  const orders = dashboardOrders ?? []
  const customers = dashboardCustomers ?? []

  const todayStats = computeTodayVsYesterday(orders)
  const newCustomers = computeNewCustomersTodayVsYesterday(customers)
  const ordersInProgress = computeOrdersInProgressToday(orders)
  const revenueByDay = computeRevenueByDay(orders, REVENUE_CHART_DAYS)

  const productImageById = new Map(
    (products ?? []).map((product) => [product.id, product.image_url]),
  )
  const topProductsWithImages = (topProducts ?? []).map((product) => ({
    ...product,
    image_url: product.product_id
      ? (productImageById.get(product.product_id) ?? null)
      : null,
  }))

  const name = firstNameFromEmail(user.email ?? "")
  const avatarUrl =
    typeof user.user_metadata?.avatar_url === "string"
      ? user.user_metadata.avatar_url
      : null

  return (
    <main className="mx-auto max-w-6xl space-y-6 p-6">
      <DashboardHeader name={name} avatarUrl={avatarUrl} />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard
          label="Faturamento hoje"
          value={formatBRL(todayStats.revenueCents)}
          icon={Wallet}
          deltaPct={todayStats.revenueDeltaPct}
        />
        <StatCard
          label="Pedidos"
          value={String(todayStats.orderCount)}
          icon={ClipboardList}
          deltaPct={todayStats.orderCountDeltaPct}
        />
        <StatCard
          label="Ticket médio"
          value={formatBRL(todayStats.averageTicketCents)}
          icon={Receipt}
          deltaPct={todayStats.averageTicketDeltaPct}
        />
        <StatCard
          label="Clientes novos"
          value={String(newCustomers.todayCount)}
          icon={UserPlus}
          deltaPct={newCustomers.deltaPct}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <RevenueChart data={revenueByDay} />
        <TopProductsList products={topProductsWithImages} />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <PromoBanner photoUrl={store.login_photo_url} />
        <OrdersInProgressPanel counts={ordersInProgress} />
      </div>
    </main>
  )
}
