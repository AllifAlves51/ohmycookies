const MAX_REMEMBERED_ORDERS = 20

function storageKey(storeSlug: string) {
  return `ohmycookies:order-history:${storeSlug}`
}

/** Remembers a completed order's id on this browser so the customer can
 * find it again later — there's no customer login, so this is the only
 * place the "meus pedidos" list can live. */
export function rememberOrder(storeSlug: string, orderId: string) {
  try {
    const ids = getRememberedOrderIds(storeSlug)
    const next = [orderId, ...ids.filter((id) => id !== orderId)].slice(
      0,
      MAX_REMEMBERED_ORDERS,
    )
    localStorage.setItem(storageKey(storeSlug), JSON.stringify(next))
  } catch {
    // Storage write failures (quota, private mode) are non-fatal.
  }
}

export function getRememberedOrderIds(storeSlug: string): string[] {
  try {
    const raw = localStorage.getItem(storageKey(storeSlug))
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.filter((id) => typeof id === "string") : []
  } catch {
    return []
  }
}
