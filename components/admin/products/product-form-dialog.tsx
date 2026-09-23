"use client"

import { useActionState, useState } from "react"
import { useFormStatus } from "react-dom"
import {
  createProductAction,
  updateProductAction,
  type ProductActionState,
} from "@/app/(admin)/produtos/actions"
import type { Category, Product } from "@/lib/services/product"
import { centsToReais } from "@/lib/utils/money"
import { NO_CATEGORY_VALUE } from "@/lib/validations/product"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
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

const initialState: ProductActionState = {}

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Salvando..." : label}
    </Button>
  )
}

export function ProductFormDialog({
  mode,
  product,
  categories,
  trigger,
}: {
  mode: "create" | "edit"
  product?: Product
  categories: Category[]
  trigger: React.ReactNode
}) {
  const action = mode === "create" ? createProductAction : updateProductAction
  const [state, formAction] = useActionState(action, initialState)
  const [open, setOpen] = useState(false)
  const [stockControlEnabled, setStockControlEnabled] = useState(
    product?.stock_control_enabled ?? false,
  )
  const [handledSuccess, setHandledSuccess] = useState(state.success)

  if (state.success && state.success !== handledSuccess) {
    setHandledSuccess(state.success)
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger as React.ReactElement} />
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Novo produto" : "Editar produto"}
          </DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          {mode === "edit" && product ? (
            <input type="hidden" name="productId" value={product.id} />
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="name">Nome</Label>
            <Input
              id="name"
              name="name"
              defaultValue={product?.name}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              name="description"
              defaultValue={product?.description ?? ""}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="categoryId">Categoria</Label>
            <Select
              name="categoryId"
              defaultValue={product?.category_id ?? NO_CATEGORY_VALUE}
              items={[
                { value: NO_CATEGORY_VALUE, label: "Sem categoria" },
                ...categories.map((category) => ({
                  value: category.id,
                  label: category.name,
                })),
              ]}
            >
              <SelectTrigger id="categoryId" className="w-full">
                <SelectValue placeholder="Selecione uma categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_CATEGORY_VALUE}>Sem categoria</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">Preço (R$)</Label>
              <Input
                id="price"
                name="price"
                type="number"
                step="0.01"
                min="0"
                defaultValue={
                  product ? centsToReais(product.price_cents) : undefined
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="promoPrice">Preço promocional (R$)</Label>
              <Input
                id="promoPrice"
                name="promoPrice"
                type="number"
                step="0.01"
                min="0"
                defaultValue={
                  product?.promo_price_cents
                    ? centsToReais(product.promo_price_cents)
                    : undefined
                }
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="image">Foto (máx. 4MB)</Label>
            <Input id="image" name="image" type="file" accept="image/*" />
          </div>

          <div className="flex items-center gap-3">
            <Switch
              id="stockControlEnabled"
              name="stockControlEnabled"
              checked={stockControlEnabled}
              onCheckedChange={setStockControlEnabled}
            />
            <Label htmlFor="stockControlEnabled">Controlar estoque</Label>
          </div>

          {stockControlEnabled ? (
            <div className="space-y-2">
              <Label htmlFor="stockQuantity">Quantidade em estoque</Label>
              <Input
                id="stockQuantity"
                name="stockQuantity"
                type="number"
                min="0"
                step="1"
                defaultValue={product?.stock_quantity ?? undefined}
              />
            </div>
          ) : null}

          <div className="flex items-center gap-3">
            <Switch
              id="featured"
              name="featured"
              defaultChecked={product?.featured ?? false}
            />
            <Label htmlFor="featured">Produto em destaque</Label>
          </div>

          <div className="flex items-center gap-3">
            <Switch
              id="active"
              name="active"
              defaultChecked={product?.active ?? true}
            />
            <Label htmlFor="active">Ativo no cardápio</Label>
          </div>

          {state.error ? (
            <p className="text-destructive text-sm" role="alert">
              {state.error}
            </p>
          ) : null}

          <SubmitButton
            label={mode === "create" ? "Criar produto" : "Salvar"}
          />
        </form>
      </DialogContent>
    </Dialog>
  )
}
