"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import type { OrderStatus, OrderWithCustomer } from "@/lib/services/order"
import { OrderCard } from "@/components/admin/orders/order-card"

export function KanbanColumn({
  status,
  label,
  badgeClassName,
  orders,
  onDragStart,
  onDrop,
}: {
  status: OrderStatus
  label: string
  badgeClassName: string
  orders: OrderWithCustomer[]
  onDragStart: (orderId: string) => void
  onDrop: (status: OrderStatus) => void
}) {
  const [isOver, setIsOver] = useState(false)

  return (
    <div
      onDragOver={(event) => {
        event.preventDefault()
        setIsOver(true)
      }}
      onDragLeave={() => setIsOver(false)}
      onDrop={(event) => {
        event.preventDefault()
        setIsOver(false)
        onDrop(status)
      }}
      className={cn(
        "bg-muted/40 flex w-64 shrink-0 flex-col gap-2 rounded-lg border p-2",
        isOver && "border-primary bg-muted",
      )}
    >
      <div className="flex items-center justify-between px-1 text-sm font-medium">
        <span>{label}</span>
        <span
          className={cn(
            "flex size-5 items-center justify-center rounded-full text-xs font-semibold",
            badgeClassName,
          )}
        >
          {orders.length}
        </span>
      </div>
      <div className="flex min-h-16 flex-col gap-2">
        {orders.map((order) => (
          <OrderCard key={order.id} order={order} onDragStart={onDragStart} />
        ))}
      </div>
    </div>
  )
}
