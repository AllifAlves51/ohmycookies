"use client"

import { useActionState, useState } from "react"
import { useFormStatus } from "react-dom"
import {
  uploadAvatarAction,
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

export function AvatarUploadForm({
  avatarUrl,
  initial,
}: {
  avatarUrl: string | null
  initial: string
}) {
  const [state, formAction] = useActionState(uploadAvatarAction, initialState)
  const [preview, setPreview] = useState<string | null>(null)

  const src = preview ?? avatarUrl

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sua foto de perfil</CardTitle>
        <CardDescription>Aparece no canto do painel</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4">
          <div className="bg-primary text-primary-foreground flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-full text-lg font-semibold">
            {src ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={src} alt="Sua foto" className="size-full object-cover" />
            ) : (
              initial
            )}
          </div>
          <form action={formAction} className="flex flex-1 items-center gap-4">
            <div className="flex-1 space-y-2">
              <Label htmlFor="avatar">Imagem (máx. 2MB)</Label>
              <Input
                id="avatar"
                name="avatar"
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
