"use client"

import { useEffect, useMemo, useState } from "react"
import { Search } from "lucide-react"
import { toast } from "sonner"
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
import { OrderDetailDialog } from "@/components/admin/orders/order-detail-dialog"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { buildWhatsappLink } from "@/lib/utils/whatsapp"
import {
  buildStatusMessage,
  type WhatsappTemplates,
} from "@/lib/whatsapp-templates"

const STATUS_LABEL = new Map(STATUS_COLUMNS.map((c) => [c.status, c.label]))

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
  storeSlug,
  storeName,
  templates,
  initialOrders,
}: {
  storeId: string
  storeSlug: string
  storeName: string
  templates: WhatsappTemplates
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
        },
      )
      // Supabase can't apply a column filter to DELETE events (the old row
      // only carries the primary key), so deletes need their own unfiltered
      // listener; ids from other stores simply won't match anything here.
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "orders" },
        (payload) => {
          const removed = payload.old as { id?: string }
          if (removed.id) handleOrderDeleted(removed.id)
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [storeId])

  function handleDrop(orderId: string, status: OrderStatus) {
    const order = orders.find((o) => o.id === orderId)
    if (!order || order.status === status) return

    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status } : o)),
    )
    void updateOrderStatusAction(orderId, status)

    const customer = order.customer
    if (!customer?.whatsapp) return

    const message = buildStatusMessage({
      templates,
      status,
      fulfillmentType: order.fulfillment_type,
      customerName: customer.name,
      orderNumber: order.order_number,
      trackingUrl: `${window.location.origin}/cardapio/${storeSlug}/pedido/${order.id}`,
      menuUrl: `${window.location.origin}/cardapio/${storeSlug}`,
      storeName,
    })
    if (!message) return

    toast(`Pedido #${order.order_number} → ${STATUS_LABEL.get(status)}`, {
      description: "Quer avisar o cliente pelo WhatsApp?",
      // Stays until dismissed — the owner may need a moment before sending.
      duration: Infinity,
      closeButton: true,
      action: {
        label: "Avisar cliente",
        onClick: () =>
          window.open(
            buildWhatsappLink(customer.whatsapp, message),
            "_blank",
            "noopener,noreferrer",
          ),
      },
    })
  }

  const [draggingOrderId, setDraggingOrderId] = useState<string | null>(null)
  // Lives here, not inside OrderCard: a status change moves the card to
  // another column (remounting it), which would close a card-owned dialog.
  const [openOrderId, setOpenOrderId] = useState<string | null>(null)
  const openOrder = orders.find((order) => order.id === openOrderId) ?? null

  function handleOrderDeleted(orderId: string) {
    setOrders((prev) => prev.filter((order) => order.id !== orderId))
  }

  function handleDialogStatusChange(orderId: string, status: OrderStatus) {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status } : o)),
    )
  }

  const filteredOrders = useMemo(() => {
    const query = search.trim().toLowerCase()

    return orders.filter((order) => {
      if (
        fulfillmentFilter !== "all" &&
        order.fulfillment_type !== fulfillmentFilter
      ) {
        return false
      }

      if (dateFilter === "today" && !isToday(order.created_at)) return false
      if (dateFilter === "7d" && !isWithinDays(order.created_at, 7))
        return false

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

      <div className="flex h-[calc(100vh-220px)] min-h-80 gap-3 overflow-x-auto pb-2">
        {STATUS_COLUMNS.filter((column) => column.status !== "confirmed").map(
          ({ status, label, headerClassName, columnClassName }) => (
            <KanbanColumn
              key={status}
              status={status}
              label={label}
              headerClassName={headerClassName}
              columnClassName={columnClassName}
              orders={filteredOrders.filter((order) => order.status === status)}
              onOpenOrder={setOpenOrderId}
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

      {openOrder ? (
        <OrderDetailDialog
          key={openOrder.id}
          order={openOrder}
          storeSlug={storeSlug}
          storeName={storeName}
          templates={templates}
          open
          onOpenChange={(open) => {
            if (!open) setOpenOrderId(null)
          }}
          onStatusChange={handleDialogStatusChange}
          onDeleted={handleOrderDeleted}
        />
      ) : null}
    </div>
  )
}
