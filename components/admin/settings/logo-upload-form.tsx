"use client"

import { useActionState, useState } from "react"
import { useFormStatus } from "react-dom"
import {
  uploadLogoAction,
  type SettingsActionState,
} from "@/app/(admin)/configuracoes/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
    <Button type="submit" disabled={pending} size="sm">
      {pending ? "Enviando..." : "Salvar logo"}
    </Button>
  )
}

export function LogoUploadForm({ logoUrl }: { logoUrl: string | null }) {
  const [state, formAction] = useActionState(uploadLogoAction, initialState)
  const [preview, setPreview] = useState<string | null>(null)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Logo da loja</CardTitle>
        <CardDescription>Aparece no cardápio público</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="flex items-center gap-4">
          <div className="bg-muted flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-full">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={preview ?? logoUrl ?? "/file.svg"}
              alt="Logo da loja"
              className="size-full object-cover"
            />
          </div>
          <div className="flex-1 space-y-2">
            <Label htmlFor="logo">Imagem (máx. 2MB)</Label>
            <Input
              id="logo"
              name="logo"
              type="file"
              accept="image/*"
              required
              onChange={(event) => {
                const file = event.target.files?.[0]
                setPreview(file ? URL.createObjectURL(file) : null)
              }}
            />
          </div>
          <SubmitButton />
        </form>
        {state.error ? (
          <p className="text-destructive mt-2 text-sm" role="alert">
            {state.error}
          </p>
        ) : null}
        {state.success ? (
          <p className="mt-2 text-sm" role="status">
            {state.success}
          </p>
        ) : null}
      </CardContent>
    </Card>
  )
}
