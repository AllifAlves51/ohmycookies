"use server"

import { revalidatePath } from "next/cache"
import type { SupabaseClient } from "@supabase/supabase-js"
import { createClient } from "@/lib/supabase/server"
import { getStoreByOwnerId } from "@/lib/services/store"
import { updateOrderStatus, type OrderStatus } from "@/lib/services/order"
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
