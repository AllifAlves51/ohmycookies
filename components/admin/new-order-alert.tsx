"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { BellRing } from "lucide-react"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"
import type { Order } from "@/lib/services/order"

/** Keeps ringing until someone acknowledges it (click/key on the panel or
 * "Ver pedidos"), like a delivery-app tablet — capped so a forgotten tab
 * doesn't ring forever. */
const RING_EVERY_MS = 3000
const MAX_RING_MS = 3 * 60 * 1000

/** One loud "ding-dong-ding" burst via the Web Audio API (no file to host).
 * A compressor lets the tones run near full scale without clipping. */
function playAlarm(context: AudioContext) {
  const now = context.currentTime
  const compressor = context.createDynamicsCompressor()
  compressor.threshold.value = -10
  compressor.ratio.value = 4
  const master = context.createGain()
  master.gain.value = 0.9
  compressor.connect(master)
  master.connect(context.destination)

  const tone = (frequency: number, start: number, length: number) => {
    // Square + a sawtooth an octave up: harsh on purpose, cuts through
    // kitchen noise and laptop speakers much better than a pure beep.
    for (const [type, mult, level] of [
      ["square", 1, 0.9],
      ["sawtooth", 2, 0.35],
    ] as const) {
      const oscillator = context.createOscillator()
      const gain = context.createGain()
      oscillator.type = type
      oscillator.frequency.value = frequency * mult
      gain.gain.setValueAtTime(0, start)
      gain.gain.linearRampToValueAtTime(level, start + 0.01)
      gain.gain.setValueAtTime(level, start + length * 0.6)
      gain.gain.exponentialRampToValueAtTime(0.001, start + length)
      oscillator.connect(gain)
      gain.connect(compressor)
      oscillator.start(start)
      oscillator.stop(start + length)
    }
  }

  tone(1319, now, 0.22)
  tone(988, now + 0.25, 0.22)
  tone(1319, now + 0.5, 0.22)
  tone(988, now + 0.75, 0.22)
  tone(1568, now + 1.0, 0.4)
}

export function NewOrderAlert({ storeId }: { storeId: string }) {
  const router = useRouter()
  const audioContextRef = useRef<AudioContext | null>(null)
  const ringingRef = useRef<{ interval: number; timeout: number } | null>(null)
  const titleRef = useRef<{ interval: number; original: string } | null>(null)
  const [soundReady, setSoundReady] = useState(false)

  const stopRinging = useCallback(() => {
    if (ringingRef.current) {
      clearInterval(ringingRef.current.interval)
      clearTimeout(ringingRef.current.timeout)
      ringingRef.current = null
    }
    if (titleRef.current) {
      clearInterval(titleRef.current.interval)
      document.title = titleRef.current.original
      titleRef.current = null
    }
  }, [])

  const unlockAudio = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext()
    }
    const context = audioContextRef.current
    const markReady = () => setSoundReady(context.state === "running")
    if (context.state === "suspended") {
      context.resume().then(markReady, markReady)
    } else {
      markReady()
    }
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission()
    }
  }, [])

  useEffect(() => {
    // Browsers that already trust this site let audio start without a
    // click; try right away so the warning pill only shows when needed.
    unlockAudio()

    function onInteract() {
      unlockAudio()
      stopRinging()
    }
    function onVisible() {
      if (document.visibilityState === "visible") {
        audioContextRef.current?.resume().catch(() => {})
      }
    }
    window.addEventListener("pointerdown", onInteract)
    window.addEventListener("keydown", onInteract)
    document.addEventListener("visibilitychange", onVisible)
    return () => {
      window.removeEventListener("pointerdown", onInteract)
      window.removeEventListener("keydown", onInteract)
      document.removeEventListener("visibilitychange", onVisible)
      stopRinging()
    }
  }, [unlockAudio, stopRinging])

  const startRinging = useCallback(
    (orderNumber: number) => {
      const context = audioContextRef.current
      const ring = () => {
        if (context?.state === "running") playAlarm(context)
      }

      if (!ringingRef.current) {
        ring()
        ringingRef.current = {
          interval: window.setInterval(ring, RING_EVERY_MS),
          timeout: window.setTimeout(stopRinging, MAX_RING_MS),
        }
      }

      // Blinking tab title, visible even when the panel is in the background.
      if (!titleRef.current) {
        const original = document.title
        let on = false
        titleRef.current = {
          original,
          interval: window.setInterval(() => {
            on = !on
            document.title = on ? `🔔 NOVO PEDIDO #${orderNumber}` : original
          }, 1000),
        }
      }
    },
    [stopRinging],
  )

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
          startRinging(order.order_number)

          toast.success(`Novo pedido #${order.order_number}`, {
            description: "Um cliente acabou de fazer um pedido.",
            duration: Infinity,
            closeButton: true,
            action: {
              label: "Ver pedidos",
              onClick: () => {
                stopRinging()
                router.push("/pedidos")
              },
            },
          })

          if (
            "Notification" in window &&
            Notification.permission === "granted"
          ) {
            const notification = new Notification(
              `🔔 Novo pedido #${order.order_number}`,
              {
                body: "Um cliente acabou de fazer um pedido.",
                icon: "/icon-192.png",
                tag: `order-${order.id}`,
                // Stays on screen until clicked instead of fading out.
                requireInteraction: true,
              },
            )
            notification.onclick = () => {
              stopRinging()
              window.focus()
              router.push("/pedidos")
              notification.close()
            }
          }

          router.refresh()
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [storeId, router, startRinging, stopRinging])

  if (soundReady) return null

  return (
    <button
      type="button"
      onClick={unlockAudio}
      className="fixed right-4 bottom-4 z-50 flex animate-pulse items-center gap-2 rounded-full bg-amber-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg hover:bg-amber-600"
    >
      <BellRing className="size-4" />
      Clique para ativar o som dos pedidos
    </button>
  )
}
