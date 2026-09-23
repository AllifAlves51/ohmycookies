"use client"

import { useActionState } from "react"
import Link from "next/link"
import { useFormStatus } from "react-dom"
import { Mail, Lock } from "lucide-react"
import { loginAction, type AuthActionState } from "../actions"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"

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
      {pending ? "Entrando..." : "Entrar"}
    </Button>
  )
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 48 48" className="size-4">
      <path
        fill="#FFC107"
        d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 8 3l6-6C34.5 5.1 29.6 3 24 3 12.4 3 3 12.4 3 24s9.4 21 21 21 21-9.4 21-21c0-1.2-.1-2.4-.4-3.5z"
      />
      <path
        fill="#FF3D00"
        d="M6.3 14.7l6.6 4.8C14.6 15.9 18.9 13 24 13c3.1 0 5.8 1.1 8 3l6-6C34.5 6.1 29.6 4 24 4 16.3 4 9.6 8.3 6.3 14.7z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.5 0 10.4-2.1 14.1-5.6l-6.5-5.5C29.6 34.9 27 36 24 36c-5.3 0-9.7-3.3-11.3-8l-6.6 5.1C9.5 39.6 16.2 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.2 4.2-4 5.6l6.5 5.5C41.4 36.6 44 30.9 44 24c0-1.2-.1-2.4-.4-3.5z"
      />
    </svg>
  )
}

export function LoginClient({
  loginPhotoUrl,
}: {
  loginPhotoUrl: string | null
}) {
  const [state, formAction] = useActionState(loginAction, initialState)

  function handleGoogleLogin() {
    const supabase = createClient()
    supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/confirm?next=/dashboard` },
    })
  }

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
            <h1 className="text-2xl font-semibold">Bem-vindo de volta!</h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Acesse seu painel e gerencie sua cookieseria.
            </p>
          </div>

          <form action={formAction} className="space-y-4">
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
                  autoComplete="current-password"
                  placeholder="Sua senha"
                  className="rounded-xl pl-9"
                  required
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2">
                <Checkbox name="rememberMe" defaultChecked />
                <span className="text-muted-foreground">Lembrar de mim</span>
              </label>
              <Link
                href="/esqueci-senha"
                className="text-primary font-medium underline-offset-4 hover:underline"
              >
                Esqueceu a senha?
              </Link>
            </div>

            {state.error ? (
              <p className="text-destructive text-sm" role="alert">
                {state.error}
              </p>
            ) : null}
            <SubmitButton />
          </form>

          <div className="my-4 flex items-center gap-3">
            <div className="bg-border h-px flex-1" />
            <span className="text-muted-foreground text-xs">ou</span>
            <div className="bg-border h-px flex-1" />
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full rounded-full"
            size="lg"
            onClick={handleGoogleLogin}
          >
            <GoogleIcon />
            Entrar com Google
          </Button>

          <p className="text-muted-foreground mt-6 text-center text-sm">
            Não tem uma conta?{" "}
            <Link href="/cadastro" className="text-primary font-medium">
              Criar conta
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
