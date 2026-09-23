"use client"

import { useActionState } from "react"
import { useFormStatus } from "react-dom"
import {
  updateOpeningHoursAction,
  type SettingsActionState,
} from "@/app/(admin)/configuracoes/actions"
import {
  DEFAULT_OPENING_HOURS,
  WEEK_DAYS,
  type OpeningHoursInput,
} from "@/lib/validations/store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
      {pending ? "Salvando..." : "Salvar horários"}
    </Button>
  )
}

export function OpeningHoursForm({
  openingHours,
}: {
  openingHours: OpeningHoursInput | null
}) {
  const [state, formAction] = useActionState(
    updateOpeningHoursAction,
    initialState,
  )
  const hours = openingHours ?? DEFAULT_OPENING_HOURS

  return (
    <Card>
      <CardHeader>
        <CardTitle>Horário de funcionamento</CardTitle>
        <CardDescription>
          Usado para mostrar se a loja está aberta
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          {WEEK_DAYS.map(({ key, label }) => {
            const day = hours[key]
            return (
              <div
                key={key}
                className="grid grid-cols-[100px_auto_1fr_auto_1fr] items-center gap-3"
              >
                <span className="text-sm">{label}</span>
                <Switch name={`${key}.open`} defaultChecked={day.open} />
                <Input
                  type="time"
                  name={`${key}.from`}
                  defaultValue={day.from}
                  aria-label={`${label} - abre às`}
                />
                <span className="text-muted-foreground text-center text-sm">
                  até
                </span>
                <Input
                  type="time"
                  name={`${key}.to`}
                  defaultValue={day.to}
                  aria-label={`${label} - fecha às`}
                />
              </div>
            )
          })}

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
