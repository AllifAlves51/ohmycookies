"use client"

import { useActionState } from "react"
import { useFormStatus } from "react-dom"
import {
  updateStoreSettingsAction,
  type SettingsActionState,
} from "@/app/(admin)/configuracoes/actions"
import type { StoreSettings } from "@/lib/services/store"
import { centsToReais } from "@/lib/utils/money"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

const initialState: SettingsActionState = {}

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Salvando..." : "Salvar configurações"}
    </Button>
  )
}

export function OrderSettingsForm({ settings }: { settings: StoreSettings }) {
  const [state, formAction] = useActionState(
    updateStoreSettingsAction,
    initialState,
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pedidos</CardTitle>
        <CardDescription>
          Valor mínimo e formas de entrega aceitas
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="minOrder">Pedido mínimo (R$)</Label>
            <Input
              id="minOrder"
              name="minOrder"
              type="number"
              step="0.01"
              min="0"
              defaultValue={centsToReais(settings.min_order_cents)}
              className="max-w-40"
            />
          </div>
          <div className="flex items-center gap-3">
            <Switch
              id="pickupEnabled"
              name="pickupEnabled"
              defaultChecked={settings.pickup_enabled}
            />
            <Label htmlFor="pickupEnabled">Aceitar retirada no local</Label>
          </div>
          <div className="flex items-center gap-3">
            <Switch
              id="deliveryEnabled"
              name="deliveryEnabled"
              defaultChecked={settings.delivery_enabled}
            />
            <Label htmlFor="deliveryEnabled">Aceitar entrega (delivery)</Label>
          </div>

          {state.error ? (
            <p className="text-destructive text-sm" role="alert">
              {state.error}
            </p>
          ) : null}
          {state.success ? (
            <p className="text-sm" role="status">
              {state.success}
            </p>
          ) : null}
          <SubmitButton />
        </form>
      </CardContent>
    </Card>
  )
}
