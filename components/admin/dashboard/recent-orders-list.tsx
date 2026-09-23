import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { STATUS_COLUMNS, type OrderWithCustomer } from "@/lib/services/order"
import { formatBRL } from "@/lib/utils/money"
import { Badge } from "@/components/ui/badge"

const STATUS_INFO = new Map(STATUS_COLUMNS.map((c) => [c.status, c]))

export function RecentOrdersList({ orders }: { orders: OrderWithCustomer[] }) {
  if (orders.length === 0) {
    return <p className="text-muted-foreground text-sm">Nenhum pedido ainda.</p>
  }

  return (
    <ul className="divide-y">
      {orders.map((order) => (
        <li
          key={order.id}
          className="flex items-center justify-between py-2 text-sm"
        >
          <div className="min-w-0">
            <p className="font-medium">
              #{order.order_number} — {order.customer?.name ?? "Cliente"}
            </p>
            <p className="text-muted-foreground text-xs">
              {format(new Date(order.created_at), "dd/MM/yyyy HH:mm", {
                locale: ptBR,
              })}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={STATUS_INFO.get(order.status)?.badgeClassName}>
              {STATUS_INFO.get(order.status)?.label}
            </Badge>
            <span className="font-semibold">
              {formatBRL(order.total_cents)}
            </span>
          </div>
        </li>
      ))}
    </ul>
  )
}
