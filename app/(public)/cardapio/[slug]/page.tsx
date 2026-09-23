import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getStoreBySlug, getStoreSettings } from "@/lib/services/store"
import { getCategories, getProducts } from "@/lib/services/product"
import { getDeliveryZones } from "@/lib/services/delivery"
import { isStoreOpenNow } from "@/lib/utils/opening-hours"
import { StoreHeader } from "@/components/public-menu/store-header"
import { MenuContent } from "@/components/public-menu/menu-content"
import { CartProvider } from "@/components/public-menu/cart-context"
import { CartBar } from "@/components/public-menu/cart-bar"

export default async function CardapioPage({
  params,
}: PageProps<"/cardapio/[slug]">) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: store } = await getStoreBySlug(supabase, slug)

  if (!store) {
    notFound()
  }

  const [
    { data: settings },
    { data: categories },
    { data: products },
    { data: deliveryZones },
  ] = await Promise.all([
    getStoreSettings(supabase, store.id),
    getCategories(supabase, store.id),
    getProducts(supabase, store.id),
    getDeliveryZones(supabase, store.id),
  ])

  const isOpen = isStoreOpenNow(store.opening_hours)

  return (
    <CartProvider storeSlug={store.slug}>
      <div className="mx-auto flex min-h-full w-full max-w-md flex-col pb-24">
        <StoreHeader store={store} isOpen={isOpen} />
        <MenuContent categories={categories ?? []} products={products ?? []} />
        <CartBar
          storeSlug={store.slug}
          storeWhatsapp={store.whatsapp_number}
          minOrderCents={settings?.min_order_cents ?? 0}
          pickupEnabled={settings?.pickup_enabled ?? false}
          deliveryEnabled={settings?.delivery_enabled ?? false}
          deliveryZones={deliveryZones ?? []}
        />
      </div>
    </CartProvider>
  )
}
