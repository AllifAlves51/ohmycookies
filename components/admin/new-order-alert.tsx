"use client"

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react"
import { useRouter } from "next/navigation"
import { BellRing, MonitorDown } from "lucide-react"
import { toast } from "sonner"
import { useOrderFeed } from "@/components/admin/use-order-feed"

/** Keeps ringing until someone acknowledges it (click/key on the panel or
 * "Ver pedidos"), like a delivery-app tablet — capped so a forgotten tab
 * doesn't ring forever. */
const RING_EVERY_MS = 3500
const MAX_RING_MS = 3 * 60 * 1000

/** Optional custom ringtone: drop an audio file here and it's used instead
 * of the synthesized bell. */
const CUSTOM_SOUND_URL = "/sounds/novo-pedido.mp3"

/** Old mechanical telephone ring ("trrrim… trrrim…"), synthesized with the
 * Web Audio API so there's no file to host or license. A hammer strikes two
 * slightly detuned bells alternately ~20×/s; each bell is a set of
 * inharmonic partials that decay quickly between strikes. */
function playPhoneRing(context: AudioContext) {
  const now = context.currentTime
  const compressor = context.createDynamicsCompressor()
  compressor.threshold.value = -12
  compressor.ratio.value = 6
  const master = context.createGain()
  master.gain.value = 0.8
  compressor.connect(master)
  master.connect(context.destination)

  const STRIKE_INTERVAL = 0.05
  const bursts: [number, number][] = [
    [0, 0.9],
    [1.15, 2.05],
  ]
  const end = now + bursts[bursts.length - 1][1] + 0.2

  for (const [bellIndex, fundamental] of [1760, 1865].entries()) {
    const envelope = context.createGain()
    envelope.gain.setValueAtTime(0.0001, now)
    envelope.connect(compressor)

    for (const [ratio, level] of [
      [1, 0.6],
      [2.0, 0.3],
      [2.76, 0.25],
      [5.4, 0.12],
    ]) {
      const oscillator = context.createOscillator()
      const partialGain = context.createGain()
      oscillator.type = "sine"
      oscillator.frequency.value = fundamental * ratio
      partialGain.gain.value = level
      oscillator.connect(partialGain)
      partialGain.connect(envelope)
      oscillator.start(now)
      oscillator.stop(end)
    }

    // This bell is hit on every other strike.
    for (const [from, to] of bursts) {
      for (
        let t = from + bellIndex * STRIKE_INTERVAL;
        t < to;
        t += STRIKE_INTERVAL * 2
      ) {
        envelope.gain.setValueAtTime(1, now + t)
        envelope.gain.exponentialRampToValueAtTime(
          0.05,
          now + t + STRIKE_INTERVAL * 1.9,
        )
      }
      envelope.gain.exponentialRampToValueAtTime(0.0001, now + to + 0.15)
    }
  }
}

/** Plays the custom ringtone normalized to near full scale — sound-effect
 * downloads are often mastered quietly, and a quiet alarm gets missed. */
function playBuffer(context: AudioContext, buffer: AudioBuffer) {
  let peak = 0
  for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
    for (const sample of buffer.getChannelData(channel)) {
      const level = Math.abs(sample)
      if (level > peak) peak = level
    }
  }

  const source = context.createBufferSource()
  source.buffer = buffer
  const gain = context.createGain()
  gain.gain.value = peak > 0 ? Math.min(0.95 / peak, 8) : 1
  source.connect(gain)
  gain.connect(context.destination)
  source.start()
}

const noopSubscribe = () => () => {}

/** Not in TypeScript's DOM lib yet (Chromium-only API). */
type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
}

export function NewOrderAlert({ storeId }: { storeId: string }) {
  const router = useRouter()
  const audioContextRef = useRef<AudioContext | null>(null)
  const customSoundRef = useRef<AudioBuffer | null>(null)
  const ringingRef = useRef<{ interval: number; timeout: number } | null>(null)
  const titleRef = useRef<{ interval: number; original: string } | null>(null)
  const [soundReady, setSoundReady] = useState(false)
  const [installPrompt, setInstallPrompt] =
    useState<BeforeInstallPromptEvent | null>(null)
  // Server render can't know; the client value is read after hydration
  // without a mismatch.
  const isStandalone = useSyncExternalStore(
    noopSubscribe,
    () => window.matchMedia("(display-mode: standalone)").matches,
    () => false,
  )

  // Chrome/Edge offer installation through this event; keep it so the
  // pill can show an "Instalar painel" button.
  useEffect(() => {
    function onPrompt(event: Event) {
      event.preventDefault()
      setInstallPrompt(event as BeforeInstallPromptEvent)
    }
    function onInstalled() {
      setInstallPrompt(null)
    }
    window.addEventListener("beforeinstallprompt", onPrompt)
    window.addEventListener("appinstalled", onInstalled)
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt)
      window.removeEventListener("appinstalled", onInstalled)
    }
  }, [])

  function handleInstall() {
    installPrompt?.prompt()
    installPrompt?.userChoice.finally(() => setInstallPrompt(null))
  }

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
      const created = new AudioContext()
      audioContextRef.current = created
      // Use the custom ringtone if one was uploaded; otherwise keep the
      // synthesized bell (a 404 here is expected and harmless).
      fetch(CUSTOM_SOUND_URL)
        .then((res) => (res.ok ? res.arrayBuffer() : null))
        .then((data) => (data ? created.decodeAudioData(data) : null))
        .then((buffer) => {
          customSoundRef.current = buffer
        })
        .catch(() => {})
    }
    const context = audioContextRef.current
    const markReady = () => setSoundReady(context.state === "running")
    context.onstatechange = markReady
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
      const custom = customSoundRef.current
      const ring = () => {
        if (context?.state !== "running") return
        if (custom) playBuffer(context, custom)
        else playPhoneRing(context)
      }
      // A long custom ringtone must finish before the next ring starts.
      const every = custom
        ? Math.max(RING_EVERY_MS, custom.duration * 1000 + 800)
        : RING_EVERY_MS

      if (!ringingRef.current) {
        ring()
        ringingRef.current = {
          interval: window.setInterval(ring, every),
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

  useOrderFeed(storeId, {
    onInsert: (order) => {
      startRinging(order.order_number)

      toast.success(`Novo pedido #${order.order_number}`, {
        description: order.customer?.name
          ? `${order.customer.name} acabou de fazer um pedido.`
          : "Um cliente acabou de fazer um pedido.",
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

      if ("Notification" in window && Notification.permission === "granted") {
        const notification = new Notification(
          `🔔 Novo pedido #${order.order_number}`,
          {
            body: order.customer?.name
              ? `${order.customer.name} acabou de fazer um pedido.`
              : "Um cliente acabou de fazer um pedido.",
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
  })

  if (soundReady) return null

  return (
    <div className="fixed right-4 bottom-4 z-50 w-72 space-y-2 rounded-xl border bg-amber-50 p-3 text-sm shadow-lg dark:bg-amber-950">
      <button
        type="button"
        onClick={unlockAudio}
        className="flex w-full animate-pulse items-center justify-center gap-2 rounded-lg bg-amber-500 px-3 py-2 font-semibold text-white hover:bg-amber-600"
      >
        <BellRing className="size-4" />
        Ativar som dos pedidos
      </button>
      {installPrompt ? (
        <>
          <p className="text-muted-foreground text-xs">
            O navegador só libera som depois de um clique. Instalando o painel
            como aplicativo, o som já fica ligado sempre que ele abrir.
          </p>
          <button
            type="button"
            onClick={handleInstall}
            className="flex w-full items-center justify-center gap-2 rounded-lg border bg-white px-3 py-2 text-xs font-medium hover:bg-gray-50 dark:bg-transparent"
          >
            <MonitorDown className="size-4" />
            Instalar painel no computador
          </button>
        </>
      ) : !isStandalone ? (
        <p className="text-muted-foreground text-xs">
          Dica: instale o painel como aplicativo (ícone de instalar na barra de
          endereço do Chrome/Edge) para o som ligar sozinho.
        </p>
      ) : null}
    </div>
  )
}
