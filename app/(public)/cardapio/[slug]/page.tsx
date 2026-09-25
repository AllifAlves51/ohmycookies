import { cache } from "react"
import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import {
  getStoreBySlug,
  getStoreSettings,
  type Store,
} from "@/lib/services/store"
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
import { SITE_NAME, getSiteUrl } from "@/lib/site"

// Shared by generateMetadata and the page so the store is fetched once per request.
const loadStore = cache(async (slug: string) => {
  const supabase = await createClient()
  const { data } = await getStoreBySlug(supabase, slug)
  return data
})

function storeDescription(store: Store) {
  const city = store.address
    ? ` em ${store.address.city}/${store.address.state}`
    : ""
  return `Cardápio online da ${store.name}${city}. Cookies artesanais para delivery ou retirada — escolha, monte seu pedido e finalize pelo WhatsApp.`
}

export async function generateMetadata({
  params,
}: PageProps<"/cardapio/[slug]">): Promise<Metadata> {
  const { slug } = await params
  const store = await loadStore(slug)

  if (!store) {
    return { title: "Cardápio não encontrado", robots: { index: false } }
  }

  const title = `${store.name} | Cardápio online`
  const description = storeDescription(store)
  const path = `/cardapio/${store.slug}`

  return {
    // Absolute: the store name already carries the brand, so skip the root template.
    title: { absolute: title },
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      locale: "pt_BR",
      siteName: SITE_NAME,
      url: path,
      title,
      description,
      // Redeclared: overriding openGraph drops the root file-based image.
      images: [
        {
          url: "/opengraph-image.png",
          width: 1200,
          height: 630,
          alt: SITE_NAME,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/twitter-image.png"],
    },
  }
}

const DAY_SCHEMA = {
  mon: "Monday",
  tue: "Tuesday",
  wed: "Wednesday",
  thu: "Thursday",
  fri: "Friday",
  sat: "Saturday",
  sun: "Sunday",
} as const

function storeJsonLd(store: Store) {
  const url = `${getSiteUrl()}/cardapio/${store.slug}`
  const sameAs = [
    store.instagram_url,
    store.facebook_url,
    store.website_url,
  ].filter(Boolean)
  const hours = store.opening_hours
    ? Object.entries(store.opening_hours)
        .filter(([, range]) => range.open)
        .map(([day, range]) => ({
          "@type": "OpeningHoursSpecification",
          dayOfWeek: DAY_SCHEMA[day as keyof typeof DAY_SCHEMA],
          opens: range.from,
          closes: range.to,
        }))
    : []

  return {
    "@context": "https://schema.org",
    "@type": "Bakery",
    name: store.name,
    url,
    image: store.logo_url ?? `${getSiteUrl()}/opengraph-image.png`,
    logo: store.logo_url ?? undefined,
    telephone: store.whatsapp_number
      ? // Numbers are saved with DDD but not always with the 55 country code.
        `+${store.whatsapp_number.length <= 11 ? "55" : ""}${store.whatsapp_number}`
      : undefined,
    servesCuisine: "Cookies",
    hasMenu: url,
    sameAs: sameAs.length ? sameAs : undefined,
    openingHoursSpecification: hours.length ? hours : undefined,
    address: store.address
      ? {
          "@type": "PostalAddress",
          streetAddress: `${store.address.street}, ${store.address.number}`,
          addressLocality: store.address.city,
          addressRegion: store.address.state,
          postalCode: store.address.zip,
          addressCountry: "BR",
        }
      : undefined,
  }
}

export default async function CardapioPage({
  params,
}: PageProps<"/cardapio/[slug]">) {
  const { slug } = await params
  const store = await loadStore(slug)

  if (!store) {
    notFound()
  }

  const supabase = await createClient()

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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(storeJsonLd(store)).replace(/</g, "\\u003c"),
        }}
      />
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
