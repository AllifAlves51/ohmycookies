"use client"

import { useState, useTransition } from "react"
import { Minus, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"
import {
  updateOrderAction,
  type OrderDetailItem,
} from "@/app/(admin)/pedidos/actions"
import type { OrderWithCustomer, PaymentPreference } from "@/lib/services/order"
import type { Product } from "@/lib/services/product"
import type { AddressInput } from "@/lib/validations/store"
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
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

type Row = {
  /** order_items.id for existing rows, null for products added here. */
  id: string | null
  /** null when the product was deleted after the order — the item can
   * still be kept or removed, just not re-added. */
  productId: string | null
  name: string
  unitPriceCents: number
  quantity: number
}

const PAYMENT_OPTIONS: [PaymentPreference, string][] = [
  ["pix", "Pix"],
  ["cash", "Dinheiro"],
  ["card", "Cartão"],
]

const EMPTY_ADDRESS: AddressInput = {
  street: "",
  number: "",
  neighborhood: "",
  complement: "",
  city: "Primavera do Leste",
  state: "MT",
  zip: "",
}

export function EditOrderDialog({
  order,
  items,
  products,
  open,
  onOpenChange,
  onSaved,
}: {
  order: OrderWithCustomer
  items: OrderDetailItem[]
  products: Product[]
  open: boolean
  onOpenChange: (open: boolean) => void
  onSaved: () => void
}) {
  const [rows, setRows] = useState<Row[]>(() =>
    items.map((item) => ({
      id: item.id,
      productId: item.productId,
      name: item.productName,
      unitPriceCents: item.unitPriceCents,
      quantity: item.quantity,
    })),
  )
  const [payment, setPayment] = useState<PaymentPreference>(
    order.payment_preference ?? "pix",
  )
  const [address, setAddress] = useState<AddressInput>(
    order.delivery_address ?? EMPTY_ADDRESS,
  )
  const [productToAdd, setProductToAdd] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isSaving, startSaving] = useTransition()

  const isDelivery = order.fulfillment_type === "delivery"
  const activeProducts = products.filter((p) => p.active)
  const subtotal = rows.reduce(
    (sum, r) => sum + r.unitPriceCents * r.quantity,
    0,
  )

  function setQuantity(index: number, quantity: number) {
    setRows((prev) =>
      prev.map((row, i) => (i === index ? { ...row, quantity } : row)),
    )
  }

  function addProduct() {
    const product = activeProducts.find((p) => p.id === productToAdd)
    if (!product) return
    setRows((prev) => {
      const existing = prev.findIndex((r) => r.productId === product.id)
      if (existing >= 0) {
        return prev.map((row, i) =>
          i === existing ? { ...row, quantity: row.quantity + 1 } : row,
        )
      }
      return [
        ...prev,
        {
          id: null,
          productId: product.id,
          name: product.name,
          unitPriceCents: product.promo_price_cents ?? product.price_cents,
          quantity: 1,
        },
      ]
    })
    setProductToAdd("")
  }

  function handleSave() {
    setError(null)
    if (rows.length === 0) {
      setError("O pedido precisa ter ao menos um item.")
      return
    }
    if (
      isDelivery &&
      (!address.street.trim() ||
        !address.number.trim() ||
        !address.neighborhood.trim())
    ) {
      setError("Preencha rua, número e bairro do endereço de entrega.")
      return
    }

    startSaving(async () => {
      const result = await updateOrderAction(order.id, {
        items: rows.map((row) => ({
          id: row.id,
          productId: row.productId,
          quantity: row.quantity,
        })),
        paymentMethod: payment,
        address: isDelivery ? address : null,
      })
      if (result.error) {
        setError(result.error)
        return
      }
      toast.success(`Pedido #${order.order_number} atualizado`)
      onSaved()
      onOpenChange(false)
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Editar pedido #{order.order_number}</DialogTitle>
          <DialogDescription>
            Itens novos entram com o preço atual do cardápio. Total, taxa de
            entrega e estoque são recalculados ao salvar.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">Itens</legend>
            {rows.length === 0 ? (
              <p className="text-muted-foreground text-xs">
                Nenhum item — adicione ao menos um.
              </p>
            ) : null}
            {rows.map((row, index) => (
              <div
                key={row.id ?? `new-${row.productId}`}
                className="flex items-center gap-2 rounded-lg border p-2 text-sm"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{row.name}</p>
                  <p className="text-muted-foreground text-xs">
                    {formatBRL(row.unitPriceCents)} cada
                    {row.id === null ? " · novo" : ""}
                    {row.productId === null ? " · produto excluído" : ""}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon-sm"
                    aria-label="Diminuir"
                    disabled={row.quantity <= 1}
                    onClick={() => setQuantity(index, row.quantity - 1)}
                  >
                    <Minus />
                  </Button>
                  <span className="w-6 text-center tabular-nums">
                    {row.quantity}
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon-sm"
                    aria-label="Aumentar"
                    onClick={() => setQuantity(index, row.quantity + 1)}
                  >
                    <Plus />
                  </Button>
                </div>
                <span className="w-20 text-right font-medium tabular-nums">
                  {formatBRL(row.unitPriceCents * row.quantity)}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Remover ${row.name}`}
                  onClick={() =>
                    setRows((prev) => prev.filter((_, i) => i !== index))
                  }
                >
                  <Trash2 className="text-destructive" />
                </Button>
              </div>
            ))}

            <div className="flex gap-2">
              <Select
                value={productToAdd}
                onValueChange={(value) => setProductToAdd(value ?? "")}
                items={activeProducts.map((p) => ({
                  value: p.id,
                  label: `${p.name} — ${formatBRL(p.promo_price_cents ?? p.price_cents)}`,
                }))}
              >
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Adicionar produto" />
                </SelectTrigger>
                <SelectContent>
                  {activeProducts.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name} —{" "}
                      {formatBRL(p.promo_price_cents ?? p.price_cents)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                type="button"
                variant="outline"
                onClick={addProduct}
                disabled={!productToAdd}
              >
                <Plus />
                Adicionar
              </Button>
            </div>
          </fieldset>

          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">Forma de pagamento</legend>
            <div className="grid grid-cols-3 gap-2">
              {PAYMENT_OPTIONS.map(([value, label]) => (
                <Button
                  key={value}
                  type="button"
                  variant={payment === value ? "default" : "outline"}
                  onClick={() => setPayment(value)}
                >
                  {label}
                </Button>
              ))}
            </div>
          </fieldset>

          {isDelivery ? (
            <fieldset className="space-y-2">
              <legend className="text-sm font-medium">
                Endereço de entrega
              </legend>
              <div className="grid grid-cols-[1fr_90px] gap-2">
                <div className="space-y-1">
                  <Label htmlFor="edit-street">Rua</Label>
                  <Input
                    id="edit-street"
                    value={address.street}
                    onChange={(e) =>
                      setAddress({ ...address, street: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="edit-number">Número</Label>
                  <Input
                    id="edit-number"
                    value={address.number}
                    onChange={(e) =>
                      setAddress({ ...address, number: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label htmlFor="edit-neighborhood">Bairro</Label>
                  <Input
                    id="edit-neighborhood"
                    value={address.neighborhood}
                    onChange={(e) =>
                      setAddress({ ...address, neighborhood: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="edit-complement">Complemento</Label>
                  <Input
                    id="edit-complement"
                    value={address.complement}
                    onChange={(e) =>
                      setAddress({ ...address, complement: e.target.value })
                    }
                  />
                </div>
              </div>
              <p className="text-muted-foreground text-xs">
                A região e a taxa de entrega não mudam ao editar o endereço.
              </p>
            </fieldset>
          ) : null}

          <div className="flex items-center justify-between rounded-lg border p-3 text-sm">
            <span className="text-muted-foreground">Subtotal dos itens</span>
            <span className="font-semibold">{formatBRL(subtotal)}</span>
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
              onClick={() => onOpenChange(false)}
              disabled={isSaving}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              className="flex-1"
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? "Salvando..." : "Salvar alterações"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
