"use client"

import { Plus } from "lucide-react"
import type { Product } from "@/lib/services/product"
import { formatBRL } from "@/lib/utils/money"
import { useCart } from "@/components/public-menu/cart-context"
import { Button } from "@/components/ui/button"
import { QuantityStepper } from "@/components/shared/quantity-stepper"

export function ProductCard({ product }: { product: Product }) {
  const { items, addItem, setQuantity } = useCart()
  const cartItem = items.find((i) => i.productId === product.id)
  const outOfStock =
    product.stock_control_enabled && (product.stock_quantity ?? 0) <= 0

  return (
    <div className="bg-card flex flex-col overflow-hidden rounded-2xl border">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={product.image_url ?? "/placeholder-image.svg"}
        alt={product.name}
        className="bg-muted aspect-square w-full object-cover"
      />
      <div className="flex flex-1 flex-col gap-1 p-3">
        <h3 className="line-clamp-1 text-sm font-medium">{product.name}</h3>
        {product.description ? (
          <p className="text-muted-foreground line-clamp-2 text-xs">
            {product.description}
          </p>
        ) : null}
        <div className="mt-auto flex items-center justify-between pt-2">
          {product.promo_price_cents ? (
            <div className="flex flex-col">
              <span className="text-muted-foreground text-xs line-through">
                {formatBRL(product.price_cents)}
              </span>
              <span className="text-sm font-semibold">
                {formatBRL(product.promo_price_cents)}
              </span>
            </div>
          ) : (
            <span className="text-sm font-semibold">
              {formatBRL(product.price_cents)}
            </span>
          )}

          {outOfStock ? (
            <span className="text-muted-foreground text-xs">Esgotado</span>
          ) : cartItem ? (
            <QuantityStepper
              quantity={cartItem.quantity}
              max={
                product.stock_control_enabled
                  ? (product.stock_quantity ?? 0)
                  : undefined
              }
              onChange={(quantity) => setQuantity(product.id, quantity)}
            />
          ) : (
            <Button
              type="button"
              size="icon-sm"
              aria-label={`Adicionar ${product.name}`}
              onClick={() =>
                addItem({
                  productId: product.id,
                  name: product.name,
                  unitPriceCents:
                    product.promo_price_cents ?? product.price_cents,
                  imageUrl: product.image_url,
                })
              }
            >
              <Plus />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
