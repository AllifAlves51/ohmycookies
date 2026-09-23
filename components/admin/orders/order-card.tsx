"use client"

import { MessageCircle } from "lucide-react"
import type { OrderWithCustomer } from "@/lib/services/order"
import { formatBRL } from "@/lib/utils/money"
import { buildWhatsappLink } from "@/lib/utils/whatsapp"

function formatDateTime(iso: string) {
  const date = new Date(iso)
  const dd = String(date.getDate()).padStart(2, "0")
  const mm = String(date.getMonth() + 1).padStart(2, "0")
  const hh = String(date.getHours()).padStart(2, "0")
  const min = String(date.getMinutes()).padStart(2, "0")
  return `${dd}/${mm} - ${hh}:${min}`
}

export function OrderCard({
  order,
  onDragStart,
}: {
  order: OrderWithCustomer
  onDragStart: (orderId: string) => void
}) {
  const whatsappLink = order.customer?.whatsapp
    ? buildWhatsappLink(
        order.customer.whatsapp,
        `Olá, ${order.customer.name}! Sobre seu pedido #${order.order_number}...`,
      )
    : null

  return (
    <div
      draggable
      onDragStart={(event) => {
        event.dataTransfer.setData("text/plain", order.id)
        onDragStart(order.id)
      }}
      className="bg-card cursor-grab space-y-1 rounded-lg border p-3 text-sm active:cursor-grabbing"
    >
      <div className="flex items-center justify-between">
        <span className="font-medium">#{order.order_number}</span>
        {whatsappLink ? (
          <a
            href={whatsappLink}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(event) => event.stopPropagation()}
            aria-label="Abrir conversa no WhatsApp"
            className="flex size-6 shrink-0 items-center justify-center rounded-full bg-green-500 text-white"
          >
            <MessageCircle className="size-3.5" />
          </a>
        ) : null}
      </div>
      <p className="truncate font-medium">
        {order.customer?.name ?? "Cliente"}
      </p>
      <p className="text-foreground font-semibold">
        {formatBRL(order.total_cents)}
      </p>
      <p className="text-muted-foreground text-xs">
        {formatDateTime(order.created_at)}
      </p>
    </div>
  )
}
