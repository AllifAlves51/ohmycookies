import { createClient } from "@/lib/supabase/server"
import { getStoreByOwnerId } from "@/lib/services/store"
import { getOrders } from "@/lib/services/order"
import { getProducts } from "@/lib/services/product"
import { getDeliveryZones } from "@/lib/services/delivery"
import { KanbanBoard } from "@/components/admin/orders/kanban-board"
import { NewOrderDialog } from "@/components/admin/orders/new-order-dialog"

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

  const [{ data: orders }, { data: products }, { data: deliveryZones }] =
    await Promise.all([
      getOrders(supabase, store.id),
      getProducts(supabase, store.id),
      getDeliveryZones(supabase, store.id),
    ])

  return (
    <main className="flex flex-1 flex-col">
      <div className="flex items-start justify-between gap-4 px-6 pt-6">
        <div>
          <h1 className="text-2xl font-semibold">Pedidos</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Acompanhe e gerencie todos os pedidos em tempo real.
          </p>
        </div>
        <NewOrderDialog
          products={products ?? []}
          deliveryZones={deliveryZones ?? []}
        />
      </div>
      <KanbanBoard storeId={store.id} initialOrders={orders ?? []} />
    </main>
  )
}
