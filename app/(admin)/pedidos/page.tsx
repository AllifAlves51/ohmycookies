import { createClient } from "@/lib/supabase/server"
import { getStoreByOwnerId, getStoreSettings } from "@/lib/services/store"
import { resolveTemplates } from "@/lib/whatsapp-templates"
import { getOrders } from "@/lib/services/order"
import { getProducts } from "@/lib/services/product"
import { getDeliveryZones } from "@/lib/services/delivery"
import { KanbanBoard } from "@/components/admin/orders/kanban-board"
import { NewOrderDialog } from "@/components/admin/orders/new-order-dialog"
import { PageHeader } from "@/components/admin/page-header"

export default async function PedidosPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  const { data: store } = await getStoreByOwnerId(supabase, user.id)

  if (!store) {
    return (
      <main className="p-6">
        <p className="text-muted-foreground text-sm">
          Não foi possível carregar os dados da loja. Tente recarregar a página.
        </p>
      </main>
    )
  }

  const [
    { data: orders },
    { data: products },
    { data: deliveryZones },
    { data: settings },
  ] = await Promise.all([
    getOrders(supabase, store.id),
    getProducts(supabase, store.id),
    getDeliveryZones(supabase, store.id),
    getStoreSettings(supabase, store.id),
  ])

  return (
    <main className="flex flex-1 flex-col">
      <div className="px-4 pt-6 sm:px-8 sm:pt-8">
        <PageHeader
          title="Pedidos"
          description="Acompanhe e mova os pedidos em tempo real."
          actions={
            <NewOrderDialog
              products={products ?? []}
              deliveryZones={deliveryZones ?? []}
              storeCity={store.address?.city ?? ""}
              storeState={store.address?.state ?? ""}
            />
          }
        />
      </div>
      <KanbanBoard
        storeId={store.id}
        storeSlug={store.slug}
        storeName={store.name}
        templates={resolveTemplates(settings?.whatsapp_templates)}
        products={products ?? []}
        initialOrders={orders ?? []}
      />
    </main>
  )
}
