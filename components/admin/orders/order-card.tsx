"use client"

import { useState } from "react"
import { MessageCircle } from "lucide-react"
import {
  PAYMENT_PREFERENCE_LABEL,
  STATUS_COLUMNS,
  type OrderWithCustomer,
} from "@/lib/services/order"
import { formatBRL } from "@/lib/utils/money"
import { formatAddress } from "@/lib/utils/address"
import { buildWhatsappLink } from "@/lib/utils/whatsapp"
import { OrderProgressDots } from "@/components/admin/orders/order-progress-dots"
import { OrderDetailDialog } from "@/components/admin/orders/order-detail-dialog"

const STATUS_LABEL = new Map(STATUS_COLUMNS.map((c) => [c.status, c.label]))

function formatDateTime(iso: string) {
  const date = new Date(iso)
  const dd = String(date.getDate()).padStart(2, "0")
  const mm = String(date.getMonth() + 1).padStart(2, "0")
  const hh = String(date.getHours()).padStart(2, "0")
  const min = String(date.getMinutes()).padStart(2, "0")
  return `${hh}:${min} - ${dd}/${mm}`
}

export function OrderCard({
  order,
  storeSlug,
  onDragStart,
}: {
  order: OrderWithCustomer
  storeSlug: string
  onDragStart: (orderId: string) => void
}) {
  const [detailOpen, setDetailOpen] = useState(false)

  const whatsappLink = order.customer?.whatsapp
    ? buildWhatsappLink(
        order.customer.whatsapp,
        `Olá, ${order.customer.name}! Sobre seu pedido #${order.order_number}...`,
      )
    : null

  return (
    <>
    <div
      draggable
      onDragStart={(event) => {
        event.dataTransfer.setData("text/plain", order.id)
        onDragStart(order.id)
      }}
      onClick={() => setDetailOpen(true)}
      className="bg-card cursor-pointer space-y-2 rounded-lg border p-3 text-sm active:cursor-grabbing"
    >
      <div className="flex items-start justify-between gap-2">
        <p className="min-w-0 truncate font-semibold">
          {order.customer?.name ?? "Cliente"}
        </p>
        <OrderProgressDots status={order.status} />
      </div>

      {order.customer?.whatsapp ? (
        <div className="text-muted-foreground flex items-center gap-1.5 text-xs">
          <span>{order.customer.whatsapp}</span>
          {whatsappLink ? (
            <a
              href={whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(event) => event.stopPropagation()}
              aria-label="Abrir conversa no WhatsApp"
              className="flex size-4 shrink-0 items-center justify-center rounded-full bg-green-500 text-white"
            >
              <MessageCircle className="size-2.5" />
            </a>
          ) : null}
        </div>
      ) : null}

      <div className="flex items-center gap-2 text-xs">
        <span className="bg-muted rounded px-1.5 py-0.5 font-medium">
          #{order.order_number}
        </span>
        <span className="text-muted-foreground">
          {formatDateTime(order.created_at)}
        </span>
      </div>

      <div className="flex items-center justify-between gap-2">
        {order.payment_preference ? (
          <span className="bg-muted text-muted-foreground rounded px-1.5 py-0.5 text-xs">
            Receber → {PAYMENT_PREFERENCE_LABEL[order.payment_preference]}
          </span>
        ) : (
          <span className="text-muted-foreground text-xs">A combinar</span>
        )}
        <span className="font-semibold">{formatBRL(order.total_cents)}</span>
      </div>

      {order.fulfillment_type === "delivery" && order.delivery_address ? (
        <p className="text-primary line-clamp-2 text-xs">
          {formatAddress(order.delivery_address)}
        </p>
      ) : null}

      <div className="text-muted-foreground flex items-center justify-between border-t pt-2 text-xs">
        <span>{STATUS_LABEL.get(order.status)}</span>
        <span>{formatDateTime(order.updated_at)}</span>
      </div>
    </div>

    <OrderDetailDialog
      order={order}
      storeSlug={storeSlug}
      open={detailOpen}
      onOpenChange={setDetailOpen}
    />
    </>
  )
}
