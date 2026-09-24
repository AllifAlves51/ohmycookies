"use client"

import { useState, useTransition } from "react"
import { Plus, Trash2 } from "lucide-react"
import { createManualOrderAction } from "@/app/(admin)/pedidos/actions"
import type { Product } from "@/lib/services/product"
import type { DeliveryZone } from "@/lib/services/delivery"
import { formatBRL } from "@/lib/utils/money"
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

type ItemRow = { productId: string; quantity: number }

export function NewOrderDialog({
  products,
  deliveryZones,
}: {
  products: Product[]
  deliveryZones: DeliveryZone[]
}) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [customerName, setCustomerName] = useState("")
  const [customerWhatsapp, setCustomerWhatsapp] = useState("")
  const [fulfillmentType, setFulfillmentType] = useState<
    "delivery" | "pickup"
  >("pickup")
  const [deliveryZoneId, setDeliveryZoneId] = useState("")
  const [items, setItems] = useState<ItemRow[]>([{ productId: "", quantity: 1 }])

  const activeProducts = products.filter((p) => p.active)

  function updateItem(index: number, patch: Partial<ItemRow>) {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, ...patch } : item)),
    )
  }

  function removeItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index))
  }

  function resetForm() {
    setCustomerName("")
    setCustomerWhatsapp("")
    setFulfillmentType("pickup")
    setDeliveryZoneId("")
    setItems([{ productId: "", quantity: 1 }])
    setError(null)
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setError(null)

    const validItems = items.filter((item) => item.productId)
    if (validItems.length === 0) {
      setError("Adicione ao menos um item")
      return
    }

    startTransition(async () => {
      const result = await createManualOrderAction({
        customerName,
        customerWhatsapp,
        fulfillmentType,
        deliveryZoneId: fulfillmentType === "delivery" ? deliveryZoneId || null : null,
        items: validItems,
      })

      if (result.error) {
        setError(result.error)
        return
      }

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
          <Button>
            <Plus />
            Criar pedido
          </Button>
        }
      />
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Criar pedido</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="customerName">Nome do cliente</Label>
            <Input
              id="customerName"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="customerWhatsapp">WhatsApp (DDD + número)</Label>
            <Input
              id="customerWhatsapp"
              value={customerWhatsapp}
              onChange={(e) => setCustomerWhatsapp(e.target.value)}
              placeholder="66999990000"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant={fulfillmentType === "pickup" ? "default" : "outline"}
              onClick={() => setFulfillmentType("pickup")}
            >
              Retirada
            </Button>
            <Button
              type="button"
              variant={fulfillmentType === "delivery" ? "default" : "outline"}
              onClick={() => setFulfillmentType("delivery")}
            >
              Entrega
            </Button>
          </div>

          {fulfillmentType === "delivery" ? (
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
                  <SelectValue placeholder="Selecione a região" />
                </SelectTrigger>
                <SelectContent>
                  {deliveryZones.map((zone) => (
                    <SelectItem key={zone.id} value={zone.id}>
                      {zone.name} — {formatBRL(zone.fee_cents)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : null}

          <fieldset className="space-y-3">
            <legend className="text-sm font-medium">Itens</legend>
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
                  <SelectTrigger className="flex-1">
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
                  value={item.quantity}
                  onChange={(e) =>
                    updateItem(index, {
                      quantity: Number(e.target.value) || 1,
                    })
                  }
                  className="w-16"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => removeItem(index)}
                  disabled={items.length === 1}
                >
                  <Trash2 />
                </Button>
              </div>
            ))}
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
          </fieldset>

          {error ? (
            <p className="text-destructive text-sm" role="alert">
              {error}
            </p>
          ) : null}

          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? "Criando..." : "Criar pedido"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
