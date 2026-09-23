"use client"

import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Bike, ShoppingBag } from "lucide-react"
import type { OrderWithCustomer } from "@/lib/services/order"
import { formatBRL } from "@/lib/utils/money"
import { Badge } from "@/components/ui/badge"

export function OrderCard({
  order,
  onDragStart,
}: {
  order: OrderWithCustomer
  onDragStart: (orderId: string) => void
}) {
  return (
    <div
      draggable
      onDragStart={(event) => {
        event.dataTransfer.setData("text/plain", order.id)
        onDragStart(order.id)
      }}
      className="bg-card cursor-grab space-y-1.5 rounded-lg border p-3 text-sm active:cursor-grabbing"
    >
      <div className="flex items-center justify-between">
        <span className="font-medium">#{order.order_number}</span>
        <Badge variant="secondary" className="gap-1">
          {order.fulfillment_type === "delivery" ? (
            <Bike className="size-3" />
          ) : (
            <ShoppingBag className="size-3" />
          )}
          {order.fulfillment_type === "delivery" ? "Entrega" : "Retirada"}
        </Badge>
      </div>
      <p className="truncate font-medium">
        {order.customer?.name ?? "Cliente"}
      </p>
      <div className="text-muted-foreground flex items-center justify-between text-xs">
        <span>
          {formatDistanceToNow(new Date(order.created_at), {
            addSuffix: true,
            locale: ptBR,
          })}
        </span>
        <span className="text-foreground font-semibold">
          {formatBRL(order.total_cents)}
        </span>
      </div>
    </div>
  )
}
