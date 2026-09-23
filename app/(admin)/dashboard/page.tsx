import { Wallet, ClipboardList, Receipt, Users } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { getStoreByOwnerId } from "@/lib/services/store"
import { getOrders } from "@/lib/services/order"
import {
  getDashboardOrders,
  getCustomerCount,
  getTopProducts,
  computeDashboardStats,
  computeDashboardDeltas,
  computeRevenueByDay,
} from "@/lib/services/dashboard"
import { formatBRL } from "@/lib/utils/money"
import { StatCard } from "@/components/admin/dashboard/stat-card"
import { RevenueChart } from "@/components/admin/dashboard/revenue-chart"
import { TopProductsList } from "@/components/admin/dashboard/top-products-list"
import { RecentOrdersList } from "@/components/admin/dashboard/recent-orders-list"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const REVENUE_CHART_DAYS = 14

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
    { count: customerCount },
    { data: topProducts },
    { data: recentOrders },
  ] = await Promise.all([
    getDashboardOrders(supabase, store.id),
    getCustomerCount(supabase, store.id),
    getTopProducts(supabase, store.id),
    getOrders(supabase, store.id),
  ])

  const orders = dashboardOrders ?? []
  const stats = computeDashboardStats(orders)
  const deltas = computeDashboardDeltas(orders)
  const revenueByDay = computeRevenueByDay(orders, REVENUE_CHART_DAYS)

  return (
    <main className="mx-auto max-w-4xl space-y-6 p-6">
      <h1 className="text-2xl font-semibold">Dashboard</h1>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard
          label="Faturamento"
          value={formatBRL(stats.revenueCents)}
          icon={Wallet}
          deltaPct={deltas.revenueDeltaPct}
        />
        <StatCard
          label="Pedidos"
          value={String(stats.orderCount)}
          icon={ClipboardList}
          deltaPct={deltas.orderCountDeltaPct}
        />
        <StatCard
          label="Ticket médio"
          value={formatBRL(stats.averageTicketCents)}
          icon={Receipt}
          deltaPct={deltas.averageTicketDeltaPct}
        />
        <StatCard
          label="Clientes"
          value={String(customerCount ?? 0)}
          icon={Users}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            Faturamento nos últimos {REVENUE_CHART_DAYS} dias
          </CardTitle>
        </CardHeader>
        <CardContent>
          <RevenueChart data={revenueByDay} />
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Produtos mais vendidos</CardTitle>
          </CardHeader>
          <CardContent>
            <TopProductsList products={topProducts ?? []} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pedidos recentes</CardTitle>
          </CardHeader>
          <CardContent>
            <RecentOrdersList orders={(recentOrders ?? []).slice(0, 5)} />
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
