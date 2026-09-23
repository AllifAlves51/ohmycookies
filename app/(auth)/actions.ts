"use server"

import { redirect } from "next/navigation"
import { headers } from "next/headers"
import { createClient } from "@/lib/supabase/server"
import {
  loginSchema,
  signUpSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "@/lib/validations/auth"
import {
  signInWithPassword,
  signUpWithPassword,
  signOut as signOutService,
  requestPasswordReset,
  updatePassword,
} from "@/lib/services/auth"

async function getOrigin() {
  const h = await headers()
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000"
  const isLocal = host.startsWith("localhost") || host.startsWith("127.")
  const protocol = isLocal ? "http" : (h.get("x-forwarded-proto") ?? "https")
  return `${protocol}://${host}`
}

export type AuthActionState = {
  error?: string
  success?: string
}

const KNOWN_AUTH_ERRORS: Record<string, string> = {
  "Invalid login credentials": "E-mail ou senha incorretos",
  "User already registered": "Este e-mail já está cadastrado",
  "Email not confirmed": "Confirme seu e-mail antes de entrar",
}

function translateAuthError(message: string): string {
  return (
    KNOWN_AUTH_ERRORS[message] ?? "Não foi possível concluir. Tente novamente."
  )
}

export async function loginAction(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" }
  }

  const supabase = await createClient()
  const { error } = await signInWithPassword(supabase, parsed.data)

  if (error) {
    return { error: translateAuthError(error.message) }
  }

  redirect("/dashboard")
}

export async function signUpAction(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = signUpSchema.safeParse({
    storeName: formData.get("storeName"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" }
  }

  const supabase = await createClient()
  const { data, error } = await signUpWithPassword(supabase, parsed.data)

  if (error) {
    return { error: translateAuthError(error.message) }
  }

  if (!data.session) {
    return {
      success:
        "Cadastro realizado! Verifique seu e-mail para confirmar a conta antes de entrar.",
    }
  }

  redirect("/dashboard")
}

export async function logoutAction() {
  const supabase = await createClient()
  await signOutService(supabase)
  redirect("/login")
}

export async function forgotPasswordAction(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = forgotPasswordSchema.safeParse({
    email: formData.get("email"),
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" }
  }

  const origin = await getOrigin()
  const supabase = await createClient()
  await requestPasswordReset(
    supabase,
    parsed.data.email,
    `${origin}/auth/confirm?next=/redefinir-senha`,
  )

  // Same message regardless of whether the e-mail exists — otherwise this
  // form becomes a way to check which e-mails have an account.
  return {
    success:
      "Se esse e-mail estiver cadastrado, enviamos um link para redefinir a senha.",
  }
}

export async function resetPasswordAction(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = resetPasswordSchema.safeParse({
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" }
  }

  const supabase = await createClient()
  const { error } = await updatePassword(supabase, parsed.data.password)

  if (error) {
    return {
      error:
        "Não foi possível redefinir a senha. Solicite um novo link e tente novamente.",
    }
  }

  redirect("/dashboard")
}
