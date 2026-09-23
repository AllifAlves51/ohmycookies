import type { SupabaseClient } from "@supabase/supabase-js"
import type { LoginInput, SignUpInput } from "@/lib/validations/auth"

export function signInWithPassword(
  supabase: SupabaseClient,
  input: LoginInput,
) {
  return supabase.auth.signInWithPassword({
    email: input.email,
    password: input.password,
  })
}

export function signUpWithPassword(
  supabase: SupabaseClient,
  input: SignUpInput,
) {
  return supabase.auth.signUp({
    email: input.email,
    password: input.password,
    options: {
      data: { store_name: input.storeName },
    },
  })
}

export function signOut(supabase: SupabaseClient) {
  return supabase.auth.signOut()
}

export function requestPasswordReset(
  supabase: SupabaseClient,
  email: string,
  redirectTo: string,
) {
  return supabase.auth.resetPasswordForEmail(email, { redirectTo })
}

export function updatePassword(supabase: SupabaseClient, password: string) {
  return supabase.auth.updateUser({ password })
}
