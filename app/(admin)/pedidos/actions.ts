"use server"

import { revalidatePath } from "next/cache"
import type { SupabaseClient } from "@supabase/supabase-js"
import { createClient } from "@/lib/supabase/server"
import { getStoreByOwnerId } from "@/lib/services/store"
import {
  updateOrderStatus,
  type OrderStatus,
  type PaymentPreference,
} from "@/lib/services/order"
import { notifyStatusChange, type NotifyResult } from "@/lib/whatsapp-bot"
import type { AddressInput } from "@/lib/validations/store"
import {
  checkOrderItems,
  itemsInsertErrorMessage,
} from "@/lib/services/order-items-check"
import {
  estimateDeliveryFeeAction,
  type DeliveryEstimate,
} from "@/app/(public)/cardapio/[slug]/actions"
import {
  manualOrderSchema,
  type ManualOrderInput,
} from "@/lib/validations/manual-order"

async function requireOwnedStore(supabase: SupabaseClient) {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  const { data: store } = await getStoreByOwnerId(supabase, user.id)
  return store
}

/** Updates the status and, when the WhatsApp bot is connected, messages
 * the customer. "sent" tells the panel not to offer the manual button. */
export async function updateOrderStatusAction(
  orderId: string,
  status: OrderStatus,
): Promise<{ notified: NotifyResult }> {
  const supabase = await createClient()
  const store = await requireOwnedStore(supabase)

  if (!store) {
    return { notified: "unavailable" }
  }

  const { data: previous } = await supabase
    .from("orders")
    .select("status")
    .eq("id", orderId)
    .eq("store_id", store.id)
    .single<{ status: OrderStatus }>()

  if (!previous) {
    return { notified: "unavailable" }
  }

  const { error } = await updateOrderStatus(supabase, orderId, status)
  revalidatePath("/pedidos")

  if (error) {
    return { notified: "unavailable" }
  }

  return {
    notified: await notifyStatusChange(orderId, previous.status, status),
  }
}

export type ManualOrderActionState = {
  error?: string
  success?: string
}

/** Same insert flow as the public checkout — meant for phone/in-person
 * orders entered by the store owner. The order_items/orders triggers
 * (snapshotting price and totals) run identically regardless of who
 * inserts the row; the owner is exempt from the opening-hours guard. */
export async function createManualOrderAction(
  input: ManualOrderInput,
): Promise<ManualOrderActionState> {
  const parsed = manualOrderSchema.safeParse(input)

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" }
  }

  const supabase = await createClient()
  const store = await requireOwnedStore(supabase)

  if (!store) {
    return { error: "Loja não encontrada" }
  }

  const itemsCheck = await checkOrderItems(
    supabase,
    store.id,
    parsed.data.items,
  )
  if (!itemsCheck.ok) {
    return { error: itemsCheck.error.replace(" do carrinho", "") }
  }

  const isDelivery = parsed.data.fulfillmentType === "delivery"
  const address = isDelivery ? parsed.data.address : null

  const { data: customerId, error: customerError } = await supabase.rpc(
    "checkout_upsert_customer",
    {
      p_store_id: store.id,
      p_name: parsed.data.customerName,
      p_whatsapp: parsed.data.customerWhatsapp,
      p_address: address,
    },
  )

  if (customerError || !customerId) {
    return { error: "Não foi possível registrar o cliente. Tente novamente." }
  }

  const orderId = crypto.randomUUID()

  const { error: orderError } = await supabase.from("orders").insert({
    id: orderId,
    store_id: store.id,
    customer_id: customerId,
    fulfillment_type: parsed.data.fulfillmentType,
    delivery_zone_id: isDelivery ? parsed.data.deliveryZoneId : null,
    delivery_address: address,
    payment_preference: parsed.data.paymentMethod,
    notes: parsed.data.notes || null,
  })

  if (orderError) {
    return {
      error:
        "Não foi possível criar o pedido. Verifique a região de entrega escolhida.",
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
    await supabase.from("orders").delete().eq("id", orderId)
    return { error: itemsInsertErrorMessage(itemsError.message) }
  }

  if (parsed.data.discountCents > 0) {
    await applyOrderDiscount(supabase, orderId, parsed.data.discountCents)
  }

  revalidatePath("/pedidos")
  return { success: "Pedido criado" }
}

export type KnownCustomer = {
  name: string
  address: AddressInput | null
}

/** Pre-fills the manual order form when the owner types a WhatsApp that
 * already ordered here. Numbers are stored as typed, so both the bare
 * DDD+number and the 55-prefixed form are tried. */
export async function lookupCustomerAction(
  whatsapp: string,
): Promise<KnownCustomer | null> {
  const digits = whatsapp.replace(/\D/g, "")
  if (digits.length < 10) return null

  const supabase = await createClient()
  const store = await requireOwnedStore(supabase)
  if (!store) return null

  const variants = new Set([digits])
  if (digits.startsWith("55") && digits.length >= 12) {
    variants.add(digits.slice(2))
  } else {
    variants.add(`55${digits}`)
  }

  const { data } = await supabase
    .from("customers")
    .select("name, address, updated_at")
    .eq("store_id", store.id)
    .in("whatsapp", [...variants])
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle<{ name: string; address: AddressInput | null }>()

  return data ? { name: data.name, address: data.address } : null
}

/** Same Google Maps radius lookup the storefront uses, for the manual
 * order form's "calcular taxa" button. */
export async function estimateManualDeliveryAction(
  address: AddressInput,
): Promise<DeliveryEstimate | null> {
  const supabase = await createClient()
  const store = await requireOwnedStore(supabase)
  if (!store) return null
  return estimateDeliveryFeeAction(store.slug, address)
}

/** Sets an absolute discount on an order, capped at what the order is
 * worth. The update is guarded on the totals it was computed from, so a
 * concurrent item edit can't leave total_cents out of sync. */
async function applyOrderDiscount(
  supabase: SupabaseClient,
  orderId: string,
  discountCents: number,
) {
  for (let attempt = 0; attempt < 3; attempt++) {
    const { data: order } = await supabase
      .from("orders")
      .select("subtotal_cents, delivery_fee_cents")
      .eq("id", orderId)
      .single<{ subtotal_cents: number; delivery_fee_cents: number }>()

    if (!order) return { error: "Pedido não encontrado" }

    const gross = order.subtotal_cents + order.delivery_fee_cents
    const discount = Math.min(Math.max(discountCents, 0), gross)

    const { data: updated, error } = await supabase
      .from("orders")
      .update({ discount_cents: discount, total_cents: gross - discount })
      .eq("id", orderId)
      .eq("subtotal_cents", order.subtotal_cents)
      .eq("delivery_fee_cents", order.delivery_fee_cents)
      .select("total_cents")

    if (error) return { error: "Não foi possível aplicar o desconto" }
    if (updated && updated.length > 0) {
      // Keep a still-pending payment record in step with the new total.
      await supabase
        .from("payments")
        .update({ amount_cents: gross - discount })
        .eq("order_id", orderId)
        .eq("status", "pending")
      return { discountCents: discount, totalCents: gross - discount }
    }
  }
  return {
    error: "O pedido mudou enquanto o desconto era aplicado. Tente de novo.",
  }
}

export async function setOrderDiscountAction(
  orderId: string,
  discountCents: number,
): Promise<{ error?: string; discountCents?: number; totalCents?: number }> {
  if (!Number.isInteger(discountCents) || discountCents < 0) {
    return { error: "Desconto inválido" }
  }

  const supabase = await createClient()
  const store = await requireOwnedStore(supabase)
  if (!store) return { error: "Loja não encontrada" }

  const { data: order } = await supabase
    .from("orders")
    .select("status")
    .eq("id", orderId)
    .eq("store_id", store.id)
    .single<{ status: OrderStatus }>()

  if (!order) return { error: "Pedido não encontrado" }
  if (order.status === "cancelled") {
    return { error: "Reabra o pedido antes de dar desconto" }
  }

  const result = await applyOrderDiscount(supabase, orderId, discountCents)
  revalidatePath("/pedidos")
  return result
}

export type OrderDetailItem = {
  id: string
  productId: string | null
  productName: string
  quantity: number
  unitPriceCents: number
  subtotalCents: number
  imageUrl: string | null
}

export type OrderDetail = {
  items: OrderDetailItem[]
  paymentStatus: "pending" | "paid" | null
  notes: string | null
  customerOrderCount: number
}

export async function getOrderDetailAction(
  orderId: string,
): Promise<OrderDetail | null> {
  const supabase = await createClient()
  const store = await requireOwnedStore(supabase)

  if (!store) {
    return null
  }

  const { data: order } = await supabase
    .from("orders")
    .select("id, customer_id, notes")
    .eq("id", orderId)
    .eq("store_id", store.id)
    .single()

  if (!order) {
    return null
  }

  const [{ data: itemRows }, { data: paymentRow }, { count }] =
    await Promise.all([
      supabase
        .from("order_items")
        .select(
          "id, product_id, product_name, quantity, unit_price_cents, subtotal_cents, products(image_url)",
        )
        .eq("order_id", orderId),
      supabase
        .from("payments")
        .select("status")
        .eq("order_id", orderId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("orders")
        .select("id", { count: "exact", head: true })
        .eq("customer_id", order.customer_id),
    ])

  return {
    items: (itemRows ?? []).map((row) => {
      const productImage = row.products as unknown as
        { image_url: string | null } | { image_url: string | null }[] | null
      const image = Array.isArray(productImage) ? productImage[0] : productImage
      return {
        id: row.id,
        productId: row.product_id,
        productName: row.product_name,
        quantity: row.quantity,
        unitPriceCents: row.unit_price_cents,
        subtotalCents: row.subtotal_cents,
        imageUrl: image?.image_url ?? null,
      }
    }),
    paymentStatus:
      (paymentRow?.status as "pending" | "paid" | undefined) ?? null,
    notes: order.notes,
    customerOrderCount: count ?? 0,
  }
}

export async function updateOrderNotesAction(orderId: string, notes: string) {
  const supabase = await createClient()
  const store = await requireOwnedStore(supabase)

  if (!store) {
    return
  }

  await supabase
    .from("orders")
    .update({ notes: notes || null })
    .eq("id", orderId)
    .eq("store_id", store.id)

  revalidatePath("/pedidos")
}

export async function setOrderPaymentStatusAction(
  orderId: string,
  method: PaymentPreference | null,
  status: "pending" | "paid",
  amountCents: number,
) {
  const supabase = await createClient()
  const store = await requireOwnedStore(supabase)

  if (!store) {
    return
  }

  const { data: order } = await supabase
    .from("orders")
    .select("id")
    .eq("id", orderId)
    .eq("store_id", store.id)
    .single()

  if (!order) {
    return
  }

  const { data: existing } = await supabase
    .from("payments")
    .select("id")
    .eq("order_id", orderId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (existing) {
    await supabase
      .from("payments")
      .update({ status, amount_cents: amountCents })
      .eq("id", existing.id)
  } else {
    await supabase.from("payments").insert({
      order_id: orderId,
      method: method ?? "cash",
      status,
      amount_cents: amountCents,
    })
  }

  revalidatePath("/pedidos")
}

export async function deleteOrderAction(orderId: string) {
  const supabase = await createClient()
  const store = await requireOwnedStore(supabase)

  if (!store) {
    return
  }

  await supabase
    .from("orders")
    .delete()
    .eq("id", orderId)
    .eq("store_id", store.id)

  revalidatePath("/pedidos")
}

export type EditOrderInput = {
  items: { id: string | null; productId: string | null; quantity: number }[]
  paymentMethod: PaymentPreference
  address: AddressInput | null
}

/** Replaces an order's items, payment method and (for deliveries) address
 * in one database transaction — totals, delivery fee and stock follow via
 * triggers. */
export async function updateOrderAction(
  orderId: string,
  input: EditOrderInput,
): Promise<{ error?: string }> {
  if (input.items.length === 0) {
    return { error: "O pedido precisa ter ao menos um item" }
  }
  if (input.items.some((item) => !item.id && !item.productId)) {
    return { error: "Item inválido" }
  }
  if (
    input.items.some(
      (item) => !Number.isInteger(item.quantity) || item.quantity <= 0,
    )
  ) {
    return { error: "Quantidade inválida" }
  }

  const supabase = await createClient()
  const store = await requireOwnedStore(supabase)
  if (!store) {
    return { error: "Loja não encontrada" }
  }

  const { error } = await supabase.rpc("admin_update_order", {
    p_order_id: orderId,
    p_items: input.items.map((item) => ({
      id: item.id,
      product_id: item.productId,
      quantity: item.quantity,
    })),
    p_payment: input.paymentMethod,
    p_address: input.address,
  })

  if (error) {
    if (error.code === "PGRST202" || error.code === "42883") {
      return {
        error:
          "Rode a migração 20260927120000_stock_control_and_order_editing.sql no Supabase para liberar a edição.",
      }
    }
    return {
      error: error.message.startsWith("Estoque insuficiente")
        ? error.message
        : error.message.includes("Produto inválido")
          ? "Um dos produtos adicionados não está disponível."
          : "Não foi possível salvar as alterações. Tente novamente.",
    }
  }

  revalidatePath("/pedidos")
  return {}
}
