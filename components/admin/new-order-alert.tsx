"use client"

import { useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"
import type { Order } from "@/lib/services/order"

/** Plays a short two-tone chime via the Web Audio API — no audio file to
 * host, and it can be generated even if the browser blocked autoplay,
 * since we lazily create/resume the AudioContext on the admin's first
 * click/keypress instead of at mount. */
function playChime(context: AudioContext) {
  const now = context.currentTime
  ;[880, 1320].forEach((frequency, index) => {
    const oscillator = context.createOscillator()
    const gain = context.createGain()
    oscillator.type = "sine"
    oscillator.frequency.value = frequency
    const start = now + index * 0.12
    gain.gain.setValueAtTime(0, start)
    gain.gain.linearRampToValueAtTime(0.2, start + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.001, start + 0.35)
    oscillator.connect(gain)
    gain.connect(context.destination)
    oscillator.start(start)
    oscillator.stop(start + 0.35)
  })
}

export function NewOrderAlert({ storeId }: { storeId: string }) {
  const router = useRouter()
  const audioContextRef = useRef<AudioContext | null>(null)

  useEffect(() => {
    function unlock() {
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext()
      } else if (audioContextRef.current.state === "suspended") {
        audioContextRef.current.resume()
      }
    }
    window.addEventListener("pointerdown", unlock)
    window.addEventListener("keydown", unlock)
    return () => {
      window.removeEventListener("pointerdown", unlock)
      window.removeEventListener("keydown", unlock)
    }
  }, [])

  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel(`new-order-alert-${storeId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "orders",
          filter: `store_id=eq.${storeId}`,
        },
        (payload) => {
          const order = payload.new as Order
          if (audioContextRef.current) {
            playChime(audioContextRef.current)
          }
          toast.success(`Novo pedido #${order.order_number}`, {
            description: "Um cliente acabou de fazer um pedido.",
          })
          router.refresh()
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [storeId, router])

  return null
}
