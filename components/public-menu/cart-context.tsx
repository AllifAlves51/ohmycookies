"use client"

import { createContext, useContext, useEffect, useMemo, useState } from "react"

export type CartItem = {
  productId: string
  name: string
  unitPriceCents: number
  imageUrl: string | null
  quantity: number
  notes?: string
}

type CartContextValue = {
  items: CartItem[]
  addItem: (item: Omit<CartItem, "quantity">, quantity?: number) => void
  setQuantity: (productId: string, quantity: number) => void
  removeItem: (productId: string) => void
  clear: () => void
  subtotalCents: number
  itemCount: number
  isOpen: boolean
  openCart: () => void
  closeCart: () => void
  isHistoryOpen: boolean
  openHistory: () => void
  closeHistory: () => void
}

const CartContext = createContext<CartContextValue | null>(null)

/** What's orderable right now, keyed by product id; max null = no stock
 * control. Used to clean up a cart saved on a previous visit. */
export type CartCatalog = Record<
  string,
  { name: string; unitPriceCents: number; max: number | null }
>

function reconcile(saved: CartItem[], catalog: CartCatalog | undefined) {
  if (!catalog) return saved
  return saved.flatMap((item) => {
    const current = catalog[item.productId]
    // Deleted, deactivated or sold out since the cart was saved.
    if (!current || current.max === 0) return []
    return [
      {
        ...item,
        name: current.name,
        unitPriceCents: current.unitPriceCents,
        quantity:
          current.max === null
            ? item.quantity
            : Math.min(item.quantity, current.max),
      },
    ]
  })
}

function storageKey(storeSlug: string) {
  return `ohmycookies:cart:${storeSlug}`
}

export function CartProvider({
  storeSlug,
  catalog,
  children,
}: {
  storeSlug: string
  catalog?: CartCatalog
  children: React.ReactNode
}) {
  const [items, setItems] = useState<CartItem[]>([])
  const [hydrated, setHydrated] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [isHistoryOpen, setIsHistoryOpen] = useState(false)

  // Cart state starts empty (matching the server-rendered markup) and is
  // synchronized from localStorage once mounted in the browser — reading
  // it any earlier would either crash during SSR or cause a hydration
  // mismatch.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey(storeSlug))
      if (raw) {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time hydration from a browser-only store; there is no external "change" event to subscribe to instead.
        setItems(reconcile(JSON.parse(raw), catalog))
      }
    } catch {
      // Malformed or inaccessible storage (private mode, etc.) — start empty.
    }
    setHydrated(true)
    // Only on first load: the catalog is server data for this visit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeSlug])

  useEffect(() => {
    if (!hydrated) return
    try {
      localStorage.setItem(storageKey(storeSlug), JSON.stringify(items))
    } catch {
      // Storage write failures (quota, private mode) are non-fatal.
    }
  }, [items, storeSlug, hydrated])

  const addItem: CartContextValue["addItem"] = (item, quantity = 1) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.productId === item.productId)
      if (existing) {
        return prev.map((i) =>
          i.productId === item.productId
            ? { ...i, quantity: i.quantity + quantity }
            : i,
        )
      }
      return [...prev, { ...item, quantity }]
    })
  }

  const setQuantity: CartContextValue["setQuantity"] = (
    productId,
    quantity,
  ) => {
    setItems((prev) => {
      if (quantity <= 0) {
        return prev.filter((i) => i.productId !== productId)
      }
      return prev.map((i) =>
        i.productId === productId ? { ...i, quantity } : i,
      )
    })
  }

  const removeItem: CartContextValue["removeItem"] = (productId) => {
    setItems((prev) => prev.filter((i) => i.productId !== productId))
  }

  const clear = () => setItems([])

  const subtotalCents = useMemo(
    () => items.reduce((sum, i) => sum + i.unitPriceCents * i.quantity, 0),
    [items],
  )
  const itemCount = useMemo(
    () => items.reduce((sum, i) => sum + i.quantity, 0),
    [items],
  )

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        setQuantity,
        removeItem,
        clear,
        subtotalCents,
        itemCount,
        isOpen,
        openCart: () => setIsOpen(true),
        closeCart: () => setIsOpen(false),
        isHistoryOpen,
        openHistory: () => setIsHistoryOpen(true),
        closeHistory: () => setIsHistoryOpen(false),
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) {
    throw new Error("useCart must be used within a CartProvider")
  }
  return ctx
}
