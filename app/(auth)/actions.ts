"use server"

import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { loginSchema, signUpSchema } from "@/lib/validations/auth"
import {
  signInWithPassword,
  signUpWithPassword,
  signOut as signOutService,
} from "@/lib/services/auth"

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
