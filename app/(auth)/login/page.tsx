"use client"

import { useActionState } from "react"
import Link from "next/link"
import { useFormStatus } from "react-dom"
import { loginAction, type AuthActionState } from "../actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const initialState: AuthActionState = {}

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" className="w-full rounded-xl" disabled={pending}>
      {pending ? "Entrando..." : "Entrar"}
    </Button>
  )
}

export default function LoginPage() {
  const [state, formAction] = useActionState(loginAction, initialState)

  return (
    <main className="flex min-h-svh flex-1">
      <div className="bg-secondary hidden flex-1 items-center justify-center p-10 md:flex">
        {/* espaço reservado para foto da loja/produtos */}
        <div className="border-primary/30 text-primary/60 flex size-full max-w-md items-center justify-center rounded-3xl border-2 border-dashed text-sm">
          Foto da loja
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center p-6 sm:p-8">
        <div className="w-full max-w-sm">
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-semibold">Bem-vindo de volta</h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Acesse o painel da sua loja
            </p>
          </div>

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
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
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
          <p className="text-muted-foreground mt-4 text-center text-sm">
            Ainda não tem uma loja?{" "}
            <Link
              href="/cadastro"
              className="text-primary underline underline-offset-4"
            >
              Cadastre-se
            </Link>
          </p>
        </div>
      </div>
    </main>
  )
}
