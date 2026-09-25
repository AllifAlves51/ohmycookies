"use client"

import { useEffect, useState, useTransition } from "react"
import { MapPin } from "lucide-react"
import { useCart } from "@/components/public-menu/cart-context"
import type { DeliveryZone } from "@/lib/services/delivery"
import { formatBRL } from "@/lib/utils/money"
import type { WhatsappOrderSummary } from "@/lib/utils/whatsapp"
import {
  submitOrderAction,
  estimateDeliveryFeeAction,
  type DeliveryEstimate,
} from "@/app/(public)/cardapio/[slug]/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export function CheckoutForm({
  storeSlug,
  pickupEnabled,
  deliveryEnabled,
  deliveryZones,
  onBack,
  onSuccess,
}: {
  storeSlug: string
  pickupEnabled: boolean
  deliveryEnabled: boolean
  deliveryZones: DeliveryZone[]
  onBack: () => void
  onSuccess: (summary: WhatsappOrderSummary) => void
}) {
  const { items, subtotalCents, clear } = useCart()
  const [name, setName] = useState("")
  const [whatsapp, setWhatsapp] = useState("")
  const [fulfillmentType, setFulfillmentType] = useState<"delivery" | "pickup">(
    deliveryEnabled ? "delivery" : "pickup",
  )
  const [deliveryZoneId, setDeliveryZoneId] = useState("")
  const [street, setStreet] = useState("")
  const [number, setNumber] = useState("")
  const [neighborhood, setNeighborhood] = useState("")
  const [complement, setComplement] = useState("")
  const [city, setCity] = useState("")
  const [uf, setUf] = useState("")
  const [zip, setZip] = useState("")
  const [paymentMethod, setPaymentMethod] = useState<
    "cash" | "pix" | "card"
  >("cash")
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [estimate, setEstimate] = useState<DeliveryEstimate | null>(null)
  const [isEstimating, setIsEstimating] = useState(false)

  const canOrder = pickupEnabled || deliveryEnabled
  const selectedZone = deliveryZones.find((zone) => zone.id === deliveryZoneId)
  const deliveryFeeCents =
    fulfillmentType === "delivery"
      ? (estimate?.feeCents ?? selectedZone?.fee_cents ?? 0)
      : 0
  const totalCents = subtotalCents + deliveryFeeCents

  const addressComplete =
    fulfillmentType === "delivery" &&
    street.trim() &&
    number.trim() &&
    neighborhood.trim() &&
    city.trim() &&
    uf.trim() &&
    zip.trim()

  // Tries to auto-detect the delivery zone from the real address once the
  // customer finishes typing it; falls back to the manual Select below
  // whenever Google Maps isn't configured or the lookup fails.
  useEffect(() => {
    if (!addressComplete) {
      return
    }

    let cancelled = false
    const timer = setTimeout(() => {
      setIsEstimating(true)
      estimateDeliveryFeeAction(storeSlug, {
        street,
        number,
        neighborhood,
        complement,
        city,
        state: uf,
        zip,
      })
        .then((result) => {
          if (cancelled) return
          setEstimate(result)
          if (result) setDeliveryZoneId(result.zoneId)
        })
        .finally(() => {
          if (!cancelled) setIsEstimating(false)
        })
    }, 800)

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [addressComplete, street, number, neighborhood, complement, city, uf, zip, storeSlug])

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setError(null)

    startTransition(async () => {
      const result = await submitOrderAction({
        storeSlug,
        customerName: name,
        customerWhatsapp: whatsapp,
        fulfillmentType,
        deliveryZoneId:
          fulfillmentType === "delivery" ? deliveryZoneId || null : null,
        address:
          fulfillmentType === "delivery"
            ? { street, number, neighborhood, complement, city, state: uf, zip }
            : null,
        items: items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          notes: item.notes,
        })),
        paymentMethod,
      })

      if (result.error) {
        setError(result.error)
        return
      }

      const summary: WhatsappOrderSummary = {
        orderId: result.orderId ?? "",
        orderNumber: result.orderNumber ?? 0,
        customerName: name,
        items: items.map((item) => ({
          name: item.name,
          quantity: item.quantity,
          unitPriceCents: item.unitPriceCents,
          notes: item.notes,
        })),
        subtotalCents,
        deliveryFeeCents,
        discountCents: 0,
        totalCents,
        fulfillmentType,
        address:
          fulfillmentType === "delivery"
            ? { street, number, neighborhood, complement, city, state: uf, zip }
            : null,
        paymentMethod,
        estimatedMinutes:
          fulfillmentType === "delivery"
            ? (selectedZone?.estimated_time_minutes ?? null)
            : null,
      }

      clear()
      onSuccess(summary)
    })
  }

  if (!canOrder) {
    return (
      <div className="flex-1 p-4">
        <p className="text-muted-foreground text-sm">
          Esta loja não está aceitando pedidos no momento.
        </p>
      </div>
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-1 flex-col overflow-y-auto"
    >
      <div className="flex-1 space-y-4 px-4">
        <div className="space-y-2">
          <Label htmlFor="customerName">Nome</Label>
          <Input
            id="customerName"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="customerWhatsapp">WhatsApp (DDD + número)</Label>
          <Input
            id="customerWhatsapp"
            value={whatsapp}
            onChange={(e) => setWhatsapp(e.target.value)}
            placeholder="66999990000"
            required
          />
        </div>

        {pickupEnabled && deliveryEnabled ? (
          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant={fulfillmentType === "delivery" ? "default" : "outline"}
              onClick={() => setFulfillmentType("delivery")}
            >
              Entrega
            </Button>
            <Button
              type="button"
              variant={fulfillmentType === "pickup" ? "default" : "outline"}
              onClick={() => setFulfillmentType("pickup")}
            >
              Retirada
            </Button>
          </div>
        ) : null}

        {fulfillmentType === "delivery" ? (
          <>
            <fieldset className="space-y-3">
              <legend className="text-sm font-medium">Endereço</legend>
              <div className="grid grid-cols-[1fr_100px] gap-2">
                <div className="space-y-1">
                  <Label htmlFor="street">Rua</Label>
                  <Input
                    id="street"
                    value={street}
                    onChange={(e) => setStreet(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="number">Número</Label>
                  <Input
                    id="number"
                    value={number}
                    onChange={(e) => setNumber(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label htmlFor="neighborhood">Bairro</Label>
                <Input
                  id="neighborhood"
                  value={neighborhood}
                  onChange={(e) => setNeighborhood(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="complement">Complemento</Label>
                <Input
                  id="complement"
                  value={complement}
                  onChange={(e) => setComplement(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-[1fr_80px_120px] gap-2">
                <div className="space-y-1">
                  <Label htmlFor="city">Cidade</Label>
                  <Input
                    id="city"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="uf">UF</Label>
                  <Input
                    id="uf"
                    value={uf}
                    onChange={(e) => setUf(e.target.value)}
                    maxLength={2}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="zip">CEP</Label>
                  <Input
                    id="zip"
                    value={zip}
                    onChange={(e) => setZip(e.target.value)}
                    required
                  />
                </div>
              </div>
            </fieldset>

            {addressComplete && (estimate || isEstimating) ? (
              <div className="bg-secondary flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm">
                <MapPin className="text-primary size-4 shrink-0" />
                {isEstimating ? (
                  <span className="text-muted-foreground">
                    Calculando distância...
                  </span>
                ) : estimate ? (
                  <span>
                    <span className="font-medium">{estimate.zoneName}</span>
                    <span className="text-muted-foreground">
                      {" "}
                      ({estimate.distanceKm} km) — {formatBRL(estimate.feeCents)}
                    </span>
                  </span>
                ) : null}
              </div>
            ) : null}

            {addressComplete && !isEstimating && !estimate ? (
              <div className="space-y-2">
                <Label htmlFor="deliveryZoneId">Região de entrega</Label>
                <Select
                  value={deliveryZoneId}
                  onValueChange={(value) => setDeliveryZoneId(value ?? "")}
                  items={deliveryZones.map((zone) => ({
                    value: zone.id,
                    label: `${zone.name} — ${formatBRL(zone.fee_cents)}`,
                  }))}
                >
                  <SelectTrigger id="deliveryZoneId" className="w-full">
                    <SelectValue placeholder="Selecione sua região" />
                  </SelectTrigger>
                  <SelectContent>
                    {deliveryZones.map((zone) => (
                      <SelectItem key={zone.id} value={zone.id}>
                        {zone.name} — {formatBRL(zone.fee_cents)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {deliveryZones.length === 0 ? (
                  <p className="text-destructive text-xs">
                    Nenhuma região de entrega disponível no momento.
                  </p>
                ) : null}
              </div>
            ) : null}
          </>
        ) : null}

        <fieldset className="space-y-2">
          <legend className="text-sm font-medium">Forma de pagamento</legend>
          <p className="text-muted-foreground text-xs">
            Combinado diretamente com a loja — não é cobrado por aqui.
          </p>
          <div className="grid grid-cols-3 gap-2">
            <Button
              type="button"
              variant={paymentMethod === "cash" ? "default" : "outline"}
              onClick={() => setPaymentMethod("cash")}
            >
              Dinheiro
            </Button>
            <Button
              type="button"
              variant={paymentMethod === "pix" ? "default" : "outline"}
              onClick={() => setPaymentMethod("pix")}
            >
              Pix
            </Button>
            <Button
              type="button"
              variant={paymentMethod === "card" ? "default" : "outline"}
              onClick={() => setPaymentMethod("card")}
            >
              Cartão
            </Button>
          </div>
        </fieldset>
      </div>

      <div className="space-y-2 border-t p-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Subtotal</span>
          <span>{formatBRL(subtotalCents)}</span>
        </div>
        {fulfillmentType === "delivery" ? (
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              Entrega{selectedZone ? ` (${selectedZone.name})` : ""}
            </span>
            <span>{formatBRL(deliveryFeeCents)}</span>
          </div>
        ) : null}
        <div className="flex items-center justify-between font-semibold">
          <span>Total</span>
          <span>{formatBRL(totalCents)}</span>
        </div>
        {error ? (
          <p className="text-destructive text-sm" role="alert">
            {error}
          </p>
        ) : null}
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onBack}
            disabled={isPending}
          >
            Voltar
          </Button>
          <Button type="submit" className="flex-1 rounded-xl" disabled={isPending}>
            {isPending ? "Enviando..." : "Confirmar pedido"}
          </Button>
        </div>
      </div>
    </form>
  )
}
