/** Thin client for a self-hosted Evolution API v2 server, which keeps the
 * store's WhatsApp logged in as a "linked device" and exposes it over REST.
 * Server-only: the API key must never reach the browser. */

export type ConnectionState =
  "open" | "connecting" | "close" | "not_found" | "unconfigured" | "error"

const WEBHOOK_EVENTS = ["MESSAGES_UPSERT", "CONNECTION_UPDATE"]

function config() {
  const url = process.env.EVOLUTION_API_URL?.replace(/\/$/, "")
  const apiKey = process.env.EVOLUTION_API_KEY
  return url && apiKey ? { url, apiKey } : null
}

export function isEvolutionConfigured() {
  return config() !== null
}

async function evolutionFetch(path: string, init?: RequestInit) {
  const cfg = config()
  if (!cfg) throw new Error("Evolution API not configured")

  return fetch(`${cfg.url}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      apikey: cfg.apiKey,
      ...init?.headers,
    },
    signal: AbortSignal.timeout(15000),
    cache: "no-store",
  })
}

/** Brazilian numbers are stored with DDD but not always the 55 prefix. */
export function toWhatsappNumber(phone: string) {
  const digits = phone.replace(/\D/g, "")
  return digits.length <= 11 ? `55${digits}` : digits
}

/** One canonical form per person, so a number typed at checkout
 * ("66992745783") and the one WhatsApp reports ("556692745783", older
 * Brazilian JIDs drop the mobile 9) land on the same contact row. */
export function contactKey(phone: string) {
  const number = toWhatsappNumber(phone)
  if (
    number.startsWith("55") &&
    number.length === 12 &&
    /[6-9]/.test(number[4])
  ) {
    return `${number.slice(0, 4)}9${number.slice(4)}`
  }
  return number
}

export async function getConnectionState(
  instance: string,
): Promise<ConnectionState> {
  if (!isEvolutionConfigured()) return "unconfigured"

  try {
    const res = await evolutionFetch(
      `/instance/connectionState/${encodeURIComponent(instance)}`,
    )
    if (res.status === 404) return "not_found"
    if (!res.ok) return "error"
    const body = (await res.json()) as { instance?: { state?: string } }
    const state = body.instance?.state
    if (state === "open" || state === "connecting" || state === "close") {
      return state
    }
    // Instance exists in the API but has no live session yet.
    return state ? "close" : "not_found"
  } catch (error) {
    console.error("[evolution] connectionState failed", error)
    return "error"
  }
}

function webhookConfig(webhookUrl: string, secret: string) {
  return {
    enabled: true,
    url: webhookUrl,
    byEvents: false,
    base64: false,
    headers: { "x-webhook-secret": secret },
    events: WEBHOOK_EVENTS,
  }
}

/** Creates the instance if needed, (re)points its webhook at this app and
 * returns a QR code to scan — or connected: true if already logged in. */
export async function startConnection({
  instance,
  webhookUrl,
  webhookSecret,
}: {
  instance: string
  webhookUrl: string
  webhookSecret: string
}): Promise<
  | { connected: true }
  | { connected: false; qrBase64: string | null; pairingCode: string | null }
  | { error: string }
> {
  try {
    const state = await getConnectionState(instance)

    if (state === "error") {
      return { error: "Não foi possível falar com o servidor do WhatsApp." }
    }

    if (state === "not_found") {
      const created = await evolutionFetch("/instance/create", {
        method: "POST",
        body: JSON.stringify({
          instanceName: instance,
          integration: "WHATSAPP-BAILEYS",
          qrcode: true,
          groupsIgnore: true,
          webhook: webhookConfig(webhookUrl, webhookSecret),
        }),
      })
      if (!created.ok) {
        console.error(
          "[evolution] create failed",
          created.status,
          await created.text(),
        )
        return { error: "Não foi possível criar a conexão no servidor." }
      }
    } else {
      // Keeps the webhook right even if the site URL or secret changed.
      await evolutionFetch(`/webhook/set/${encodeURIComponent(instance)}`, {
        method: "POST",
        body: JSON.stringify({
          webhook: webhookConfig(webhookUrl, webhookSecret),
        }),
      })
    }

    if (state === "open") return { connected: true }

    const res = await evolutionFetch(
      `/instance/connect/${encodeURIComponent(instance)}`,
    )
    if (!res.ok) {
      return { error: "Não foi possível gerar o QR code." }
    }
    const body = (await res.json()) as {
      base64?: string
      pairingCode?: string
      instance?: { state?: string }
    }
    if (body.instance?.state === "open") return { connected: true }

    return {
      connected: false,
      qrBase64: body.base64 ?? null,
      pairingCode: body.pairingCode ?? null,
    }
  } catch (error) {
    console.error("[evolution] startConnection failed", error)
    return { error: "Não foi possível falar com o servidor do WhatsApp." }
  }
}

export async function logout(instance: string) {
  try {
    const res = await evolutionFetch(
      `/instance/logout/${encodeURIComponent(instance)}`,
      { method: "DELETE" },
    )
    return res.ok
  } catch (error) {
    console.error("[evolution] logout failed", error)
    return false
  }
}

export async function sendText(instance: string, phone: string, text: string) {
  try {
    const res = await evolutionFetch(
      `/message/sendText/${encodeURIComponent(instance)}`,
      {
        method: "POST",
        body: JSON.stringify({ number: toWhatsappNumber(phone), text }),
      },
    )
    if (!res.ok) {
      console.error("[evolution] sendText failed", res.status, await res.text())
    }
    return res.ok
  } catch (error) {
    console.error("[evolution] sendText failed", error)
    return false
  }
}
