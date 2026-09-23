"use server"

import { createClient } from "@/lib/supabase/server"
import { getStoreBySlug } from "@/lib/services/store"
import { checkoutSchema, type CheckoutInput } from "@/lib/validations/checkout"

export type CheckoutState = {
  error?: string
  success?: boolean
  orderNumber?: number
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

  return { success: true, orderNumber: orderNumber ?? undefined }
}
