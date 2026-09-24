"use client"

import { useEffect, useMemo, useState } from "react"
import { Search } from "lucide-react"
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
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

type FulfillmentFilter = "all" | "delivery" | "pickup"
type DateFilter = "today" | "7d" | "all"

const DATE_OPTIONS = [
  { value: "today", label: "Hoje" },
  { value: "7d", label: "Últimos 7 dias" },
  { value: "all", label: "Todos os pedidos" },
] as const

function isToday(iso: string) {
  const d = new Date(iso)
  const now = new Date()
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  )
}

function isWithinDays(iso: string, days: number) {
  const t = new Date(iso).getTime()
  return t >= Date.now() - days * 24 * 60 * 60 * 1000
}

export function KanbanBoard({
  storeId,
  initialOrders,
}: {
  storeId: string
  initialOrders: OrderWithCustomer[]
}) {
  const [orders, setOrders] = useState(initialOrders)
  const [search, setSearch] = useState("")
  const [fulfillmentFilter, setFulfillmentFilter] =
    useState<FulfillmentFilter>("all")
  const [dateFilter, setDateFilter] = useState<DateFilter>("all")

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

  const filteredOrders = useMemo(() => {
    const query = search.trim().toLowerCase()

    return orders.filter((order) => {
      if (fulfillmentFilter !== "all" && order.fulfillment_type !== fulfillmentFilter) {
        return false
      }

      if (dateFilter === "today" && !isToday(order.created_at)) return false
      if (dateFilter === "7d" && !isWithinDays(order.created_at, 7)) return false

      if (query) {
        const haystack = [
          String(order.order_number),
          order.customer?.name ?? "",
          order.customer?.whatsapp ?? "",
        ]
          .join(" ")
          .toLowerCase()
        if (!haystack.includes(query)) return false
      }

      return true
    })
  }, [orders, search, fulfillmentFilter, dateFilter])

  return (
    <div className="flex flex-1 flex-col gap-4 p-6">
      <div className="flex flex-wrap items-center gap-3">
        <div className="bg-muted flex gap-1 rounded-lg p-1">
          {(
            [
              { value: "all", label: "Todos" },
              { value: "delivery", label: "Entrega" },
              { value: "pickup", label: "Retirada" },
            ] as const
          ).map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setFulfillmentFilter(option.value)}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                fulfillmentFilter === option.value
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {option.label}
            </button>
          ))}
        </div>

        <div className="relative min-w-56 flex-1">
          <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Pesquise pelo nome do cliente ou código do pedido"
            className="rounded-lg pl-9"
          />
        </div>

        <Select
          value={dateFilter}
          onValueChange={(value) => value && setDateFilter(value as DateFilter)}
          items={DATE_OPTIONS}
        >
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {DATE_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2">
        {STATUS_COLUMNS.filter((column) => column.status !== "confirmed").map(
          ({ status, label, headerClassName, columnClassName }) => (
            <KanbanColumn
              key={status}
              status={status}
              label={label}
              headerClassName={headerClassName}
              columnClassName={columnClassName}
              orders={filteredOrders.filter((order) => order.status === status)}
              onDragStart={setDraggingOrderId}
              onDrop={(dropStatus) => {
                if (draggingOrderId) {
                  handleDrop(draggingOrderId, dropStatus)
                  setDraggingOrderId(null)
                }
              }}
            />
          ),
        )}
      </div>
    </div>
  )
}
