"use client"

import { useActionState, useTransition } from "react"
import { useFormStatus } from "react-dom"
import { Trash2 } from "lucide-react"
import {
  updateCouponAction,
  toggleCouponActiveAction,
  deleteCouponAction,
  type CouponActionState,
} from "@/app/(admin)/cupons/actions"
import type { Coupon } from "@/lib/services/coupon"
import { centsToReais } from "@/lib/utils/money"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

const initialState: CouponActionState = {}

const DISCOUNT_TYPE_OPTIONS = [
  { value: "percentage", label: "% Porcentagem" },
  { value: "fixed", label: "R$ Valor fixo" },
] as const

function SaveButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" size="sm" variant="outline" disabled={pending}>
      {pending ? "Salvando..." : "Salvar"}
    </Button>
  )
}

function toDateInputValue(iso: string | null) {
  if (!iso) return ""
  return iso.slice(0, 10)
}

export function CouponRow({ coupon }: { coupon: Coupon }) {
  const [state, formAction] = useActionState(updateCouponAction, initialState)
  const [isTogglePending, startToggleTransition] = useTransition()
  const [isDeletePending, startDeleteTransition] = useTransition()

  return (
    <form
      action={formAction}
      className="grid grid-cols-2 items-end gap-3 border-b py-3 last:border-b-0 sm:grid-cols-[100px_140px_110px_110px_90px_130px_auto_auto]"
    >
      <input type="hidden" name="couponId" value={coupon.id} />

      <div className="space-y-1">
        <Label className="text-muted-foreground text-xs">Código</Label>
        <Input
          name="code"
          defaultValue={coupon.code}
          className="uppercase"
          aria-label="Código"
        />
      </div>

      <div className="space-y-1">
        <Label className="text-muted-foreground text-xs">Tipo</Label>
        <Select
          name="discountType"
          defaultValue={coupon.discount_type}
          items={DISCOUNT_TYPE_OPTIONS}
        >
          <SelectTrigger aria-label="Tipo de desconto">
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

      <div className="space-y-1">
        <Label className="text-muted-foreground text-xs">Desconto</Label>
        <Input
          name="discountValue"
          type="number"
          step={coupon.discount_type === "percentage" ? "1" : "0.01"}
          min="0"
          defaultValue={
            coupon.discount_type === "percentage"
              ? coupon.discount_value
              : centsToReais(coupon.discount_value)
          }
          aria-label="Valor do desconto"
        />
      </div>

      <div className="space-y-1">
        <Label className="text-muted-foreground text-xs">Pedido mín. (R$)</Label>
        <Input
          name="minOrder"
          type="number"
          step="0.01"
          min="0"
          defaultValue={
            coupon.min_order_cents > 0 ? centsToReais(coupon.min_order_cents) : ""
          }
          placeholder="0"
          aria-label="Pedido mínimo"
        />
      </div>

      <div className="space-y-1">
        <Label className="text-muted-foreground text-xs">Limite de usos</Label>
        <Input
          name="usageLimit"
          type="number"
          min="1"
          step="1"
          defaultValue={coupon.usage_limit ?? ""}
          placeholder="∞"
          aria-label="Limite de usos"
        />
      </div>

      <div className="space-y-1">
        <Label className="text-muted-foreground text-xs">Validade</Label>
        <Input
          name="expiresAt"
          type="date"
          defaultValue={toDateInputValue(coupon.expires_at)}
          aria-label="Validade"
        />
      </div>

      <div className="flex items-center gap-2">
        <input type="hidden" name="active" value={coupon.active ? "on" : ""} />
        <Switch
          checked={coupon.active}
          disabled={isTogglePending}
          onCheckedChange={(checked) =>
            startToggleTransition(() =>
              toggleCouponActiveAction(coupon.id, checked),
            )
          }
        />
        <span className="text-muted-foreground text-xs">
          {coupon.usage_count} {coupon.usage_count === 1 ? "uso" : "usos"}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <SaveButton />
        <AlertDialog>
          <AlertDialogTrigger
            render={
              <Button
                type="button"
                size="icon-sm"
                variant="ghost"
                className="text-destructive"
                aria-label={`Excluir cupom ${coupon.code}`}
                disabled={isDeletePending}
              />
            }
          >
            <Trash2 className="size-4" />
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir cupom {coupon.code}?</AlertDialogTitle>
              <AlertDialogDescription>
                Essa ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-white hover:bg-destructive/90"
                onClick={() =>
                  startDeleteTransition(() => deleteCouponAction(coupon.id))
                }
              >
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {state.error ? (
        <p className="text-destructive col-span-full text-sm" role="alert">
          {state.error}
        </p>
      ) : null}
    </form>
  )
}
