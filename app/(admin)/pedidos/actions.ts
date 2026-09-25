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

export async function updateOrderStatusAction(
  orderId: string,
  status: OrderStatus,
) {
  const supabase = await createClient()
  const store = await requireOwnedStore(supabase)

  if (!store) {
    return
  }

  await updateOrderStatus(supabase, orderId, status)
  revalidatePath("/pedidos")
}

export type ManualOrderActionState = {
  error?: string
  success?: string
}

/** Same insert flow as the public checkout, minus the address requirement
 * — meant for phone/in-person orders entered by the store owner. The
 * order_items/orders triggers (snapshotting price and totals) run
 * identically regardless of who inserts the row. */
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

  const { data: customerId, error: customerError } = await supabase.rpc(
    "checkout_upsert_customer",
    {
      p_store_id: store.id,
      p_name: parsed.data.customerName,
      p_whatsapp: parsed.data.customerWhatsapp,
      p_address: null,
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
    delivery_zone_id:
      parsed.data.fulfillmentType === "delivery"
        ? parsed.data.deliveryZoneId
        : null,
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
    return {
      error: "Um dos itens escolhidos não está mais disponível.",
    }
  }

  revalidatePath("/pedidos")
  return { success: "Pedido criado" }
}

export type OrderDetailItem = {
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
          "product_name, quantity, unit_price_cents, subtotal_cents, products(image_url)",
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
        | { image_url: string | null }
        | { image_url: string | null }[]
        | null
      const image = Array.isArray(productImage)
        ? productImage[0]
        : productImage
      return {
        productName: row.product_name,
        quantity: row.quantity,
        unitPriceCents: row.unit_price_cents,
        subtotalCents: row.subtotal_cents,
        imageUrl: image?.image_url ?? null,
      }
    }),
    paymentStatus: (paymentRow?.status as "pending" | "paid" | undefined) ?? null,
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
    await supabase.from("payments").update({ status }).eq("id", existing.id)
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
