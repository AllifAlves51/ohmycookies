import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getStoreBySlug } from "@/lib/services/store"
import { getOrderTracking, getOrderTrackingItems } from "@/lib/services/order"
import { OrderTrackingView } from "@/components/public-menu/order-tracking-view"

export const metadata: Metadata = {
  title: "Acompanhe seu pedido",
  robots: { index: false, follow: false },
}

export default async function OrderTrackingPage({
  params,
}: PageProps<"/cardapio/[slug]/pedido/[id]">) {
  const { slug, id } = await params
  const supabase = await createClient()

  const { data: store } = await getStoreBySlug(supabase, slug)

  if (!store) {
    notFound()
  }

  const [{ data: tracking }, { data: items }] = await Promise.all([
    getOrderTracking(supabase, id),
    getOrderTrackingItems(supabase, id),
  ])

  if (!tracking) {
    notFound()
  }

  return (
    <div className="mx-auto flex min-h-full w-full max-w-md flex-col">
      <OrderTrackingView
        orderId={id}
        storeName={store.name}
        initialTracking={tracking}
        items={items ?? []}
      />
    </div>
  )
}
