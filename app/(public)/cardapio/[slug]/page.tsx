import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getStoreBySlug, getStoreSettings } from "@/lib/services/store"
import { getCategories, getProducts } from "@/lib/services/product"
import { getDeliveryZones } from "@/lib/services/delivery"
import { isStoreOpenNow } from "@/lib/utils/opening-hours"
import { StoreHeader } from "@/components/public-menu/store-header"
import { StoreInfoBlock } from "@/components/public-menu/store-info-block"
import { FeaturedCarousel } from "@/components/public-menu/featured-carousel"
import { MenuContent } from "@/components/public-menu/menu-content"
import { CartProvider } from "@/components/public-menu/cart-context"
import { CartBar } from "@/components/public-menu/cart-bar"
import { BottomNav } from "@/components/public-menu/bottom-nav"
import { FloatingCartButton } from "@/components/public-menu/floating-cart-button"
import { OrderHistorySheet } from "@/components/public-menu/order-history-sheet"

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
  const activeProducts = (products ?? []).filter((p) => p.active)
  const featuredProducts = activeProducts.filter((p) => p.featured)

  return (
    <CartProvider storeSlug={store.slug}>
      <div className="mx-auto flex min-h-full w-full max-w-md flex-col pb-20">
        <StoreHeader store={store} />
        <StoreInfoBlock store={store} settings={settings} isOpen={isOpen} />
        <FeaturedCarousel products={featuredProducts} />
        <MenuContent categories={categories ?? []} products={activeProducts} />
        <CartBar
          storeSlug={store.slug}
          storeWhatsapp={store.whatsapp_number}
          minOrderCents={settings?.min_order_cents ?? 0}
          pickupEnabled={settings?.pickup_enabled ?? false}
          deliveryEnabled={settings?.delivery_enabled ?? false}
          deliveryZones={deliveryZones ?? []}
        />
        <OrderHistorySheet storeSlug={store.slug} />
        <FloatingCartButton />
        <BottomNav />
      </div>
    </CartProvider>
  )
}
