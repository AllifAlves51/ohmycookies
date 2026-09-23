"use client"

import { useState } from "react"
import { ShoppingBag } from "lucide-react"
import { useCart } from "@/components/public-menu/cart-context"
import type { DeliveryZone } from "@/lib/services/delivery"
import { formatBRL } from "@/lib/utils/money"
import type { WhatsappOrderSummary } from "@/lib/utils/whatsapp"
import { CartReview } from "@/components/public-menu/cart-review"
import { CheckoutForm } from "@/components/public-menu/checkout-form"
import { OrderSuccess } from "@/components/public-menu/order-success"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"

type Step = "review" | "checkout" | "success"

const STEP_TITLES: Record<Step, string> = {
  review: "Seu carrinho",
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
  const { itemCount, subtotalCents } = useCart()
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<Step>("review")
  const [orderSummary, setOrderSummary] = useState<WhatsappOrderSummary | null>(
    null,
  )

  if (itemCount === 0 && step !== "success") {
    return null
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) setStep("review")
      }}
    >
      {itemCount > 0 ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="bg-primary text-primary-foreground fixed inset-x-4 bottom-4 z-40 flex items-center justify-between rounded-xl px-4 py-3 shadow-lg sm:mx-auto sm:max-w-sm"
        >
          <span className="flex items-center gap-2 text-sm font-medium">
            <ShoppingBag className="size-4" />
            {itemCount} {itemCount === 1 ? "item" : "itens"}
          </span>
          <span className="text-sm font-semibold">
            {formatBRL(subtotalCents)}
          </span>
        </button>
      ) : null}

      <SheetContent side="bottom" className="max-h-[85vh] rounded-t-3xl">
        <SheetHeader>
          <SheetTitle>{STEP_TITLES[step]}</SheetTitle>
        </SheetHeader>

        {step === "review" ? (
          <CartReview
            minOrderCents={minOrderCents}
            onCheckout={() => setStep("checkout")}
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
            storeWhatsapp={storeWhatsapp}
            onClose={() => setOpen(false)}
          />
        ) : null}
      </SheetContent>
    </Sheet>
  )
}
