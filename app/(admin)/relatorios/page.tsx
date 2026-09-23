import { Wallet, ClipboardList, Receipt, Bike } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { getStoreByOwnerId } from "@/lib/services/store"
import { getProducts } from "@/lib/services/product"
import {
  getOrdersInRange,
  getProductsSoldInRange,
  getOrdersPaymentInRange,
  getRevenueByCategoryInRange,
  computePaymentBreakdown,
  computeReportStats,
  computeReportDeltas,
  computeOrdersByStatus,
  computeRevenueByDayInRange,
  computeOrdersEvolutionByDay,
} from "@/lib/services/report"
import {
  getReportDateRange,
  getPreviousDateRange,
  isReportPeriod,
  type ReportPeriod,
} from "@/lib/utils/report-period"
import { formatBRL } from "@/lib/utils/money"
import { firstNameFromEmail } from "@/lib/utils/user"
import { StatCard } from "@/components/admin/dashboard/stat-card"
import { PaymentBreakdownChart } from "@/components/admin/dashboard/payment-breakdown-chart"
import { TopProductsList } from "@/components/admin/dashboard/top-products-list"
import { UserAvatar } from "@/components/admin/user-avatar"
import { ReportPeriodSelect } from "@/components/admin/reports/report-period-select"
import { ReportRevenueChart } from "@/components/admin/reports/report-revenue-chart"
import { OrdersByStatusChart } from "@/components/admin/reports/orders-by-status-chart"
import { RevenueByCategoryList } from "@/components/admin/reports/revenue-by-category-list"
import { OrdersEvolutionChart } from "@/components/admin/reports/orders-evolution-chart"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default async function RelatoriosPage({
  searchParams,
}: PageProps<"/relatorios">) {
  const params = await searchParams
  const period: ReportPeriod = isReportPeriod(params.period)
    ? params.period
    : "7d"

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

  const { from, to } = getReportDateRange(period)
  const previous = getPreviousDateRange(from, to)

  const [
    { data: orders },
    { data: previousOrders },
    { data: products },
    { data: paymentRows },
    { data: revenueByCategory },
    { data: allProducts },
  ] = await Promise.all([
    getOrdersInRange(supabase, store.id, from, to),
    getOrdersInRange(supabase, store.id, previous.from, previous.to),
    getProductsSoldInRange(supabase, store.id, from, to),
    getOrdersPaymentInRange(supabase, store.id, from, to),
    getRevenueByCategoryInRange(supabase, store.id, from, to),
    getProducts(supabase, store.id),
  ])

  const stats = computeReportStats(orders ?? [])
  const deltas = computeReportDeltas(
    stats,
    computeReportStats(previousOrders ?? []),
  )
  const paymentBreakdown = computePaymentBreakdown(paymentRows ?? [])
  const statusCounts = computeOrdersByStatus(orders ?? [])
  const revenueByDay = computeRevenueByDayInRange(orders ?? [], from, to)
  const ordersEvolution = computeOrdersEvolutionByDay(orders ?? [], from, to)

  const productImageById = new Map(
    (allProducts ?? []).map((product) => [product.id, product.image_url]),
  )
  const topProductsWithImages = (products ?? [])
    .slice(0, 5)
    .map((product) => ({
      ...product,
      image_url: product.product_id
        ? (productImageById.get(product.product_id) ?? null)
        : null,
    }))

  const avatarUrl =
    typeof user.user_metadata?.avatar_url === "string"
      ? user.user_metadata.avatar_url
      : null
  const name = firstNameFromEmail(user.email ?? "")

  return (
    <main className="mx-auto max-w-6xl space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Relatórios</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Acompanhe o desempenho da sua loja.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <ReportPeriodSelect period={period} />
          <UserAvatar name={name} avatarUrl={avatarUrl} />
        </div>
      </div>

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
          label="Taxas de entrega"
          value={formatBRL(stats.deliveryFeesCents)}
          icon={Bike}
          deltaPct={deltas.deliveryFeesDeltaPct}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <ReportRevenueChart data={revenueByDay} />
        <Card>
          <CardHeader>
            <CardTitle>Formas de pagamento</CardTitle>
          </CardHeader>
          <CardContent>
            <PaymentBreakdownChart data={paymentBreakdown} />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <TopProductsList products={topProductsWithImages} />
        <Card>
          <CardHeader>
            <CardTitle>Pedidos por status</CardTitle>
          </CardHeader>
          <CardContent>
            <OrdersByStatusChart counts={statusCounts} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Faturamento por categoria</CardTitle>
          </CardHeader>
          <CardContent>
            <RevenueByCategoryList data={revenueByCategory ?? []} />
          </CardContent>
        </Card>
      </div>

      <OrdersEvolutionChart data={ordersEvolution} />
    </main>
  )
}
