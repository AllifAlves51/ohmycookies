"use server"

import { createClient } from "@/lib/supabase/server"
import { getStoreBySlug, getStoreSettings } from "@/lib/services/store"
import { getOrderTracking, type OrderTracking } from "@/lib/services/order"
import {
  getDeliveryZones,
  findZoneForDistanceKm,
} from "@/lib/services/delivery"
import { isMapsConfigured, geocodeAddress, getRouteDistanceKm } from "@/lib/services/maps"
import { formatAddress } from "@/lib/utils/address"
import type { AddressInput } from "@/lib/validations/store"
import { checkoutSchema, type CheckoutInput } from "@/lib/validations/checkout"

export type CheckoutState = {
  error?: string
  success?: boolean
  orderNumber?: number
  orderId?: string
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

  return { success: true, orderNumber: orderNumber ?? undefined, orderId }
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
    etaMinutes: zone.estimated_time_minutes + (settings.order_prep_minutes ?? 0),
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
