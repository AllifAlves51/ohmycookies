"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import type { OrderStatus, OrderWithCustomer } from "@/lib/services/order"
import { OrderCard } from "@/components/admin/orders/order-card"

export function KanbanColumn({
  status,
  label,
  dotClassName,
  orders,
  emptyLabel,
  onOpenOrder,
  onDragStart,
  onDrop,
}: {
  status: OrderStatus
  label: string
  dotClassName: string
  orders: OrderWithCustomer[]
  emptyLabel: string
  onOpenOrder: (orderId: string) => void
  onDragStart: (orderId: string) => void
  onDrop: (status: OrderStatus) => void
}) {
  const [isOver, setIsOver] = useState(false)

  return (
    <section
      aria-label={label}
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
        "bg-muted/55 flex h-full w-[17.5rem] shrink-0 flex-col overflow-hidden rounded-xl border border-transparent transition-colors",
        isOver && "border-primary/40 bg-accent/60",
      )}
    >
      <header className="flex items-center gap-2 px-3 pt-3 pb-2">
        <span className={cn("size-2 rounded-full", dotClassName)} />
        <h2 className="text-[0.8rem] font-semibold">{label}</h2>
        <span className="bg-card text-muted-foreground ml-auto rounded-md border px-1.5 text-[0.7rem] font-medium tabular-nums">
          {orders.length}
        </span>
      </header>
      <div className="flex min-h-16 flex-1 flex-col gap-2 overflow-y-auto px-2 pb-2">
        {orders.length === 0 ? (
          <p className="text-muted-foreground/80 rounded-lg border border-dashed px-3 py-6 text-center text-xs">
            {emptyLabel}
          </p>
        ) : (
          orders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              onOpen={onOpenOrder}
              onDragStart={onDragStart}
            />
          ))
        )}
      </div>
    </section>
  )
}
