export type CustomerProfile = {
  name: string
  whatsapp: string
  fulfillmentType: "delivery" | "pickup"
  street: string
  number: string
  neighborhood: string
  complement: string
  zip: string
  paymentMethod: "cash" | "pix" | "card"
}

function storageKey(storeSlug: string) {
  return `ohmycookies:customer-profile:${storeSlug}`
}

/** Saves the checkout details on this browser so the next order comes
 * pre-filled — like order history, there's no customer login, so the
 * device is the "cadastro". */
export function saveCustomerProfile(
  storeSlug: string,
  profile: CustomerProfile,
) {
  try {
    localStorage.setItem(storageKey(storeSlug), JSON.stringify(profile))
  } catch {
    // Storage write failures (quota, private mode) are non-fatal.
  }
}

export function loadCustomerProfile(
  storeSlug: string,
): Partial<CustomerProfile> | null {
  try {
    const raw = localStorage.getItem(storageKey(storeSlug))
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === "object" ? parsed : null
  } catch {
    return null
  }
}

export function clearCustomerProfile(storeSlug: string) {
  try {
    localStorage.removeItem(storageKey(storeSlug))
  } catch {
    // Ignore — nothing to clear if storage is unavailable.
  }
}
