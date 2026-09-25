"use client"

import { useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"
import type { Order } from "@/lib/services/order"

/** Plays a loud, attention-grabbing triple alarm via the Web Audio API —
 * no audio file to host, and it can be generated even if the browser
 * blocked autoplay, since we lazily create/resume the AudioContext on the
 * admin's first click/keypress instead of at mount. */
function playAlarm(context: AudioContext) {
  const now = context.currentTime
  const ring = (start: number) => {
    ;[988, 1319].forEach((frequency, index) => {
      const oscillator = context.createOscillator()
      const gain = context.createGain()
      oscillator.type = "square"
      oscillator.frequency.value = frequency
      const t = start + index * 0.11
      gain.gain.setValueAtTime(0, t)
      gain.gain.linearRampToValueAtTime(0.5, t + 0.015)
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25)
      oscillator.connect(gain)
      gain.connect(context.destination)
      oscillator.start(t)
      oscillator.stop(t + 0.25)
    })
  }

  ring(now)
  ring(now + 0.35)
  ring(now + 0.7)
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
      if (
        "Notification" in window &&
        Notification.permission === "default"
      ) {
        Notification.requestPermission()
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
            playAlarm(audioContextRef.current)
          }
          toast.success(`Novo pedido #${order.order_number}`, {
            description: "Um cliente acabou de fazer um pedido.",
          })

          if ("Notification" in window && Notification.permission === "granted") {
            const notification = new Notification(
              `Novo pedido #${order.order_number}`,
              {
                body: "Um cliente acabou de fazer um pedido.",
                icon: "/logo.webp",
                tag: `order-${order.id}`,
              },
            )
            notification.onclick = () => {
              window.focus()
              router.push("/pedidos")
            }
          }

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
