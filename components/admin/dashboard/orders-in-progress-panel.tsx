import Link from "next/link"
import type { OrdersInProgressCounts } from "@/lib/services/dashboard"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const ROWS: {
  key: keyof OrdersInProgressCounts
  label: string
  dot: string
}[] = [
  { key: "preparing", label: "Em preparo", dot: "bg-amber-400" },
  { key: "outForDelivery", label: "Saiu para entrega", dot: "bg-blue-400" },
  { key: "completed", label: "Concluídos", dot: "bg-green-500" },
  { key: "cancelled", label: "Cancelados", dot: "bg-gray-400" },
]

export function OrdersInProgressPanel({
  counts,
}: {
  counts: OrdersInProgressCounts
}) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle>Pedidos em andamento</CardTitle>
        <Link
          href="/pedidos"
          className="text-primary text-sm font-medium hover:underline"
        >
          Ver todos
        </Link>
      </CardHeader>
      <CardContent>
        <ul className="divide-y">
          {ROWS.map((row) => (
            <li
              key={row.key}
              className="flex items-center justify-between py-2 text-sm"
            >
              <span className="flex items-center gap-2">
                <span className={`size-2.5 rounded-full ${row.dot}`} />
                {row.label}
              </span>
              <span className="font-semibold tabular-nums">
                {counts[row.key]}
              </span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}
