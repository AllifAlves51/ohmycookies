import { createBrowserClient } from "@supabase/ssr"

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      // Browsers throttle timers in background tabs, which delays the
      // realtime heartbeat until the server drops the socket — the admin
      // panel then silently stops receiving new orders. A Web Worker keeps
      // the heartbeat on time.
      realtime: { worker: true },
    },
  )
}
