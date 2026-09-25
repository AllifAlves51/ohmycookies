"use client"

import { useActionState, useState } from "react"
import { useFormStatus } from "react-dom"
import { Lightbulb } from "lucide-react"
import {
  updateDeliverySettingsAction,
  type DeliveryActionState,
} from "@/app/(admin)/entrega/actions"
import type { StoreSettings } from "@/lib/services/store"
import { centsToReais } from "@/lib/utils/money"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

const initialState: DeliveryActionState = {}

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" size="sm" disabled={pending}>
      {pending ? "Salvando..." : "Salvar"}
    </Button>
  )
}

export function DeliverySettingsForm({
  settings,
  mapsConfigured,
}: {
  settings: StoreSettings
  mapsConfigured: boolean
}) {
  const [state, formAction] = useActionState(
    updateDeliverySettingsAction,
    initialState,
  )
  const [mapEnabled, setMapEnabled] = useState(
    settings.address_map_confirmation_enabled,
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle>Modalidade de frete: Faixas de entrega - Km</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="orderPrepMinutes">
                Tempo de preparo dos pedidos
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  id="orderPrepMinutes"
                  name="orderPrepMinutes"
                  type="number"
                  min="0"
                  step="1"
                  defaultValue={settings.order_prep_minutes}
                  className="w-24"
                />
                <span className="text-muted-foreground text-sm">min</span>
              </div>
              <p className="text-muted-foreground text-xs">
                Será somado ao tempo de transporte.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="freeDeliveryThreshold">
                Frete grátis em compras acima de
              </Label>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground text-sm">R$</span>
                <Input
                  id="freeDeliveryThreshold"
                  name="freeDeliveryThreshold"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Desativar"
                  defaultValue={
                    settings.free_delivery_threshold_cents != null
                      ? centsToReais(settings.free_delivery_threshold_cents)
                      : ""
                  }
                  className="w-28"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between gap-4 border-t pt-4">
            <div>
              <Label htmlFor="addressMapConfirmationEnabled">
                Mapa de confirmação de endereço
              </Label>
              <p className="text-muted-foreground text-xs">
                Exibir mapa de confirmação de localização após digitar o
                endereço de um pedido.
              </p>
              {!mapsConfigured ? (
                <p className="text-destructive mt-1 text-xs">
                  Requer a chave da API do Google Maps configurada
                  (NEXT_PUBLIC_GOOGLE_MAPS_API_KEY).
                </p>
              ) : null}
            </div>
            <input
              type="hidden"
              name="addressMapConfirmationEnabled"
              value={mapEnabled ? "on" : ""}
            />
            <Switch
              id="addressMapConfirmationEnabled"
              checked={mapEnabled}
              disabled={!mapsConfigured}
              onCheckedChange={setMapEnabled}
            />
          </div>

          {!mapsConfigured ? (
            <div className="bg-muted flex items-start gap-2 rounded-lg p-3 text-xs">
              <Lightbulb className="mt-0.5 size-4 shrink-0" />
              <p>
                Importante: o cálculo de distância usa o trajeto real (via
                Google Maps), não linha reta. Sem a chave configurada, o
                cliente escolhe a faixa manualmente no checkout.
              </p>
            </div>
          ) : null}

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
