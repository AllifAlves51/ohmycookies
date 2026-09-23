"use client"

import { useActionState } from "react"
import { useFormStatus } from "react-dom"
import {
  resetPasswordAction,
  type AuthActionState,
} from "@/app/(auth)/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const initialState: AuthActionState = {}

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" className="w-full rounded-xl" disabled={pending}>
      {pending ? "Salvando..." : "Salvar nova senha"}
    </Button>
  )
}

export default function RedefinirSenhaPage() {
  const [state, formAction] = useActionState(resetPasswordAction, initialState)

  return (
    <main className="flex min-h-svh flex-1 items-center justify-center p-6 sm:p-8">
      <div className="w-full max-w-sm">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo.webp"
          alt="OhMyCookies"
          className="mx-auto mb-6 size-16 object-contain"
        />
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold">Nova senha</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Escolha uma nova senha para sua conta
          </p>
        </div>

        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">Nova senha</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirmar nova senha</Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              required
            />
          </div>
          {state.error ? (
            <p className="text-destructive text-sm" role="alert">
              {state.error}
            </p>
          ) : null}
          <SubmitButton />
        </form>
      </div>
    </main>
  )
}
