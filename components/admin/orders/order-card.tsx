"use client"

import { useEffect, useState } from "react"
import {
  MapPin,
  MessageCircle,
  Printer,
  ShoppingBag,
  Truck,
} from "lucide-react"
import {
  PAYMENT_PREFERENCE_LABEL,
  type OrderWithCustomer,
} from "@/lib/services/order"
import { formatBRL } from "@/lib/utils/money"
import { formatAddress } from "@/lib/utils/address"
import { buildWhatsappLink } from "@/lib/utils/whatsapp"
import { cn } from "@/lib/utils"

const ACTIVE = new Set(["new", "confirmed", "preparing", "out_for_delivery"])

function formatClock(iso: string) {
  return new Date(iso).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  })
}

function formatElapsed(iso: string, now: number) {
  const minutes = Math.max(
    0,
    Math.floor((now - new Date(iso).getTime()) / 60000),
  )
  if (minutes < 1) return "agora"
  if (minutes < 60) return `${minutes} min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h${String(minutes % 60).padStart(2, "0")}`
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
  })
}

/** Re-renders once a minute so "há X min" stays honest on an open board. */
function useNow(enabled: boolean) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (!enabled) return
    const timer = window.setInterval(() => setNow(Date.now()), 60000)
    return () => window.clearInterval(timer)
  }, [enabled])
  return now
}

export function OrderCard({
  order,
  onOpen,
  onDragStart,
}: {
  order: OrderWithCustomer
  onOpen: (orderId: string) => void
  onDragStart: (orderId: string) => void
}) {
  const isActive = ACTIVE.has(order.status)
  const now = useNow(isActive)
  const elapsedMinutes = (now - new Date(order.created_at).getTime()) / 60000
  // An open order sitting for 40+ min deserves a second look.
  const isLate = isActive && elapsedMinutes >= 40

  const whatsappLink = order.customer?.whatsapp
    ? buildWhatsappLink(
        order.customer.whatsapp,
        `Olá, ${order.customer.name}! Sobre seu pedido #${order.order_number}...`,
      )
    : null

  return (
    <article
      draggable
      tabIndex={0}
      onDragStart={(event) => {
        event.dataTransfer.setData("text/plain", order.id)
        onDragStart(order.id)
      }}
      onClick={() => onOpen(order.id)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault()
          onOpen(order.id)
        }
      }}
      className="bg-card shadow-soft hover:border-foreground/15 focus-visible:ring-ring/50 group hover:shadow-raised cursor-pointer space-y-2.5 rounded-lg border p-3 text-sm transition-[border-color,box-shadow] outline-none focus-visible:ring-3 active:cursor-grabbing"
    >
      <div className="flex items-center gap-2">
        <span className="font-mono text-[0.8rem] font-semibold tabular-nums">
          #{order.order_number}
        </span>
        <span
          className={cn(
            "inline-flex items-center gap-1 text-xs",
            order.fulfillment_type === "delivery"
              ? "text-foreground/70"
              : "text-muted-foreground",
          )}
        >
          {order.fulfillment_type === "delivery" ? (
            <Truck className="size-3.5" />
          ) : (
            <ShoppingBag className="size-3.5" />
          )}
          {order.fulfillment_type === "delivery" ? "Entrega" : "Retirada"}
        </span>
        <span
          title={`Criado às ${formatClock(order.created_at)}`}
          className={cn(
            "ml-auto rounded px-1.5 py-0.5 text-[0.7rem] font-medium tabular-nums",
            isLate
              ? "bg-amber-50 text-amber-800 ring-1 ring-amber-600/20 dark:bg-amber-950/50 dark:text-amber-300"
              : "text-muted-foreground",
          )}
        >
          {isActive
            ? formatElapsed(order.created_at, now)
            : formatClock(order.created_at)}
        </span>
      </div>

      <div className="flex items-center justify-between gap-2">
        <p className="min-w-0 truncate font-medium">
          {order.customer?.name ?? "Cliente"}
        </p>
        {whatsappLink ? (
          <a
            href={whatsappLink}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(event) => event.stopPropagation()}
            aria-label="Abrir conversa no WhatsApp"
            title={order.customer?.whatsapp}
            className="text-muted-foreground flex size-6 shrink-0 items-center justify-center rounded-md transition-colors hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-emerald-950/50"
          >
            <MessageCircle className="size-3.5" />
          </a>
        ) : null}
      </div>

      {order.fulfillment_type === "delivery" && order.delivery_address ? (
        <p className="text-muted-foreground flex gap-1 text-xs leading-snug">
          <MapPin className="mt-px size-3 shrink-0" />
          <span className="line-clamp-2">
            {formatAddress(order.delivery_address)}
          </span>
        </p>
      ) : null}

      <div className="flex items-center justify-between gap-2 border-t pt-2.5">
        <span className="text-muted-foreground text-xs">
          {order.payment_preference
            ? PAYMENT_PREFERENCE_LABEL[order.payment_preference]
            : "A combinar"}
          {order.discount_cents > 0 ? " · com desconto" : ""}
        </span>
        <span className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation()
              window.open(`/imprimir/pedido/${order.id}`, "_blank")
            }}
            aria-label={`Imprimir pedido #${order.order_number}`}
            title="Imprimir pedido"
            className="text-muted-foreground hover:text-foreground hover:bg-muted rounded-md p-1 opacity-70 transition group-hover:opacity-100"
          >
            <Printer className="size-3.5" />
          </button>
          <span className="font-semibold tabular-nums">
            {formatBRL(order.total_cents)}
          </span>
        </span>
      </div>
    </article>
  )
}
