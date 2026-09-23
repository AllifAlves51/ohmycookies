"use client"

import { useActionState } from "react"
import Link from "next/link"
import { Caveat } from "next/font/google"
import { useFormStatus } from "react-dom"
import { Store, Mail, Lock, Heart } from "lucide-react"
import { signUpAction, type AuthActionState } from "../actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const caveat = Caveat({ subsets: ["latin"], weight: ["600", "700"] })

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
        <div className="absolute inset-0 bg-gradient-to-t from-black/15 via-transparent to-transparent" />
        <div className="absolute top-16 left-14">
          <svg width="40" height="40" viewBox="0 0 40 40" className="text-primary/70">
            <path d="M4 4l6 6M4 14l6-6M14 4l-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" />
          </svg>
        </div>
        <div className="relative max-w-xs text-center">
          <p
            className={`${caveat.className} text-primary text-4xl leading-tight drop-shadow-[0_1px_6px_rgba(255,255,255,0.6)]`}
          >
            Sua cookieseria começa aqui.
          </p>
          <Heart className="fill-primary text-primary mx-auto mt-3 size-6 drop-shadow-[0_1px_4px_rgba(255,255,255,0.6)]" />
        </div>
      </div>
    </main>
  )
}
