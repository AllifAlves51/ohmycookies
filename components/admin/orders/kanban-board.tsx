"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import {
  STATUS_COLUMNS,
  getOrderWithCustomer,
  type Order,
  type OrderStatus,
  type OrderWithCustomer,
} from "@/lib/services/order"
import { updateOrderStatusAction } from "@/app/(admin)/pedidos/actions"
import { KanbanColumn } from "@/components/admin/orders/kanban-column"

export function KanbanBoard({
  storeId,
  initialOrders,
}: {
  storeId: string
  initialOrders: OrderWithCustomer[]
}) {
  const [orders, setOrders] = useState(initialOrders)

  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel(`orders-${storeId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
          filter: `store_id=eq.${storeId}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const newOrder = payload.new as Order
            getOrderWithCustomer(supabase, newOrder.id).then(({ data }) => {
              if (data) {
                setOrders((prev) =>
                  prev.some((o) => o.id === data.id) ? prev : [data, ...prev],
                )
              }
            })
          }

          if (payload.eventType === "UPDATE") {
            const updated = payload.new as Order
            setOrders((prev) =>
              prev.map((order) =>
                order.id === updated.id ? { ...order, ...updated } : order,
              ),
            )
          }

          if (payload.eventType === "DELETE") {
            const removed = payload.old as { id: string }
            setOrders((prev) => prev.filter((order) => order.id !== removed.id))
          }
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [storeId])

  function handleDrop(orderId: string, status: OrderStatus) {
    setOrders((prev) =>
      prev.map((order) =>
        order.id === orderId ? { ...order, status } : order,
      ),
    )
    void updateOrderStatusAction(orderId, status)
  }

  const [draggingOrderId, setDraggingOrderId] = useState<string | null>(null)

  return (
    <div className="flex gap-3 overflow-x-auto p-6">
      {STATUS_COLUMNS.map(({ status, label, badgeClassName }) => (
        <KanbanColumn
          key={status}
          status={status}
          label={label}
          badgeClassName={badgeClassName}
          orders={orders.filter((order) => order.status === status)}
          onDragStart={setDraggingOrderId}
          onDrop={(dropStatus) => {
            if (draggingOrderId) {
              handleDrop(draggingOrderId, dropStatus)
              setDraggingOrderId(null)
            }
          }}
        />
      ))}
    </div>
  )
}
