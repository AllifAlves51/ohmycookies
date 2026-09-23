import Link from "next/link"
import { Wallet, ClipboardList, Receipt } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { getStoreByOwnerId } from "@/lib/services/store"
import { getOrdersInRange, getProductsSoldInRange } from "@/lib/services/report"
import { computeDashboardStats } from "@/lib/services/dashboard"
import {
  REPORT_PERIODS,
  getReportDateRange,
  isReportPeriod,
  type ReportPeriod,
} from "@/lib/utils/report-period"
import { formatBRL } from "@/lib/utils/money"
import { cn } from "@/lib/utils"
import { StatCard } from "@/components/admin/dashboard/stat-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

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

  const [{ data: orders }, { data: products }] = await Promise.all([
    getOrdersInRange(supabase, store.id, from, to),
    getProductsSoldInRange(supabase, store.id, from, to),
  ])

  const stats = computeDashboardStats(orders ?? [])

  return (
    <main className="mx-auto max-w-3xl space-y-6 p-6">
      <h1 className="text-2xl font-semibold">Relatórios</h1>

      <div className="flex flex-wrap gap-2">
        {REPORT_PERIODS.map((option) => (
          <Link
            key={option.value}
            href={`/relatorios?period=${option.value}`}
            className={cn(
              "rounded-lg border px-3 py-1.5 text-sm",
              option.value === period
                ? "bg-primary text-primary-foreground border-transparent"
                : "hover:bg-muted",
            )}
          >
            {option.label}
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-4">
        <StatCard
          label="Faturamento"
          value={formatBRL(stats.revenueCents)}
          icon={Wallet}
        />
        <StatCard
          label="Pedidos"
          value={String(stats.orderCount)}
          icon={ClipboardList}
        />
        <StatCard
          label="Ticket médio"
          value={formatBRL(stats.averageTicketCents)}
          icon={Receipt}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Produtos vendidos no período</CardTitle>
        </CardHeader>
        <CardContent>
          {products && products.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produto</TableHead>
                  <TableHead>Quantidade</TableHead>
                  <TableHead>Receita</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product) => (
                  <TableRow key={product.product_name}>
                    <TableCell>{product.product_name}</TableCell>
                    <TableCell>{product.quantity}</TableCell>
                    <TableCell>{formatBRL(product.revenueCents)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-muted-foreground text-sm">
              Nenhuma venda no período selecionado.
            </p>
          )}
        </CardContent>
      </Card>
    </main>
  )
}
