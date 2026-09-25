"use server"

import { after } from "next/server"
import { notifyNewOrder } from "@/lib/whatsapp-bot"
import { createClient } from "@/lib/supabase/server"
import { getStoreBySlug, getStoreSettings } from "@/lib/services/store"
import { getOrderTracking, type OrderTracking } from "@/lib/services/order"
import {
  getDeliveryZones,
  findZoneForDistanceKm,
} from "@/lib/services/delivery"
import {
  isMapsConfigured,
  geocodeAddress,
  getRouteDistanceKm,
} from "@/lib/services/maps"
import { formatAddress } from "@/lib/utils/address"
import type { AddressInput } from "@/lib/validations/store"
import { checkoutSchema, type CheckoutInput } from "@/lib/validations/checkout"

export type CheckoutState = {
  error?: string
  success?: boolean
  orderNumber?: number
  orderId?: string
  discountCents?: number
}

export async function submitOrderAction(
  input: CheckoutInput,
): Promise<CheckoutState> {
  const parsed = checkoutSchema.safeParse(input)

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" }
  }

  const supabase = await createClient()
  const { data: store } = await getStoreBySlug(supabase, parsed.data.storeSlug)

  if (!store) {
    return { error: "Loja não encontrada" }
  }

  const { data: customerId, error: customerError } = await supabase.rpc(
    "checkout_upsert_customer",
    {
      p_store_id: store.id,
      p_name: parsed.data.customerName,
      p_whatsapp: parsed.data.customerWhatsapp,
      p_address: parsed.data.address,
    },
  )

  if (customerError || !customerId) {
    return {
      error: "Não foi possível registrar seus dados. Tente novamente.",
    }
  }

  const orderId = crypto.randomUUID()

  const { error: orderError } = await supabase.from("orders").insert({
    id: orderId,
    store_id: store.id,
    customer_id: customerId,
    fulfillment_type: parsed.data.fulfillmentType,
    delivery_zone_id: parsed.data.deliveryZoneId,
    delivery_address:
      parsed.data.fulfillmentType === "delivery" ? parsed.data.address : null,
    payment_preference: parsed.data.paymentMethod,
  })

  if (orderError) {
    return {
      error:
        "Não foi possível criar o pedido. Verifique a região de entrega escolhida e tente novamente.",
    }
  }

  const { error: itemsError } = await supabase.from("order_items").insert(
    parsed.data.items.map((item) => ({
      order_id: orderId,
      product_id: item.productId,
      quantity: item.quantity,
      notes: item.notes || null,
    })),
  )

  if (itemsError) {
    return {
      error:
        "Um dos itens do carrinho não está mais disponível. Atualize a página e tente novamente.",
    }
  }

  const { data: orderNumber } = await supabase.rpc("get_order_number", {
    p_order_id: orderId,
  })

  let discountCents = 0
  if (parsed.data.couponCode) {
    const { data } = await supabase.rpc("apply_coupon_to_order", {
      p_order_id: orderId,
      p_code: parsed.data.couponCode,
    })
    discountCents = data ?? 0
  }

  // Confirmation to the customer + alert to the owner, once totals (and
  // any coupon) are final. Doesn't delay the checkout response.
  after(() => notifyNewOrder(orderId))

  return {
    success: true,
    orderNumber: orderNumber ?? undefined,
    orderId,
    discountCents,
  }
}

/** Live preview shown in the checkout form before the order is submitted
 * — doesn't touch usage_count. The authoritative discount is recomputed
 * server-side again at submit time via apply_coupon_to_order, so a stale
 * preview (e.g. someone else used the last slot in the meantime) can
 * never overcharge or undercharge the order. */
export async function previewCouponAction(
  storeSlug: string,
  code: string,
  subtotalCents: number,
): Promise<number> {
  const supabase = await createClient()
  const { data: store } = await getStoreBySlug(supabase, storeSlug)
  if (!store) return 0

  const { data } = await supabase.rpc("preview_coupon", {
    p_store_id: store.id,
    p_code: code,
    p_subtotal_cents: subtotalCents,
  })

  return data ?? 0
}

export type DeliveryEstimate = {
  zoneId: string
  zoneName: string
  feeCents: number
  etaMinutes: number
  distanceKm: number
}

/** Auto-picks the matching km-radius zone from the customer's real address
 * via Google Maps. Returns null whenever anything in the chain is
 * unavailable (no API key, store has no geocoded origin yet, address
 * doesn't geocode, or it falls outside every configured radius) — the
 * checkout form falls back to manual zone selection in that case. */
export async function estimateDeliveryFeeAction(
  storeSlug: string,
  address: AddressInput,
): Promise<DeliveryEstimate | null> {
  if (!isMapsConfigured()) return null

  const supabase = await createClient()
  const { data: store } = await getStoreBySlug(supabase, storeSlug)
  if (!store) return null

  const { data: settings } = await getStoreSettings(supabase, store.id)
  if (settings?.latitude == null || settings?.longitude == null) return null

  const destination = await geocodeAddress(formatAddress(address))
  if (!destination) return null

  const distanceKm = await getRouteDistanceKm(
    { lat: settings.latitude, lng: settings.longitude },
    destination,
  )
  if (distanceKm === null) return null

  const { data: zones } = await getDeliveryZones(supabase, store.id)
  const zone = findZoneForDistanceKm(zones ?? [], distanceKm)
  if (!zone) return null

  return {
    zoneId: zone.id,
    zoneName: zone.name,
    feeCents: zone.fee_cents,
    etaMinutes:
      zone.estimated_time_minutes + (settings.order_prep_minutes ?? 0),
    distanceKm: Math.round(distanceKm * 10) / 10,
  }
}

export async function getOrderTrackingStatusAction(
  orderId: string,
): Promise<OrderTracking | null> {
  const supabase = await createClient()
  const { data } = await getOrderTracking(supabase, orderId)
  return data
}

export type OrderHistoryEntry = OrderTracking & { orderId: string }

/** Looks up the current status/total for a list of order ids the customer's
 * browser remembers locally — reuses the same public tracking RPC as the
 * single-order page, so it only ever reveals what that page already would
 * (nothing is enumerable without already knowing the order's UUID). */
export async function getOrderHistoryAction(
  orderIds: string[],
): Promise<OrderHistoryEntry[]> {
  const supabase = await createClient()

  const results = await Promise.all(
    orderIds.map(async (orderId) => {
      const { data } = await getOrderTracking(supabase, orderId)
      return data ? { ...data, orderId } : null
    }),
  )

  return results
    .filter((entry): entry is OrderHistoryEntry => entry !== null)
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    )
}
