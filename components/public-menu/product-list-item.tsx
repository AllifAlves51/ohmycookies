"use client"

import { useState } from "react"
import { Minus, Plus } from "lucide-react"
import type { Product } from "@/lib/services/product"
import { useCart } from "@/components/public-menu/cart-context"
import { formatBRL } from "@/lib/utils/money"
import { ProductDetailSheet } from "@/components/public-menu/product-detail-sheet"

export function ProductListItem({ product }: { product: Product }) {
  const { items, setQuantity } = useCart()
  const [open, setOpen] = useState(false)
  const cartItem = items.find((i) => i.productId === product.id)
  const outOfStock =
    product.stock_control_enabled && (product.stock_quantity ?? 0) <= 0

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        onClick={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") setOpen(true)
        }}
        className="flex w-full cursor-pointer gap-3 border-b py-4 text-left last:border-b-0"
      >
        <div className="min-w-0 flex-1">
          <h3 className="font-medium">{product.name}</h3>
          {product.description ? (
            <p className="text-muted-foreground mt-1 line-clamp-2 text-sm">
              {product.description}
            </p>
          ) : null}
          <div className="mt-2">
            {product.promo_price_cents ? (
              <span className="flex items-baseline gap-1.5">
                <span className="font-semibold text-green-700">
                  {formatBRL(product.promo_price_cents)}
                </span>
                <span className="text-muted-foreground text-xs line-through">
                  {formatBRL(product.price_cents)}
                </span>
              </span>
            ) : (
              <span className="font-semibold">
                {formatBRL(product.price_cents)}
              </span>
            )}
          </div>
        </div>

        <div className="relative size-28 shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={product.image_url ?? "/placeholder-image.svg"}
            alt=""
            className="bg-muted size-full rounded-xl object-cover"
          />
          {outOfStock ? (
            <span className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/40 text-xs font-medium text-white">
              Esgotado
            </span>
          ) : cartItem ? (
            <div
              onClick={(e) => e.stopPropagation()}
              className="bg-card absolute right-1 -bottom-1 flex items-center gap-1.5 rounded-full border px-1.5 py-1 shadow-sm"
            >
              <button
                type="button"
                aria-label={`Diminuir ${product.name}`}
                onClick={() => setQuantity(product.id, cartItem.quantity - 1)}
                className="flex size-5 items-center justify-center"
              >
                <Minus className="size-3" />
              </button>
              <span className="w-3 text-center text-xs font-medium tabular-nums">
                {cartItem.quantity}
              </span>
              <button
                type="button"
                aria-label={`Aumentar ${product.name}`}
                onClick={() => setQuantity(product.id, cartItem.quantity + 1)}
                className="flex size-5 items-center justify-center"
              >
                <Plus className="size-3" />
              </button>
            </div>
          ) : (
            <span className="bg-primary absolute -right-1 -bottom-1 flex size-7 items-center justify-center rounded-full text-white shadow-sm">
              <Plus className="size-4" />
            </span>
          )}
        </div>
      </div>

      <ProductDetailSheet product={product} open={open} onOpenChange={setOpen} />
    </>
  )
}
