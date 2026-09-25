"use client"

import { useEffect, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import {
  getOrderWithCustomer,
  type Order,
  type OrderWithCustomer,
} from "@/lib/services/order"

const POLL_MS = 20000
const RESUBSCRIBE_DELAY_MS = 3000

type Handlers = {
  onInsert?: (order: OrderWithCustomer) => void
  onUpdate?: (order: Order) => void
  onDelete?: (orderId: string) => void
  /** Realtime came back after a drop (or the tab became visible again):
   * updates may have been missed, so reload whatever state you hold. */
  onResync?: () => void
}

/** Live order events for the admin panel. Realtime alone isn't reliable
 * enough for a store's order screen (sleeping laptops, flaky Wi-Fi, expired
 * tokens), so this also:
 *  - resubscribes whenever the channel errors or closes, with a fresh token;
 *  - polls for new orders every 20s and on focus/online, so an order is
 *    never missed — each order id is delivered to onInsert at most once. */
export function useOrderFeed(storeId: string, handlers: Handlers) {
  const handlersRef = useRef(handlers)
  useEffect(() => {
    handlersRef.current = handlers
  })

  useEffect(() => {
    const supabase = createClient()
    const seen = new Set<string>()
    let since: string | null = null
    let baselineReady = false
    let disposed = false
    let channel: ReturnType<typeof supabase.channel> | null = null
    let resubscribeTimer: number | undefined
    let hadError = false

    function deliverInsert(order: OrderWithCustomer) {
      if (seen.has(order.id)) return
      seen.add(order.id)
      if (!since || order.created_at > since) since = order.created_at
      handlersRef.current.onInsert?.(order)
    }

    async function poll() {
      if (disposed) return
      if (!baselineReady) {
        // Remember what already exists so it doesn't count as "new".
        const { data } = await supabase
          .from("orders")
          .select("id, created_at")
          .eq("store_id", storeId)
          .order("created_at", { ascending: false })
          .limit(50)
        if (disposed || !data) return
        for (const row of data) seen.add(row.id)
        since = data[0]?.created_at ?? new Date().toISOString()
        baselineReady = true
        return
      }

      const { data } = await supabase
        .from("orders")
        .select("*, customer:customers(name, whatsapp)")
        .eq("store_id", storeId)
        .gte("created_at", since!)
        .order("created_at", { ascending: true })
        .returns<OrderWithCustomer[]>()
      if (disposed || !data) return
      for (const order of data) deliverInsert(order)
    }

    async function subscribe() {
      if (disposed) return
      // Make sure the socket uses the current (possibly refreshed) token.
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (session) await supabase.realtime.setAuth(session.access_token)
      if (disposed) return

      const current = supabase.channel(`orders-feed-${storeId}-${Date.now()}`)
      channel = current
      current
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "orders",
            filter: `store_id=eq.${storeId}`,
          },
          (payload) => {
            const inserted = payload.new as Order
            if (seen.has(inserted.id)) return
            getOrderWithCustomer(supabase, inserted.id).then(({ data }) => {
              deliverInsert(data ?? { ...inserted, customer: null })
            })
          },
        )
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "orders",
            filter: `store_id=eq.${storeId}`,
          },
          (payload) => handlersRef.current.onUpdate?.(payload.new as Order),
        )
        // DELETE events can't be filtered by column (the old row only has
        // the primary key); ids from other stores just won't match.
        .on(
          "postgres_changes",
          { event: "DELETE", schema: "public", table: "orders" },
          (payload) => {
            const id = (payload.old as { id?: string }).id
            if (id) handlersRef.current.onDelete?.(id)
          },
        )
        .subscribe((status) => {
          // Ignore the CLOSED fired by removing a channel we replaced.
          if (disposed || channel !== current) return
          if (status === "SUBSCRIBED") {
            if (hadError) {
              hadError = false
              handlersRef.current.onResync?.()
              void poll()
            }
            return
          }
          if (
            status === "CHANNEL_ERROR" ||
            status === "TIMED_OUT" ||
            status === "CLOSED"
          ) {
            hadError = true
            scheduleResubscribe()
          }
        })
    }

    function scheduleResubscribe() {
      window.clearTimeout(resubscribeTimer)
      resubscribeTimer = window.setTimeout(async () => {
        if (channel) {
          const old = channel
          channel = null
          await supabase.removeChannel(old)
        }
        void subscribe()
      }, RESUBSCRIBE_DELAY_MS)
    }

    function onWake() {
      if (document.visibilityState !== "visible") return
      handlersRef.current.onResync?.()
      void poll()
    }

    void poll()
    void subscribe()
    const pollTimer = window.setInterval(() => void poll(), POLL_MS)
    document.addEventListener("visibilitychange", onWake)
    window.addEventListener("online", onWake)

    return () => {
      disposed = true
      window.clearInterval(pollTimer)
      window.clearTimeout(resubscribeTimer)
      document.removeEventListener("visibilitychange", onWake)
      window.removeEventListener("online", onWake)
      if (channel) void supabase.removeChannel(channel)
    }
  }, [storeId])
}
