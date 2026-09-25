"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ChevronRight } from "lucide-react"
import { useCart } from "@/components/public-menu/cart-context"
import {
  getOrderHistoryAction,
  type OrderHistoryEntry,
} from "@/app/(public)/cardapio/[slug]/actions"
import { STATUS_COLUMNS } from "@/lib/services/order"
import { getRememberedOrderIds } from "@/lib/utils/order-history"
import { formatBRL } from "@/lib/utils/money"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"

const STATUS_LABEL = new Map(STATUS_COLUMNS.map((c) => [c.status, c]))

function formatDate(iso: string) {
  const date = new Date(iso)
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function OrderHistorySheet({ storeSlug }: { storeSlug: string }) {
  const { isHistoryOpen, closeHistory } = useCart()
  const [orders, setOrders] = useState<OrderHistoryEntry[] | null>(null)

  useEffect(() => {
    if (!isHistoryOpen) return
    const ids = getRememberedOrderIds(storeSlug)
    getOrderHistoryAction(ids).then(setOrders)
  }, [isHistoryOpen, storeSlug])

  return (
    <Sheet
      open={isHistoryOpen}
      onOpenChange={(next) => {
        if (!next) closeHistory()
      }}
    >
      <SheetContent side="bottom" className="max-h-[85vh] rounded-t-3xl">
        <SheetHeader>
          <SheetTitle>Meus pedidos</SheetTitle>
        </SheetHeader>

        <div className="flex-1 space-y-3 overflow-y-auto px-4 pb-4">
          {orders === null ? (
            <p className="text-muted-foreground py-8 text-center text-sm">
              Carregando...
            </p>
          ) : orders.length === 0 ? (
            <p className="text-muted-foreground py-8 text-center text-sm">
              Você ainda não fez nenhum pedido nesta loja.
            </p>
          ) : (
            orders.map((order) => {
              const status = STATUS_LABEL.get(order.status)
              return (
                <Link
                  key={order.orderId}
                  href={`/cardapio/${storeSlug}/pedido/${order.orderId}`}
                  onClick={closeHistory}
                  className="bg-card flex items-center justify-between gap-3 rounded-xl border p-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        Pedido #{order.order_number}
                      </span>
                      {status ? (
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${status.badgeClassName}`}
                        >
                          {status.label}
                        </span>
                      ) : null}
                    </div>
                    <p className="text-muted-foreground text-xs">
                      {formatDate(order.created_at)} · {formatBRL(order.total_cents)}
                    </p>
                  </div>
                  <ChevronRight className="text-muted-foreground size-4 shrink-0" />
                </Link>
              )
            })
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
