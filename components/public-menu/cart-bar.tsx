"use client"

import { useEffect, useState } from "react"
import { Trash2 } from "lucide-react"
import { useCart } from "@/components/public-menu/cart-context"
import type { DeliveryZone } from "@/lib/services/delivery"
import type { WhatsappOrderSummary } from "@/lib/utils/whatsapp"
import type { OpeningHoursInput } from "@/lib/validations/store"
import { closedMessage, isStoreOpenNow } from "@/lib/utils/opening-hours"
import { CartReview } from "@/components/public-menu/cart-review"
import { CheckoutForm } from "@/components/public-menu/checkout-form"
import { OrderSuccess } from "@/components/public-menu/order-success"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"

type Step = "review" | "checkout" | "success"

const STEP_TITLES: Record<Step, string> = {
  review: "Seu pedido",
  checkout: "Finalizar pedido",
  success: "Pedido enviado",
}

export function CartBar({
  storeSlug,
  storeWhatsapp,
  minOrderCents,
  pickupEnabled,
  deliveryEnabled,
  deliveryZones,
  openingHours,
  initiallyOpen,
}: {
  openingHours: OpeningHoursInput | null
  /** Server-computed, so the first render matches the page. */
  initiallyOpen: boolean
  storeSlug: string
  storeWhatsapp: string | null
  minOrderCents: number
  pickupEnabled: boolean
  deliveryEnabled: boolean
  deliveryZones: DeliveryZone[]
}) {
  const { isOpen, openCart, closeCart, clear, itemCount } = useCart()
  const [step, setStep] = useState<Step>("review")
  const [orderSummary, setOrderSummary] = useState<WhatsappOrderSummary | null>(
    null,
  )
  const [storeOpen, setStoreOpen] = useState(initiallyOpen)

  // Re-check every 30s so a page left open past closing time locks
  // checkout (the server refuses those orders anyway).
  useEffect(() => {
    const timer = setInterval(
      () => setStoreOpen(isStoreOpenNow(openingHours)),
      30000,
    )
    return () => clearInterval(timer)
  }, [openingHours])

  const closedNotice = storeOpen ? null : closedMessage(openingHours)

  return (
    <Sheet
      open={isOpen}
      onOpenChange={(next) => {
        if (next) openCart()
        else closeCart()
        if (!next) setStep("review")
      }}
    >
      <SheetContent side="bottom" className="max-h-[85vh] rounded-t-3xl">
        <SheetHeader className="flex-row items-center justify-between space-y-0 pr-12">
          <SheetTitle>{STEP_TITLES[step]}</SheetTitle>
          {step === "review" && itemCount > 0 ? (
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label="Esvaziar carrinho"
              onClick={clear}
            >
              <Trash2 />
            </Button>
          ) : null}
        </SheetHeader>

        {step === "review" ? (
          <CartReview
            minOrderCents={minOrderCents}
            onCheckout={() => setStep("checkout")}
            onAddMoreItems={closeCart}
            closedNotice={closedNotice}
          />
        ) : null}

        {step === "checkout" ? (
          <CheckoutForm
            storeSlug={storeSlug}
            pickupEnabled={pickupEnabled}
            deliveryEnabled={deliveryEnabled}
            deliveryZones={deliveryZones}
            onBack={() => setStep("review")}
            onSuccess={(summary) => {
              setOrderSummary(summary)
              setStep("success")
            }}
          />
        ) : null}

        {step === "success" && orderSummary ? (
          <OrderSuccess
            summary={orderSummary}
            storeSlug={storeSlug}
            storeWhatsapp={storeWhatsapp}
            onClose={closeCart}
          />
        ) : null}
      </SheetContent>
    </Sheet>
  )
}
