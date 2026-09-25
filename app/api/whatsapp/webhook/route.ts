import { after } from "next/server"
import { handleIncomingMessage } from "@/lib/whatsapp-bot"

type MessagesUpsertData = {
  key?: { remoteJid?: string; remoteJidAlt?: string; fromMe?: boolean }
  messageType?: string
}

/** Extracts the customer's phone from a WhatsApp JID, skipping groups,
 * status broadcasts, channels and unresolved @lid identities. */
function phoneFromKey(key: MessagesUpsertData["key"]) {
  const candidates = [key?.remoteJid, key?.remoteJidAlt]
  for (const jid of candidates) {
    if (jid?.endsWith("@s.whatsapp.net")) {
      return jid.split("@")[0].split(":")[0]
    }
  }
  return null
}

/** Called by the Evolution API server for every WhatsApp event on the
 * store's number. Authenticated with a shared secret header. */
export async function POST(request: Request) {
  const secret = process.env.WHATSAPP_WEBHOOK_SECRET
  if (!secret || request.headers.get("x-webhook-secret") !== secret) {
    return new Response("Unauthorized", { status: 401 })
  }

  const payload = (await request.json().catch(() => null)) as {
    event?: string
    instance?: string
    data?: MessagesUpsertData | MessagesUpsertData[]
  } | null

  if (payload?.event !== "messages.upsert" || !payload.instance) {
    return Response.json({ ok: true })
  }

  const messages = Array.isArray(payload.data) ? payload.data : [payload.data]
  const instance = payload.instance

  // Reply fast so Evolution doesn't retry; the greeting goes out afterwards.
  after(async () => {
    for (const message of messages) {
      // Reactions, protocol/system messages etc. aren't a customer talking.
      if (
        message?.messageType === "reactionMessage" ||
        message?.messageType === "protocolMessage"
      ) {
        continue
      }
      const phone = phoneFromKey(message?.key)
      if (!phone) continue
      try {
        await handleIncomingMessage({
          instance,
          phone,
          fromMe: Boolean(message?.key?.fromMe),
        })
      } catch (error) {
        console.error("[whatsapp webhook] failed", error)
      }
    }
  })

  return Response.json({ ok: true })
}
