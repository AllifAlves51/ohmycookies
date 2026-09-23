"use client"

import { useEffect, useState } from "react"
import { Check } from "lucide-react"
import {
  STATUS_COLUMNS,
  type OrderTracking,
  type OrderTrackingItem,
} from "@/lib/services/order"
import { getOrderTrackingStatusAction } from "@/app/(public)/cardapio/[slug]/actions"
import { formatBRL } from "@/lib/utils/money"
import { cn } from "@/lib/utils"

const TRACKED_STATUSES = STATUS_COLUMNS.filter(
  (column) => column.status !== "cancelled",
)

const POLL_INTERVAL_MS = 20_000

function useCountdown(targetIso: string | null) {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (!targetIso) return
    const interval = setInterval(() => setNow(Date.now()), 30_000)
    return () => clearInterval(interval)
  }, [targetIso])

  if (!targetIso) return null

  const diffMs = new Date(targetIso).getTime() - now
  return Math.max(0, Math.round(diffMs / 60_000))
}

export function OrderTrackingView({
  orderId,
  storeName,
  initialTracking,
  items,
}: {
  orderId: string
  storeName: string
  initialTracking: OrderTracking
  items: OrderTrackingItem[]
}) {
  const [tracking, setTracking] = useState(initialTracking)

  useEffect(() => {
    const interval = setInterval(async () => {
      const next = await getOrderTrackingStatusAction(orderId)
      if (next) setTracking(next)
    }, POLL_INTERVAL_MS)

    return () => clearInterval(interval)
  }, [orderId])

  const estimatedTarget =
    tracking.fulfillment_type === "delivery" &&
    tracking.delivery_estimated_minutes
      ? new Date(
          new Date(tracking.created_at).getTime() +
            tracking.delivery_estimated_minutes * 60_000,
        ).toISOString()
      : null

  const minutesLeft = useCountdown(estimatedTarget)
  const currentIndex = TRACKED_STATUSES.findIndex(
    (column) => column.status === tracking.status,
  )

  return (
    <div className="flex flex-1 flex-col">
      <header className="bg-primary text-primary-foreground rounded-b-3xl px-5 pt-6 pb-8">
        <p className="text-sm text-white/80">{storeName}</p>
        <h1 className="text-xl font-semibold">
          Pedido #{tracking.order_number}
        </h1>
      </header>

      <div className="flex-1 space-y-6 p-5">
        {tracking.status === "cancelled" ? (
          <div className="rounded-2xl bg-gray-100 p-4 text-center text-sm text-gray-600">
            Este pedido foi cancelado.
          </div>
        ) : (
          <div className="space-y-4">
            {TRACKED_STATUSES.map((column, index) => {
              const done = index <= currentIndex
              return (
                <div key={column.status} className="flex items-center gap-3">
                  <div
                    className={cn(
                      "flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                      done
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground",
                    )}
                  >
                    {done ? <Check className="size-4" /> : index + 1}
                  </div>
                  <span
                    className={cn(
                      "text-sm",
                      done ? "font-medium" : "text-muted-foreground",
                    )}
                  >
                    {column.label}
                  </span>
                </div>
              )
            })}
          </div>
        )}

        {minutesLeft !== null && tracking.status !== "cancelled" ? (
          <div className="bg-secondary rounded-2xl p-4 text-center">
            <p className="text-muted-foreground text-xs">
              Previsão de entrega
            </p>
            <p className="text-primary text-lg font-semibold">
              {minutesLeft > 0 ? `~${minutesLeft} min` : "a qualquer momento"}
            </p>
          </div>
        ) : null}

        <div className="space-y-2 border-t pt-4">
          {items.map((item) => (
            <div
              key={item.product_name}
              className="flex justify-between text-sm"
            >
              <span>
                {item.quantity}x {item.product_name}
              </span>
              <span>{formatBRL(item.subtotal_cents)}</span>
            </div>
          ))}
          {tracking.fulfillment_type === "delivery" &&
          tracking.delivery_zone_name ? (
            <p className="text-muted-foreground pt-2 text-xs">
              Entrega: {tracking.delivery_zone_name}
            </p>
          ) : null}
          <div className="flex justify-between border-t pt-2 font-semibold">
            <span>Total</span>
            <span>{formatBRL(tracking.total_cents)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
