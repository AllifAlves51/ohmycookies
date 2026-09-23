"use client"

import { useActionState, useState } from "react"
import { useFormStatus } from "react-dom"
import {
  uploadLoginPhotoAction,
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
      {pending ? "Enviando..." : "Salvar foto"}
    </Button>
  )
}

export function LoginPhotoForm({
  loginPhotoUrl,
}: {
  loginPhotoUrl: string | null
}) {
  const [state, formAction] = useActionState(
    uploadLoginPhotoAction,
    initialState,
  )
  const [preview, setPreview] = useState<string | null>(null)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Foto da tela de login</CardTitle>
        <CardDescription>
          Aparece ao lado do formulário de login e cadastro
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4">
          <div className="bg-muted flex h-20 w-32 shrink-0 items-center justify-center overflow-hidden rounded-xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={preview ?? loginPhotoUrl ?? "/placeholder-image.svg"}
              alt="Foto da tela de login"
              className="size-full object-cover"
            />
          </div>
          <form action={formAction} className="flex flex-1 items-center gap-4">
            <div className="flex-1 space-y-2">
              <Label htmlFor="loginPhoto">Imagem (máx. 4MB)</Label>
              <Input
                id="loginPhoto"
                name="loginPhoto"
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
        </div>
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
