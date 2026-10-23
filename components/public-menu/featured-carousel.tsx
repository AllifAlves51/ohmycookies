"use client"

import { useRef, useState } from "react"
import {
  ChevronLeft,
  ChevronRight,
  Egg,
  Flame,
  Flower2,
  Ghost,
  Heart,
  Snowflake,
  Sparkles,
  type LucideIcon,
} from "lucide-react"
import type { Product } from "@/lib/services/product"
import type { SeasonId } from "@/lib/seasonal-themes"
import { formatBRL } from "@/lib/utils/money"
import { ProductDetailSheet } from "@/components/public-menu/product-detail-sheet"

const SEASON_ICON: Record<SeasonId, LucideIcon> = {
  halloween: Ghost,
  christmas: Snowflake,
  easter: Egg,
  valentines: Heart,
  june: Flame,
  mothers_day: Flower2,
}

export function FeaturedCarousel({
  products,
  season,
}: {
  products: Product[]
  season: SeasonId | null
}) {
  const scroller = useRef<HTMLDivElement>(null)
  const [openId, setOpenId] = useState<string | null>(null)
  const openProduct = products.find((p) => p.id === openId) ?? null

  if (products.length === 0) return null

  const Icon = season ? SEASON_ICON[season] : Sparkles

  function scrollBy(direction: 1 | -1) {
    scroller.current?.scrollBy({ left: direction * 260, behavior: "smooth" })
  }

  return (
    <section className="space-y-3 px-4 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-1.5 font-semibold tracking-tight">
          <Icon className="text-primary size-4" />
          Destaques
        </h2>
        <div className="hidden gap-1 sm:flex">
          <button
            type="button"
            aria-label="Anterior"
            onClick={() => scrollBy(-1)}
            className="text-muted-foreground hover:text-foreground hover:bg-muted flex size-7 items-center justify-center rounded-full border"
          >
            <ChevronLeft className="size-4" />
          </button>
          <button
            type="button"
            aria-label="Próximo"
            onClick={() => scrollBy(1)}
            className="text-muted-foreground hover:text-foreground hover:bg-muted flex size-7 items-center justify-center rounded-full border"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>
      <div
        ref={scroller}
        className="-mx-4 flex snap-x [scrollbar-width:none] gap-3 overflow-x-auto scroll-smooth px-4 pb-2 [&::-webkit-scrollbar]:hidden"
      >
        {products.map((product) => {
          const outOfStock =
            product.stock_control_enabled && (product.stock_quantity ?? 0) <= 0
          return (
            <button
              key={product.id}
              type="button"
              onClick={() => setOpenId(product.id)}
              className="bg-card group hover:shadow-raised w-32 shrink-0 snap-start overflow-hidden rounded-xl border text-left transition-shadow"
            >
              <span className="relative block">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={product.image_url ?? "/placeholder-image.svg"}
                  alt=""
                  className="bg-muted aspect-square w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                />
                {outOfStock ? (
                  <span className="absolute inset-x-0 top-0 bg-stone-900/80 py-0.5 text-center text-[0.65rem] font-semibold tracking-wide text-white uppercase">
                    Esgotado
                  </span>
                ) : null}
              </span>
              <span className="block space-y-0.5 p-2.5">
                <span className="line-clamp-2 block text-[0.8rem] leading-snug font-medium">
                  {product.name}
                </span>
                {product.promo_price_cents ? (
                  <span className="text-muted-foreground block text-[0.7rem] line-through">
                    {formatBRL(product.price_cents)}
                  </span>
                ) : null}
                <span className="block text-sm font-semibold tabular-nums">
                  {formatBRL(product.promo_price_cents ?? product.price_cents)}
                </span>
              </span>
            </button>
          )
        })}
      </div>

      {openProduct ? (
        <ProductDetailSheet
          product={openProduct}
          open
          onOpenChange={(open) => {
            if (!open) setOpenId(null)
          }}
        />
      ) : null}
    </section>
  )
}
