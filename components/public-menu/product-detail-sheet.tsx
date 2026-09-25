"use client"

import { useState } from "react"
import { Minus, Plus } from "lucide-react"
import { toast } from "sonner"
import type { Product } from "@/lib/services/product"
import { useCart } from "@/components/public-menu/cart-context"
import { formatBRL } from "@/lib/utils/money"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Sheet, SheetContent } from "@/components/ui/sheet"

export function ProductDetailSheet({
  product,
  open,
  onOpenChange,
}: {
  product: Product
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { addItem, openCart } = useCart()
  const [quantity, setQuantity] = useState(1)
  const [notes, setNotes] = useState("")

  const outOfStock =
    product.stock_control_enabled && (product.stock_quantity ?? 0) <= 0
  const unitPrice = product.promo_price_cents ?? product.price_cents

  function reset() {
    setQuantity(1)
    setNotes("")
  }

  function handleAdd() {
    addItem(
      {
        productId: product.id,
        name: product.name,
        unitPriceCents: unitPrice,
        imageUrl: product.image_url,
        notes: notes.trim() || undefined,
      },
      quantity,
    )
    reset()
    onOpenChange(false)
    toast.success(`${product.name} adicionado`, {
      action: {
        label: "Ver carrinho",
        onClick: openCart,
      },
    })
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next)
        if (!next) reset()
      }}
    >
      <SheetContent
        side="bottom"
        className="max-h-[90vh] overflow-y-auto rounded-t-3xl p-0"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={product.image_url ?? "/placeholder-image.svg"}
          alt={product.name}
          className="bg-muted aspect-square w-full object-cover"
        />
        <div className="space-y-4 p-4">
          <div>
            <h2 className="text-lg font-semibold">{product.name}</h2>
            {product.description ? (
              <p className="text-muted-foreground mt-1 text-sm">
                {product.description}
              </p>
            ) : null}
            <div className="mt-2">
              {product.promo_price_cents ? (
                <span className="flex items-baseline gap-1.5">
                  <span className="font-semibold text-green-700">
                    {formatBRL(product.promo_price_cents)}
                  </span>
                  <span className="text-muted-foreground text-sm line-through">
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

          <div className="space-y-2">
            <label htmlFor="productNotes" className="text-sm font-medium">
              Alguma observação?
            </label>
            <Textarea
              id="productNotes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: sem gotas de chocolate, embalar para presente..."
              rows={3}
              maxLength={280}
            />
          </div>
        </div>

        <div className="bg-background sticky bottom-0 flex items-center gap-3 border-t p-4">
          <div className="flex items-center gap-3 rounded-full border px-1">
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              aria-label="Diminuir quantidade"
              className="flex size-8 items-center justify-center"
            >
              <Minus className="size-4" />
            </button>
            <span className="w-4 text-center text-sm font-medium tabular-nums">
              {quantity}
            </span>
            <button
              type="button"
              onClick={() => setQuantity((q) => q + 1)}
              aria-label="Aumentar quantidade"
              className="flex size-8 items-center justify-center"
            >
              <Plus className="size-4" />
            </button>
          </div>
          <Button
            type="button"
            className="flex-1 rounded-xl"
            disabled={outOfStock}
            onClick={handleAdd}
          >
            {outOfStock
              ? "Esgotado"
              : `Adicionar · ${formatBRL(unitPrice * quantity)}`}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
