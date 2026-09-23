"use client"

import { useActionState } from "react"
import Link from "next/link"
import { useFormStatus } from "react-dom"
import { signUpAction, type AuthActionState } from "../actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const initialState: AuthActionState = {}

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" className="w-full rounded-xl" disabled={pending}>
      {pending ? "Criando conta..." : "Criar conta"}
    </Button>
  )
}

export default function CadastroPage() {
  const [state, formAction] = useActionState(signUpAction, initialState)

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
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo.webp"
            alt="OhMyCookies"
            className="mx-auto mb-6 size-16 object-contain"
          />
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-semibold">Crie sua loja</h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Comece a vender seus cookies online
            </p>
          </div>

          {state.success ? (
            <p className="text-sm" role="status">
              {state.success}
            </p>
          ) : (
            <form action={formAction} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="storeName">Nome da loja</Label>
                <Input id="storeName" name="storeName" type="text" required />
              </div>
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
                  autoComplete="new-password"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar senha</Label>
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
          )}
          <p className="text-muted-foreground mt-4 text-center text-sm">
            Já tem uma conta?{" "}
            <Link
              href="/login"
              className="text-primary underline underline-offset-4"
            >
              Entrar
            </Link>
          </p>
        </div>
      </div>
    </main>
  )
}
