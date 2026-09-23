"use client"

import { Trash2 } from "lucide-react"
import { useCart } from "@/components/public-menu/cart-context"
import { formatBRL } from "@/lib/utils/money"
import { Button } from "@/components/ui/button"
import { QuantityStepper } from "@/components/shared/quantity-stepper"

export function CartReview({
  minOrderCents,
  onCheckout,
}: {
  minOrderCents: number
  onCheckout: () => void
}) {
  const { items, subtotalCents, setQuantity, removeItem } = useCart()
  const belowMinimum = minOrderCents > 0 && subtotalCents < minOrderCents

  return (
    <>
      <div className="flex-1 overflow-y-auto px-4">
        {items.map((item) => (
          <div
            key={item.productId}
            className="flex items-center gap-3 border-b py-3 last:border-b-0"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={item.imageUrl ?? "/placeholder-image.svg"}
              alt={item.name}
              className="bg-muted size-12 shrink-0 rounded-xl object-cover"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{item.name}</p>
              <p className="text-muted-foreground text-sm">
                {formatBRL(item.unitPriceCents)}
              </p>
            </div>
            <QuantityStepper
              quantity={item.quantity}
              onChange={(quantity) => setQuantity(item.productId, quantity)}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={`Remover ${item.name}`}
              onClick={() => removeItem(item.productId)}
            >
              <Trash2 />
            </Button>
          </div>
        ))}
      </div>
      <div className="space-y-2 border-t p-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Subtotal</span>
          <span className="font-semibold">{formatBRL(subtotalCents)}</span>
        </div>
        {belowMinimum ? (
          <p className="text-destructive text-xs">
            Pedido mínimo de {formatBRL(minOrderCents)}
          </p>
        ) : null}
        <Button
          type="button"
          className="w-full rounded-xl"
          disabled={belowMinimum}
          onClick={onCheckout}
        >
          Finalizar pedido
        </Button>
      </div>
    </>
  )
}
