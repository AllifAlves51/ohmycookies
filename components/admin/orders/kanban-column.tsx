"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import type { OrderStatus, OrderWithCustomer } from "@/lib/services/order"
import { OrderCard } from "@/components/admin/orders/order-card"

export function KanbanColumn({
  status,
  label,
  headerClassName,
  columnClassName,
  orders,
  onOpenOrder,
  onDragStart,
  onDrop,
}: {
  status: OrderStatus
  label: string
  headerClassName: string
  columnClassName: string
  orders: OrderWithCustomer[]
  onOpenOrder: (orderId: string) => void
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
        "flex h-full w-72 shrink-0 flex-col gap-2 overflow-hidden rounded-xl border p-3",
        columnClassName,
        isOver && "border-primary",
      )}
    >
      <div className="flex items-center gap-2 px-1 text-sm font-semibold">
        <span className={headerClassName}>{label}</span>
        <span className={cn("text-xs font-medium", headerClassName)}>
          ({orders.length})
        </span>
      </div>
      <div className="flex min-h-16 flex-1 flex-col gap-2 overflow-y-auto">
        {orders.map((order) => (
          <OrderCard
            key={order.id}
            order={order}
            onOpen={onOpenOrder}
            onDragStart={onDragStart}
          />
        ))}
      </div>
    </div>
  )
}
