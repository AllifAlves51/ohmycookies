import type { SupabaseClient } from "@supabase/supabase-js"
import { createAdminClient } from "@/lib/supabase/admin"
import {
  contactKey,
  getConnectionState,
  sendText,
} from "@/lib/services/evolution"
import {
  PAYMENT_PREFERENCE_LABEL,
  type OrderStatus,
  type OrderWithCustomer,
} from "@/lib/services/order"
import type { Store, StoreSettings } from "@/lib/services/store"
import { getSiteUrl } from "@/lib/site"
import { formatAddress } from "@/lib/utils/address"
import { formatBRL } from "@/lib/utils/money"
import { isStoreOpenNow } from "@/lib/utils/opening-hours"
import {
  buildStatusMessage,
  renderTemplate,
  resolveTemplates,
} from "@/lib/whatsapp-templates"

/** How a status change reached the customer, reported back to the panel so
 * it can fall back to the manual "send on WhatsApp" button. */
export type NotifyResult = "sent" | "skipped" | "unavailable"

const STAGE_ORDER: OrderStatus[] = [
  "new",
  "confirmed",
  "preparing",
  "out_for_delivery",
  "completed",
]

/** Moving a card back one column is usually fixing a misclick — don't
 * message the customer about it. Forward moves, cancel and reopen do. */
function shouldAutoNotify(previous: OrderStatus, next: OrderStatus) {
  if (previous === next) return false
  if (next === "cancelled" || previous === "cancelled") return true
  return STAGE_ORDER.indexOf(next) > STAGE_ORDER.indexOf(previous)
}

async function loadStoreContext(admin: SupabaseClient, storeId: string) {
  const [{ data: store }, { data: settings }] = await Promise.all([
    admin.from("stores").select("*").eq("id", storeId).single<Store>(),
    admin
      .from("store_settings")
      .select("*")
      .eq("store_id", storeId)
      .single<StoreSettings & BotSettings>(),
  ])
  return store && settings ? { store, settings } : null
}

type BotSettings = {
  whatsapp_instance: string | null
  whatsapp_greeting_interval_minutes: number
  whatsapp_alert_number: string | null
  whatsapp_alerts_enabled: boolean
}

async function recordOutbound(
  admin: SupabaseClient,
  storeId: string,
  phone: string,
  extra: Record<string, string> = {},
) {
  await admin.from("whatsapp_contacts").upsert({
    store_id: storeId,
    phone,
    last_outbound_at: new Date().toISOString(),
    ...extra,
  })
}

/** Sends the customer the message for their order's new status, if the
 * bot is connected and that message is switched on. */
export async function notifyStatusChange(
  orderId: string,
  previous: OrderStatus,
  next: OrderStatus,
): Promise<NotifyResult> {
  if (!shouldAutoNotify(previous, next)) return "skipped"

  const admin = createAdminClient()
  if (!admin) return "unavailable"

  const { data: order } = await admin
    .from("orders")
    .select("*, customer:customers(name, whatsapp)")
    .eq("id", orderId)
    .single<OrderWithCustomer>()
  if (!order?.customer?.whatsapp) return "unavailable"

  const ctx = await loadStoreContext(admin, order.store_id)
  if (!ctx?.settings.whatsapp_instance) return "unavailable"

  const message = buildStatusMessage({
    templates: resolveTemplates(ctx.settings.whatsapp_templates),
    status: next,
    fulfillmentType: order.fulfillment_type,
    customerName: order.customer.name,
    orderNumber: order.order_number,
    trackingUrl: `${getSiteUrl()}/cardapio/${ctx.store.slug}/pedido/${order.id}`,
    menuUrl: `${getSiteUrl()}/cardapio/${ctx.store.slug}`,
    storeName: ctx.store.name,
  })
  // Owner switched this message off: nothing to send, manual or automatic.
  if (!message) return "skipped"

  if ((await getConnectionState(ctx.settings.whatsapp_instance)) !== "open") {
    return "unavailable"
  }

  const ok = await sendText(
    ctx.settings.whatsapp_instance,
    order.customer.whatsapp,
    message,
  )
  if (!ok) return "unavailable"

  await recordOutbound(
    admin,
    order.store_id,
    contactKey(order.customer.whatsapp),
  )
  return "sent"
}

/** Right after checkout: confirms the order to the customer and alerts the
 * owner. Best-effort — runs after the response and never throws. */
export async function notifyNewOrder(orderId: string) {
  try {
    const admin = createAdminClient()
    if (!admin) return

    const { data: order } = await admin
      .from("orders")
      .select("*, customer:customers(name, whatsapp)")
      .eq("id", orderId)
      .single<OrderWithCustomer>()
    if (!order) return

    const ctx = await loadStoreContext(admin, order.store_id)
    const instance = ctx?.settings.whatsapp_instance
    if (!ctx || !instance) return
    if ((await getConnectionState(instance)) !== "open") return

    const siteUrl = getSiteUrl()
    const trackingUrl = `${siteUrl}/cardapio/${ctx.store.slug}/pedido/${order.id}`

    if (order.customer?.whatsapp) {
      const message = buildStatusMessage({
        templates: resolveTemplates(ctx.settings.whatsapp_templates),
        status: "new",
        fulfillmentType: order.fulfillment_type,
        customerName: order.customer.name,
        orderNumber: order.order_number,
        trackingUrl,
        menuUrl: `${siteUrl}/cardapio/${ctx.store.slug}`,
        storeName: ctx.store.name,
      })
      if (message) {
        if (await sendText(instance, order.customer.whatsapp, message)) {
          await recordOutbound(
            admin,
            order.store_id,
            contactKey(order.customer.whatsapp),
          )
        }
      }
    }

    const alertNumber =
      ctx.settings.whatsapp_alert_number || ctx.store.whatsapp_number
    if (ctx.settings.whatsapp_alerts_enabled && alertNumber) {
      const { data: items } = await admin
        .from("order_items")
        .select("product_name, quantity, subtotal_cents, notes")
        .eq("order_id", order.id)

      await sendText(
        instance,
        alertNumber,
        buildOwnerAlert(order, items ?? [], `${siteUrl}/pedidos`),
      )
    }
  } catch (error) {
    console.error("[whatsapp-bot] notifyNewOrder failed", error)
  }
}

function buildOwnerAlert(
  order: OrderWithCustomer,
  items: {
    product_name: string
    quantity: number
    subtotal_cents: number
    notes: string | null
  }[],
  panelUrl: string,
) {
  const time = new Date(order.created_at).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Cuiaba",
  })
  const lines = [
    `🔔 *Novo pedido #${order.order_number}*`,
    "",
    `Horário: ${time}`,
    `Tipo: ${order.fulfillment_type === "delivery" ? "Entrega" : "Retirada"}`,
    `Cliente: ${order.customer?.name ?? "—"}${order.customer?.whatsapp ? ` (${order.customer.whatsapp})` : ""}`,
  ]
  if (order.fulfillment_type === "delivery" && order.delivery_address) {
    lines.push(`Endereço: ${formatAddress(order.delivery_address)}`)
  }
  lines.push("", "*Itens:*")
  for (const item of items) {
    lines.push(
      `${item.quantity}x ${item.product_name} — ${formatBRL(item.subtotal_cents)}`,
    )
    if (item.notes) lines.push(`   _obs: ${item.notes}_`)
  }
  lines.push(
    "",
    `Subtotal: ${formatBRL(order.subtotal_cents)}`,
    `Entrega: ${formatBRL(order.delivery_fee_cents)}`,
  )
  if (order.discount_cents > 0) {
    lines.push(`Desconto: -${formatBRL(order.discount_cents)}`)
  }
  lines.push(`*Total: ${formatBRL(order.total_cents)}*`)
  if (order.payment_preference) {
    lines.push(
      `Pagamento: ${PAYMENT_PREFERENCE_LABEL[order.payment_preference]}`,
    )
  }
  lines.push("", `Gerencie no painel: ${panelUrl}`)
  return lines.join("\n")
}

/** A message arrived at (or was sent from) the store's WhatsApp. Greets
 * customers who start a conversation — at most once per interval, and not
 * while the store is already talking to them. */
export async function handleIncomingMessage({
  instance,
  phone,
  fromMe,
}: {
  instance: string
  phone: string
  fromMe: boolean
}) {
  const admin = createAdminClient()
  if (!admin) return

  const { data: settingsRow } = await admin
    .from("store_settings")
    .select("store_id")
    .eq("whatsapp_instance", instance)
    .maybeSingle<{ store_id: string }>()
  if (!settingsRow) return

  const storeId = settingsRow.store_id
  const now = new Date()
  const key = contactKey(phone)

  // The owner (or the bot) replied from the phone: just note it, so the
  // greeting doesn't interrupt a conversation already in progress.
  if (fromMe) {
    await recordOutbound(admin, storeId, key)
    return
  }

  const ctx = await loadStoreContext(admin, storeId)
  if (!ctx) return

  const { data: contact } = await admin
    .from("whatsapp_contacts")
    .select("last_inbound_at, last_outbound_at")
    .eq("store_id", storeId)
    .eq("phone", key)
    .maybeSingle<{
      last_inbound_at: string | null
      last_outbound_at: string | null
    }>()

  await admin.from("whatsapp_contacts").upsert({
    store_id: storeId,
    phone: key,
    last_inbound_at: now.toISOString(),
  })

  const intervalMs = ctx.settings.whatsapp_greeting_interval_minutes * 60_000
  const quietSince = (iso: string | null | undefined) =>
    !iso || now.getTime() - new Date(iso).getTime() >= intervalMs
  if (!quietSince(contact?.last_inbound_at)) return
  if (!quietSince(contact?.last_outbound_at)) return

  const templates = resolveTemplates(ctx.settings.whatsapp_templates)
  const isOpen = isStoreOpenNow(ctx.store.opening_hours)
  const template =
    !isOpen && templates.away.enabled ? templates.away : templates.greeting
  if (!template.enabled) return

  const text = renderTemplate(template.text, {
    cardapio: `${getSiteUrl()}/cardapio/${ctx.store.slug}`,
    loja: ctx.store.name,
  })

  if (await sendText(instance, phone, text)) {
    await recordOutbound(admin, storeId, key, {
      last_greeting_at: now.toISOString(),
    })
  }
}
