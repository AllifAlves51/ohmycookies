import type { SupabaseClient } from "@supabase/supabase-js"

type RequestedItem = { productId: string; quantity: number }

export type ItemsCheck =
  { ok: true } | { ok: false; error: string; unavailableProductIds: string[] }

/** Validates an order's items *before* the order row is created, so a
 * deleted/deactivated product or missing stock can't leave an empty order
 * behind. The database triggers still have the final say (races). */
export async function checkOrderItems(
  supabase: SupabaseClient,
  storeId: string,
  items: RequestedItem[],
): Promise<ItemsCheck> {
  const wanted = new Map<string, number>()
  for (const item of items) {
    wanted.set(
      item.productId,
      (wanted.get(item.productId) ?? 0) + item.quantity,
    )
  }

  const { data: products, error } = await supabase
    .from("products")
    .select("id, name, active, stock_control_enabled, stock_quantity")
    .eq("store_id", storeId)
    .in("id", [...wanted.keys()])

  if (error) {
    return {
      ok: false,
      error: "Não foi possível conferir os itens. Tente novamente.",
      unavailableProductIds: [],
    }
  }

  const byId = new Map((products ?? []).map((p) => [p.id, p]))
  const unavailable = [...wanted.keys()].filter((id) => !byId.get(id)?.active)
  if (unavailable.length > 0) {
    return {
      ok: false,
      error:
        unavailable.length === 1
          ? "Um item do carrinho não está mais disponível e foi removido. Confira o carrinho e finalize de novo."
          : "Alguns itens do carrinho não estão mais disponíveis e foram removidos. Confira o carrinho e finalize de novo.",
      unavailableProductIds: unavailable,
    }
  }

  for (const [id, quantity] of wanted) {
    const product = byId.get(id)!
    if (!product.stock_control_enabled) continue
    const left = product.stock_quantity ?? 0
    if (left < quantity) {
      return {
        ok: false,
        error:
          left === 0
            ? `${product.name} esgotou. Remova do carrinho para continuar.`
            : `Só temos ${left} unidade(s) de ${product.name}. Ajuste a quantidade para continuar.`,
        unavailableProductIds: left === 0 ? [id] : [],
      }
    }
  }

  return { ok: true }
}

/** Friendly text for an order_items insert rejected by the database. */
export function itemsInsertErrorMessage(message: string | undefined) {
  if (message?.startsWith("Estoque insuficiente")) {
    return `${message}. Ajuste o carrinho e tente de novo.`
  }
  return "Um dos itens não está mais disponível. Atualize a página e tente novamente."
}
