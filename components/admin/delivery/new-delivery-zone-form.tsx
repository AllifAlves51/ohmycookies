"use client"

import { useActionState } from "react"
import { useFormStatus } from "react-dom"
import {
  createDeliveryZoneAction,
  type DeliveryActionState,
} from "@/app/(admin)/entrega/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

const initialState: DeliveryActionState = {}

function AddButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" size="sm" disabled={pending}>
      {pending ? "Adicionando..." : "Adicionar região"}
    </Button>
  )
}

export function NewDeliveryZoneForm() {
  const [state, formAction] = useActionState(
    createDeliveryZoneAction,
    initialState,
  )

  return (
    <form
      action={formAction}
      key={state.success}
      className="flex flex-wrap items-end gap-3 pt-3"
    >
      <div className="min-w-32 flex-1 space-y-1">
        <label className="text-muted-foreground text-xs">Região (bairro)</label>
        <Input name="name" placeholder="Centro" required />
      </div>
      <div className="w-24 space-y-1">
        <label className="text-muted-foreground text-xs">Taxa (R$)</label>
        <Input name="fee" type="number" step="0.01" min="0" defaultValue="0" />
      </div>
      <div className="w-20 space-y-1">
        <label className="text-muted-foreground text-xs">Prazo (min)</label>
        <Input
          name="estimatedTimeMinutes"
          type="number"
          min="1"
          step="1"
          defaultValue="45"
        />
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
