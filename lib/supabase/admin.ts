import { createClient } from "@supabase/supabase-js"

/** Service-role client that bypasses RLS. Server-only: used where there's
 * no signed-in owner (WhatsApp webhook, public checkout notifications).
 * Returns null when SUPABASE_SERVICE_ROLE_KEY isn't configured. */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceKey) {
    return null
  }

  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
