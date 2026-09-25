"use client"

import { useActionState } from "react"
import { useFormStatus } from "react-dom"
import { Plus } from "lucide-react"
import {
  createCouponAction,
  type CouponActionState,
} from "@/app/(admin)/cupons/actions"
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

const initialState: CouponActionState = {}

const DISCOUNT_TYPE_OPTIONS = [
  { value: "percentage", label: "% Porcentagem" },
  { value: "fixed", label: "R$ Valor fixo" },
] as const

function AddButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" size="sm" variant="outline" disabled={pending}>
      <Plus />
      {pending ? "Criando..." : "Novo cupom"}
    </Button>
  )
}

export function NewCouponForm() {
  const [state, formAction] = useActionState(createCouponAction, initialState)

  return (
    <form
      action={formAction}
      key={state.success}
      className="flex flex-wrap items-end gap-3 pt-3"
    >
      <div className="w-32 space-y-1">
        <Label className="text-muted-foreground text-xs">Código</Label>
        <Input
          name="code"
          placeholder="BEMVINDO10"
          className="uppercase"
          required
        />
      </div>
      <div className="w-36 space-y-1">
        <Label className="text-muted-foreground text-xs">Tipo</Label>
        <Select name="discountType" defaultValue="percentage" items={DISCOUNT_TYPE_OPTIONS}>
          <SelectTrigger className="w-full" aria-label="Tipo de desconto">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {DISCOUNT_TYPE_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="w-24 space-y-1">
        <Label className="text-muted-foreground text-xs">Desconto</Label>
        <Input name="discountValue" type="number" step="0.01" min="0" placeholder="10" required />
      </div>
      <div className="w-28 space-y-1">
        <Label className="text-muted-foreground text-xs">Pedido mín. (R$)</Label>
        <Input name="minOrder" type="number" step="0.01" min="0" placeholder="0" />
      </div>
      <div className="w-24 space-y-1">
        <Label className="text-muted-foreground text-xs">Limite de usos</Label>
        <Input name="usageLimit" type="number" min="1" step="1" placeholder="∞" />
      </div>
      <div className="w-36 space-y-1">
        <Label className="text-muted-foreground text-xs">Validade</Label>
        <Input name="expiresAt" type="date" />
      </div>
      <input type="hidden" name="active" value="on" />
      <AddButton />
      {state.error ? (
        <p className="text-destructive w-full text-sm" role="alert">
          {state.error}
        </p>
      ) : null}
    </form>
  )
}
