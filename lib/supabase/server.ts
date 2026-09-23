import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

/** Server-side Supabase client bound to the current request's cookies (Server Components, Server Actions, Route Handlers). */
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options)
            }
          } catch {
            // setAll called from a Server Component: safe to ignore when
            // middleware is refreshing the session.
          }
        },
      },
    },
  )
}
