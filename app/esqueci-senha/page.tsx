"use client"

import { useActionState } from "react"
import Link from "next/link"
import { useFormStatus } from "react-dom"
import {
  forgotPasswordAction,
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
      {pending ? "Enviando..." : "Enviar link de redefinição"}
    </Button>
  )
}

export default function EsqueciSenhaPage() {
  const [state, formAction] = useActionState(
    forgotPasswordAction,
    initialState,
  )

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
          <h1 className="text-2xl font-semibold">Esqueceu sua senha?</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Informe seu e-mail e enviaremos um link para redefinir
          </p>
        </div>

        {state.success ? (
          <p className="text-sm" role="status">
            {state.success}
          </p>
        ) : (
          <form action={formAction} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
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
        )}

        <p className="text-muted-foreground mt-4 text-center text-sm">
          <Link
            href="/login"
            className="text-primary underline underline-offset-4"
          >
            Voltar para o login
          </Link>
        </p>
      </div>
    </main>
  )
}
