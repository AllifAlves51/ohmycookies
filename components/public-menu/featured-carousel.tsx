import type { Product } from "@/lib/services/product"
import { formatBRL } from "@/lib/utils/money"

export function FeaturedCarousel({ products }: { products: Product[] }) {
  if (products.length === 0) return null

  return (
    <div className="space-y-2 px-4 pt-4">
      <h2 className="font-semibold">Destaques</h2>
      <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-1">
        {products.map((product) => (
          <div key={product.id} className="w-28 shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={product.image_url ?? "/placeholder-image.svg"}
              alt=""
              className="bg-muted aspect-square w-full rounded-xl object-cover"
            />
            <p className="mt-1 truncate text-sm font-medium">{product.name}</p>
            <p className="text-muted-foreground text-xs">
              {formatBRL(product.promo_price_cents ?? product.price_cents)}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
