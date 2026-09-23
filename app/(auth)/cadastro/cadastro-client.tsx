"use client"

import { useActionState } from "react"
import Link from "next/link"
import { useFormStatus } from "react-dom"
import { Store, Mail, Lock } from "lucide-react"
import { signUpAction, type AuthActionState } from "../actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const initialState: AuthActionState = {}

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button
      type="submit"
      className="w-full rounded-full"
      size="lg"
      disabled={pending}
    >
      {pending ? "Criando conta..." : "Criar conta"}
    </Button>
  )
}

export function CadastroClient({
  loginPhotoUrl,
}: {
  loginPhotoUrl: string | null
}) {
  const [state, formAction] = useActionState(signUpAction, initialState)

  return (
    <main className="flex min-h-svh flex-1">
      <div className="flex flex-1 items-center justify-center bg-white p-6 sm:p-8">
        <div className="w-full max-w-sm">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo.webp"
            alt="OhMyCookies"
            className="mx-auto mb-6 size-28 object-contain"
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
                <Label htmlFor="storeName" className="sr-only">
                  Nome da loja
                </Label>
                <div className="relative">
                  <Store className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                  <Input
                    id="storeName"
                    name="storeName"
                    type="text"
                    placeholder="Nome da loja"
                    className="rounded-xl pl-9"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="sr-only">
                  E-mail
                </Label>
                <div className="relative">
                  <Mail className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    placeholder="Seu e-mail"
                    className="rounded-xl pl-9"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="sr-only">
                  Senha
                </Label>
                <div className="relative">
                  <Lock className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    placeholder="Senha"
                    className="rounded-xl pl-9"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="sr-only">
                  Confirmar senha
                </Label>
                <div className="relative">
                  <Lock className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    placeholder="Confirmar senha"
                    className="rounded-xl pl-9"
                    required
                  />
                </div>
              </div>
              {state.error ? (
                <p className="text-destructive text-sm" role="alert">
                  {state.error}
                </p>
              ) : null}
              <SubmitButton />
            </form>
          )}
          <p className="text-muted-foreground mt-6 text-center text-sm">
            Já tem uma conta?{" "}
            <Link href="/login" className="text-primary font-medium">
              Entrar
            </Link>
          </p>
        </div>
      </div>

      <div className="bg-secondary relative hidden flex-1 items-center justify-center overflow-hidden p-10 md:flex">
        {loginPhotoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={loginPhotoUrl}
            alt=""
            className="absolute inset-0 size-full object-cover"
          />
        ) : null}
      </div>
    </main>
  )
}
