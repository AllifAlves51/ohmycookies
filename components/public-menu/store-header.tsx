"use client"

import { Menu, ShoppingBag } from "lucide-react"
import type { Store } from "@/lib/services/store"
import { useCart } from "@/components/public-menu/cart-context"
import { Badge } from "@/components/ui/badge"
import { SheetTrigger } from "@/components/ui/sheet"
import { StoreInfoSheet } from "@/components/public-menu/store-info-sheet"

export function StoreHeader({
  store,
  isOpen,
}: {
  store: Store
  isOpen: boolean
}) {
  const { itemCount, openCart } = useCart()

  return (
    <>
      {/* Stays pinned while the hero photo below scrolls away — otherwise
          the cart/menu buttons disappear the moment you browse products. */}
      <div className="bg-primary/95 sticky top-0 z-30 flex h-14 items-center justify-between px-4 backdrop-blur-sm">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={store.logo_url ?? "/logo.webp"}
          alt={store.name}
          className="size-8 shrink-0 rounded-full border border-white/50 bg-white object-cover"
        />
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={openCart}
            aria-label="Ver carrinho"
            className="relative flex size-9 items-center justify-center rounded-full bg-white/20 text-white"
          >
            <ShoppingBag className="size-4" />
            {itemCount > 0 ? (
              <span className="bg-primary absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full border border-white text-[10px] font-semibold text-white">
                {itemCount}
              </span>
            ) : null}
          </button>
          <StoreInfoSheet
            store={store}
            trigger={
              <SheetTrigger
                render={
                  <button
                    type="button"
                    aria-label="Menu"
                    className="flex size-9 items-center justify-center rounded-full bg-white/20 text-white"
                  />
                }
              >
                <Menu className="size-4" />
              </SheetTrigger>
            }
          />
        </div>
      </div>

      <header className="relative overflow-hidden rounded-b-3xl">
        {store.login_photo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={store.login_photo_url}
            alt=""
            className="absolute inset-0 size-full object-cover"
          />
        ) : (
          <div className="bg-primary absolute inset-0" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-black/10" />

        <div className="relative space-y-1 px-5 pt-6 pb-8 text-white">
          <h1 className="text-2xl leading-tight font-bold">
            Seu momento pede
            <br />
            um cookie.
          </h1>
          <p className="max-w-[85%] text-sm text-white/90">
            Cookies artesanais, feitos com muito amor e ingredientes
            selecionados.
          </p>
          <Badge
            className={
              isOpen
                ? "mt-2 bg-white/20 text-white"
                : "mt-2 bg-black/30 text-white/90"
            }
          >
            {isOpen ? "Aberto agora" : "Fechado no momento"}
          </Badge>
        </div>
      </header>
    </>
  )
}
