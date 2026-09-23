"use client"

import { useActionState, useTransition } from "react"
import { useFormStatus } from "react-dom"
import {
  updateDeliveryZoneAction,
  toggleDeliveryZoneActiveAction,
  type DeliveryActionState,
} from "@/app/(admin)/entrega/actions"
import type { DeliveryZone } from "@/lib/services/delivery"
import { centsToReais } from "@/lib/utils/money"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"

const initialState: DeliveryActionState = {}

function SaveButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" size="sm" variant="outline" disabled={pending}>
      {pending ? "Salvando..." : "Salvar"}
    </Button>
  )
}

export function DeliveryZoneRow({ zone }: { zone: DeliveryZone }) {
  const [state, formAction] = useActionState(
    updateDeliveryZoneAction,
    initialState,
  )
  const [isTogglePending, startToggleTransition] = useTransition()

  return (
    <form
      action={formAction}
      className="flex flex-wrap items-center gap-3 border-b py-3 last:border-b-0"
    >
      <input type="hidden" name="zoneId" value={zone.id} />
      <Input
        name="name"
        defaultValue={zone.name}
        aria-label="Nome da região"
        className="min-w-32 flex-1"
      />
      <div className="flex items-center gap-1">
        <span className="text-muted-foreground text-sm">R$</span>
        <Input
          name="fee"
          type="number"
          step="0.01"
          min="0"
          defaultValue={centsToReais(zone.fee_cents)}
          aria-label="Taxa"
          className="w-24"
        />
      </div>
      <div className="flex items-center gap-1">
        <Input
          name="estimatedTimeMinutes"
          type="number"
          min="1"
          step="1"
          defaultValue={zone.estimated_time_minutes}
          aria-label="Prazo em minutos"
          className="w-16"
        />
        <span className="text-muted-foreground text-sm">min</span>
      </div>
      <div className="flex items-center gap-2">
        <input type="hidden" name="active" value={zone.active ? "on" : ""} />
        <Switch
          checked={zone.active}
          disabled={isTogglePending}
          onCheckedChange={(checked) =>
            startToggleTransition(() =>
              toggleDeliveryZoneActiveAction(zone.id, checked),
            )
          }
        />
      </div>
      <SaveButton />
      {state.error ? (
        <p className="text-destructive w-full text-sm" role="alert">
          {state.error}
        </p>
      ) : null}
    </form>
  )
}
