"use client"

import { ShoppingBag } from "lucide-react"
import { useCart } from "@/components/public-menu/cart-context"
import { formatBRL } from "@/lib/utils/money"

export function FloatingCartButton() {
  const { itemCount, subtotalCents, openCart } = useCart()

  if (itemCount === 0) return null

  return (
    <div className="fixed inset-x-0 bottom-16 z-30 mx-auto w-full max-w-md px-4">
      <button
        type="button"
        onClick={openCart}
        className="bg-primary text-primary-foreground flex w-full items-center justify-between rounded-2xl px-4 py-3 text-sm font-semibold shadow-lg"
      >
        <span className="flex items-center gap-2">
          <ShoppingBag className="size-4" />
          Ver carrinho · {itemCount} {itemCount === 1 ? "item" : "itens"}
        </span>
        <span>{formatBRL(subtotalCents)}</span>
      </button>
    </div>
  )
}
