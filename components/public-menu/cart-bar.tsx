"use client"

import { useState } from "react"
import { Trash2 } from "lucide-react"
import { useCart } from "@/components/public-menu/cart-context"
import type { DeliveryZone } from "@/lib/services/delivery"
import type { WhatsappOrderSummary } from "@/lib/utils/whatsapp"
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
}: {
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
