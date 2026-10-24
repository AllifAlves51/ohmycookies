"use client"

import { useMemo, useState } from "react"
import { Search } from "lucide-react"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"
import {
  BOARD_HISTORY_DAYS,
  STATUS_COLUMNS,
  getOrders,
  type OrderStatus,
  type OrderWithCustomer,
} from "@/lib/services/order"
import { updateOrderStatusAction } from "@/app/(admin)/pedidos/actions"
import { useOrderFeed } from "@/components/admin/use-order-feed"
import { KanbanColumn } from "@/components/admin/orders/kanban-column"
import { OrderDetailDialog } from "@/components/admin/orders/order-detail-dialog"
import type { Product } from "@/lib/services/product"
import type { DeliveryZone } from "@/lib/services/delivery"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Segmented } from "@/components/ui/segmented"
import { buildWhatsappLink } from "@/lib/utils/whatsapp"
import {
  buildStatusMessage,
  type WhatsappTemplates,
} from "@/lib/whatsapp-templates"

const STATUS_LABEL = new Map(STATUS_COLUMNS.map((c) => [c.status, c.label]))

type FulfillmentFilter = "all" | "delivery" | "pickup"
type DateFilter = "today" | "7d" | "all"

// Only finished orders (completed/cancelled) are filtered by date: an open
// order always stays on the board until someone moves it.
const DATE_OPTIONS = [
  { value: "today", label: "Finalizados hoje" },
  { value: "7d", label: "Finalizados em 7 dias" },
  { value: "all", label: `Finalizados em ${BOARD_HISTORY_DAYS} dias` },
] as const

const FINISHED = new Set<OrderStatus>(["completed", "cancelled"])

const EMPTY_LABEL: Partial<Record<OrderStatus, string>> = {
  new: "Nenhum pedido novo",
  preparing: "Nada em preparo",
  out_for_delivery: "Nenhuma entrega em rota",
  completed: "Nenhum pedido concluído",
  cancelled: "Nenhum cancelamento",
}

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
  products,
  deliveryZones,
  storeCity,
  storeState,
  initialOrders,
}: {
  storeId: string
  storeSlug: string
  storeName: string
  templates: WhatsappTemplates
  products: Product[]
  deliveryZones: DeliveryZone[]
  storeCity: string
  storeState: string
  initialOrders: OrderWithCustomer[]
}) {
  const [orders, setOrders] = useState(initialOrders)
  const [search, setSearch] = useState("")
  const [fulfillmentFilter, setFulfillmentFilter] =
    useState<FulfillmentFilter>("all")
  const [dateFilter, setDateFilter] = useState<DateFilter>("today")

  useOrderFeed(storeId, {
    onInsert: (order) =>
      setOrders((prev) =>
        prev.some((o) => o.id === order.id) ? prev : [order, ...prev],
      ),
    onUpdate: (updated) =>
      setOrders((prev) =>
        prev.map((order) =>
          order.id === updated.id ? { ...order, ...updated } : order,
        ),
      ),
    onDelete: (orderId) => handleOrderDeleted(orderId),
    // Events may have been missed while disconnected: reload the list.
    onResync: () => {
      getOrders(createClient(), storeId).then(({ data }) => {
        if (data) setOrders(data)
      })
    },
  })

  async function handleDrop(orderId: string, status: OrderStatus) {
    const order = orders.find((o) => o.id === orderId)
    if (!order || order.status === status) return

    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status } : o)),
    )
    const customer = order.customer
    const { notified } = await updateOrderStatusAction(orderId, status)

    if (notified === "sent") {
      toast.success(
        `Pedido #${order.order_number}: cliente avisado no WhatsApp`,
      )
      return
    }
    if (notified !== "unavailable" || !customer?.whatsapp) return

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
      description: "WhatsApp não conectado. Quer avisar o cliente manualmente?",
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

  function handleOrderPatched(
    orderId: string,
    patch: Partial<OrderWithCustomer>,
  ) {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, ...patch } : o)),
    )
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

      if (FINISHED.has(order.status)) {
        if (dateFilter === "today" && !isToday(order.updated_at)) return false
        if (dateFilter === "7d" && !isWithinDays(order.updated_at, 7))
          return false
      }

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
    <div className="flex min-h-0 flex-1 flex-col gap-4 px-4 pt-5 pb-4 sm:px-8">
      <div className="flex flex-wrap items-center gap-2.5">
        <Segmented
          aria-label="Tipo de pedido"
          value={fulfillmentFilter}
          onChange={setFulfillmentFilter}
          options={[
            ["all", "Todos"],
            ["delivery", "Entrega"],
            ["pickup", "Retirada"],
          ]}
        />

        <div className="relative min-w-56 flex-1 sm:max-w-sm">
          <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar por cliente, telefone ou nº do pedido"
            className="bg-card h-9 pl-9"
          />
        </div>

        <Select
          value={dateFilter}
          onValueChange={(value) => value && setDateFilter(value as DateFilter)}
          items={DATE_OPTIONS}
        >
          <SelectTrigger className="bg-card ml-auto h-9 w-52">
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

      <div className="-mx-4 flex h-[calc(100vh-210px)] min-h-96 gap-3 overflow-x-auto px-4 pb-2 sm:-mx-8 sm:px-8">
        {STATUS_COLUMNS.filter((column) => column.status !== "confirmed").map(
          ({ status, label, dotClassName }) => (
            <KanbanColumn
              key={status}
              status={status}
              label={label}
              dotClassName={dotClassName}
              emptyLabel={EMPTY_LABEL[status] ?? "Vazio"}
              // "confirmed" has no column of its own: it sits with "new".
              orders={filteredOrders.filter(
                (order) =>
                  order.status === status ||
                  (status === "new" && order.status === "confirmed"),
              )}
              onOpenOrder={setOpenOrderId}
              onDragStart={setDraggingOrderId}
              onDrop={(dropStatus) => {
                if (draggingOrderId) {
                  void handleDrop(draggingOrderId, dropStatus)
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
          products={products}
          deliveryZones={deliveryZones}
          storeCity={storeCity}
          storeState={storeState}
          open
          onOpenChange={(open) => {
            if (!open) setOpenOrderId(null)
          }}
          onStatusChange={handleDialogStatusChange}
          onDeleted={handleOrderDeleted}
          onPatched={handleOrderPatched}
        />
      ) : null}
    </div>
  )
}
