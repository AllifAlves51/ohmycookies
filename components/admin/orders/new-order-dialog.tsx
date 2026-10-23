"use client"

import { useMemo, useState, useTransition } from "react"
import {
  Loader2,
  MapPin,
  Plus,
  Store,
  Trash2,
  Truck,
  UserCheck,
} from "lucide-react"
import { toast } from "sonner"
import {
  createManualOrderAction,
  estimateManualDeliveryAction,
  lookupCustomerAction,
} from "@/app/(admin)/pedidos/actions"
import type { Product } from "@/lib/services/product"
import type { DeliveryZone } from "@/lib/services/delivery"
import type { AddressInput } from "@/lib/validations/store"
import { formatBRL } from "@/lib/utils/money"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Segmented } from "@/components/ui/segmented"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  DiscountField,
  NO_DISCOUNT,
  discountToCents,
  type DiscountValue,
} from "@/components/admin/orders/discount-field"

type ItemRow = { productId: string; quantity: number }
type Payment = "cash" | "pix" | "card"

function emptyAddress(defaults: { city: string; state: string }): AddressInput {
  return {
    street: "",
    number: "",
    neighborhood: "",
    complement: "",
    city: defaults.city,
    state: defaults.state,
    zip: "",
  }
}

function Section({
  title,
  children,
  aside,
}: {
  title: string
  children: React.ReactNode
  aside?: React.ReactNode
}) {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-muted-foreground text-[0.7rem] font-semibold tracking-[0.08em] uppercase">
          {title}
        </h3>
        {aside}
      </div>
      {children}
    </section>
  )
}

export function NewOrderDialog({
  products,
  deliveryZones,
  storeCity,
  storeState,
}: {
  products: Product[]
  deliveryZones: DeliveryZone[]
  storeCity: string
  storeState: string
}) {
  const addressDefaults = { city: storeCity, state: storeState }
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [isLooking, startLooking] = useTransition()
  const [isEstimating, startEstimating] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [customerName, setCustomerName] = useState("")
  const [customerWhatsapp, setCustomerWhatsapp] = useState("")
  const [knownCustomer, setKnownCustomer] = useState(false)
  const [fulfillmentType, setFulfillmentType] = useState<"delivery" | "pickup">(
    "pickup",
  )
  const [deliveryZoneId, setDeliveryZoneId] = useState("")
  const [address, setAddress] = useState<AddressInput>(() =>
    emptyAddress(addressDefaults),
  )
  const [estimateNote, setEstimateNote] = useState<string | null>(null)
  const [items, setItems] = useState<ItemRow[]>([
    { productId: "", quantity: 1 },
  ])
  const [paymentMethod, setPaymentMethod] = useState<Payment>("pix")
  const [discount, setDiscount] = useState<DiscountValue>(NO_DISCOUNT)
  const [notes, setNotes] = useState("")

  const activeProducts = products.filter((p) => p.active)
  const activeZones = deliveryZones.filter((z) => z.active)
  const productById = useMemo(
    () => new Map(products.map((p) => [p.id, p])),
    [products],
  )

  const subtotal = items.reduce((sum, item) => {
    const product = productById.get(item.productId)
    if (!product) return sum
    return (
      sum + (product.promo_price_cents ?? product.price_cents) * item.quantity
    )
  }, 0)
  const zone = activeZones.find((z) => z.id === deliveryZoneId)
  const deliveryFee =
    fulfillmentType === "delivery" ? (zone?.fee_cents ?? 0) : 0
  const gross = subtotal + deliveryFee
  const discountCents = discountToCents(discount, gross)
  const total = gross - discountCents

  function updateItem(index: number, patch: Partial<ItemRow>) {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, ...patch } : item)),
    )
  }

  function patchAddress(patch: Partial<AddressInput>) {
    setAddress((prev) => ({ ...prev, ...patch }))
    setEstimateNote(null)
  }

  function resetForm() {
    setCustomerName("")
    setCustomerWhatsapp("")
    setKnownCustomer(false)
    setFulfillmentType("pickup")
    setDeliveryZoneId("")
    setAddress(emptyAddress(addressDefaults))
    setEstimateNote(null)
    setItems([{ productId: "", quantity: 1 }])
    setPaymentMethod("pix")
    setDiscount(NO_DISCOUNT)
    setNotes("")
    setError(null)
  }

  function handleWhatsappBlur() {
    const digits = customerWhatsapp.replace(/\D/g, "")
    if (digits !== customerWhatsapp) setCustomerWhatsapp(digits)
    if (digits.length < 10) return

    startLooking(async () => {
      const customer = await lookupCustomerAction(digits)
      setKnownCustomer(Boolean(customer))
      if (!customer) return
      setCustomerName((prev) => prev || customer.name)
      if (customer.address) {
        setAddress((prev) =>
          prev.street.trim()
            ? prev
            : { ...emptyAddress(addressDefaults), ...customer.address },
        )
      }
    })
  }

  function handleEstimate() {
    setEstimateNote(null)
    if (!address.street.trim() || !address.number.trim()) {
      setEstimateNote("Preencha rua e número para calcular.")
      return
    }
    startEstimating(async () => {
      const estimate = await estimateManualDeliveryAction(address)
      if (!estimate) {
        setEstimateNote(
          "Não foi possível calcular pela distância. Escolha a região manualmente.",
        )
        return
      }
      setDeliveryZoneId(estimate.zoneId)
      setEstimateNote(
        `${estimate.distanceKm} km · ${estimate.zoneName} · ${formatBRL(estimate.feeCents)}`,
      )
    })
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setError(null)

    const validItems = items.filter((item) => item.productId)
    if (validItems.length === 0) {
      setError("Adicione ao menos um item")
      return
    }

    const isDelivery = fulfillmentType === "delivery"
    if (
      isDelivery &&
      (!address.street.trim() ||
        !address.number.trim() ||
        !address.neighborhood.trim())
    ) {
      setError("Preencha rua, número e bairro do endereço de entrega")
      return
    }

    startTransition(async () => {
      const result = await createManualOrderAction({
        customerName,
        customerWhatsapp: customerWhatsapp.replace(/\D/g, ""),
        fulfillmentType,
        deliveryZoneId: isDelivery ? deliveryZoneId || null : null,
        address: isDelivery ? address : null,
        paymentMethod,
        discountCents,
        notes,
        items: validItems,
      })

      if (result.error) {
        setError(result.error)
        return
      }

      toast.success("Pedido criado")
      resetForm()
      setOpen(false)
    })
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) resetForm()
      }}
    >
      <DialogTrigger
        render={
          <Button size="lg">
            <Plus />
            Novo pedido
          </Button>
        }
      />
      <DialogContent className="max-h-[92vh] gap-0 overflow-y-auto p-0 sm:max-w-xl">
        <DialogHeader className="border-b px-6 pt-5 pb-4">
          <DialogTitle>Novo pedido</DialogTitle>
          <DialogDescription>
            Para pedidos recebidos por telefone, WhatsApp ou no balcão.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-7 px-6 py-5">
            <Section
              title="Cliente"
              aside={
                isLooking ? (
                  <span className="text-muted-foreground flex items-center gap-1 text-xs">
                    <Loader2 className="size-3 animate-spin" />
                    Buscando cadastro
                  </span>
                ) : knownCustomer ? (
                  <span className="flex items-center gap-1 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                    <UserCheck className="size-3.5" />
                    Cliente já cadastrado
                  </span>
                ) : null
              }
            >
              <div className="grid gap-3 sm:grid-cols-[1fr_1.2fr]">
                <div className="space-y-1.5">
                  <Label htmlFor="customerWhatsapp">WhatsApp</Label>
                  <Input
                    id="customerWhatsapp"
                    inputMode="tel"
                    autoComplete="off"
                    value={customerWhatsapp}
                    onChange={(e) => {
                      setCustomerWhatsapp(e.target.value)
                      setKnownCustomer(false)
                    }}
                    onBlur={handleWhatsappBlur}
                    placeholder="DDD + número"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="customerName">Nome</Label>
                  <Input
                    id="customerName"
                    autoComplete="off"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    required
                  />
                </div>
              </div>
            </Section>

            <Section title="Entrega">
              <Segmented
                aria-label="Tipo de pedido"
                value={fulfillmentType}
                onChange={setFulfillmentType}
                options={[
                  [
                    "pickup",
                    <>
                      <Store />
                      Retirada
                    </>,
                  ],
                  [
                    "delivery",
                    <>
                      <Truck />
                      Entrega
                    </>,
                  ],
                ]}
              />

              {fulfillmentType === "delivery" ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-[1fr_96px] gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="street">Rua</Label>
                      <Input
                        id="street"
                        value={address.street}
                        onChange={(e) =>
                          patchAddress({ street: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="number">Número</Label>
                      <Input
                        id="number"
                        value={address.number}
                        onChange={(e) =>
                          patchAddress({ number: e.target.value })
                        }
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="neighborhood">Bairro</Label>
                      <Input
                        id="neighborhood"
                        value={address.neighborhood}
                        onChange={(e) =>
                          patchAddress({ neighborhood: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="complement">Complemento</Label>
                      <Input
                        id="complement"
                        placeholder="Apto, bloco, referência"
                        value={address.complement}
                        onChange={(e) =>
                          patchAddress({ complement: e.target.value })
                        }
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-[1fr_72px_112px] gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="city">Cidade</Label>
                      <Input
                        id="city"
                        value={address.city}
                        onChange={(e) => patchAddress({ city: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="state">UF</Label>
                      <Input
                        id="state"
                        maxLength={2}
                        value={address.state}
                        onChange={(e) =>
                          patchAddress({ state: e.target.value.toUpperCase() })
                        }
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="zip">CEP</Label>
                      <Input
                        id="zip"
                        inputMode="numeric"
                        placeholder="Opcional"
                        value={address.zip}
                        onChange={(e) => patchAddress({ zip: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-end justify-between gap-2">
                      <Label htmlFor="deliveryZoneId">Região / taxa</Label>
                      <Button
                        type="button"
                        variant="link"
                        size="xs"
                        className="h-auto px-0"
                        onClick={handleEstimate}
                        disabled={isEstimating}
                      >
                        {isEstimating ? (
                          <Loader2 className="animate-spin" />
                        ) : (
                          <MapPin />
                        )}
                        Calcular pela distância
                      </Button>
                    </div>
                    <Select
                      value={deliveryZoneId}
                      onValueChange={(value) => setDeliveryZoneId(value ?? "")}
                      items={activeZones.map((z) => ({
                        value: z.id,
                        label: `${z.name} — ${formatBRL(z.fee_cents)}`,
                      }))}
                    >
                      <SelectTrigger id="deliveryZoneId" className="w-full">
                        <SelectValue placeholder="Selecione a região" />
                      </SelectTrigger>
                      <SelectContent>
                        {activeZones.map((z) => (
                          <SelectItem key={z.id} value={z.id}>
                            {z.name} — {formatBRL(z.fee_cents)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {estimateNote ? (
                      <p className="text-muted-foreground text-xs">
                        {estimateNote}
                      </p>
                    ) : null}
                  </div>
                </div>
              ) : null}
            </Section>

            <Section title="Itens">
              <div className="space-y-2">
                {items.map((item, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Select
                      value={item.productId}
                      onValueChange={(value) =>
                        updateItem(index, { productId: value ?? "" })
                      }
                      items={activeProducts.map((product) => ({
                        value: product.id,
                        label: `${product.name} — ${formatBRL(product.promo_price_cents ?? product.price_cents)}`,
                      }))}
                    >
                      <SelectTrigger className="min-w-0 flex-1">
                        <SelectValue placeholder="Selecione um produto" />
                      </SelectTrigger>
                      <SelectContent>
                        {activeProducts.map((product) => (
                          <SelectItem key={product.id} value={product.id}>
                            {product.name} —{" "}
                            {formatBRL(
                              product.promo_price_cents ?? product.price_cents,
                            )}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      type="number"
                      min="1"
                      step="1"
                      aria-label="Quantidade"
                      value={item.quantity}
                      onChange={(e) =>
                        updateItem(index, {
                          quantity: Math.max(
                            1,
                            Math.floor(Number(e.target.value)) || 1,
                          ),
                        })
                      }
                      className="w-16 text-center tabular-nums"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label="Remover item"
                      onClick={() =>
                        setItems((prev) => prev.filter((_, i) => i !== index))
                      }
                      disabled={items.length === 1}
                    >
                      <Trash2 />
                    </Button>
                  </div>
                ))}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  setItems((prev) => [...prev, { productId: "", quantity: 1 }])
                }
              >
                <Plus />
                Adicionar item
              </Button>
            </Section>

            <div className="grid gap-7 sm:grid-cols-2 sm:gap-4">
              <Section title="Pagamento">
                <Segmented
                  aria-label="Forma de pagamento"
                  value={paymentMethod}
                  onChange={setPaymentMethod}
                  options={[
                    ["pix", "Pix"],
                    ["cash", "Dinheiro"],
                    ["card", "Cartão"],
                  ]}
                />
              </Section>
              <Section title="Desconto">
                <DiscountField
                  id="new-order-discount"
                  value={discount}
                  baseCents={gross}
                  onChange={setDiscount}
                />
              </Section>
            </div>

            <Section title="Observações">
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Visível só para a loja (ex: troco para R$ 50)"
                rows={2}
                maxLength={500}
              />
            </Section>
          </div>

          <div className="bg-card space-y-3 border-t px-6 py-4 [@media(min-height:640px)]:sticky [@media(min-height:640px)]:bottom-0">
            <dl className="space-y-1 text-sm">
              <div className="text-muted-foreground flex justify-between">
                <dt>Subtotal</dt>
                <dd className="tabular-nums">{formatBRL(subtotal)}</dd>
              </div>
              {fulfillmentType === "delivery" ? (
                <div className="text-muted-foreground flex justify-between">
                  <dt>Taxa de entrega</dt>
                  <dd className="tabular-nums">
                    {zone ? formatBRL(deliveryFee) : "—"}
                  </dd>
                </div>
              ) : null}
              {discountCents > 0 ? (
                <div className="flex justify-between text-emerald-700 dark:text-emerald-400">
                  <dt>Desconto</dt>
                  <dd className="tabular-nums">−{formatBRL(discountCents)}</dd>
                </div>
              ) : null}
              <div className="flex justify-between pt-1 text-base font-semibold">
                <dt>Total</dt>
                <dd className="tabular-nums">{formatBRL(total)}</dd>
              </div>
            </dl>

            {error ? (
              <p className="text-destructive text-sm" role="alert">
                {error}
              </p>
            ) : null}

            <Button
              type="submit"
              size="lg"
              className="h-10 w-full"
              disabled={isPending}
            >
              {isPending ? <Loader2 className="animate-spin" /> : null}
              {isPending ? "Criando pedido..." : "Criar pedido"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
