import { createClient } from "@/lib/supabase/server"
import { getStoreByOwnerId } from "@/lib/services/store"
import { getOrders } from "@/lib/services/order"
import { KanbanBoard } from "@/components/admin/orders/kanban-board"

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

  const { data: orders } = await getOrders(supabase, store.id)

  return (
    <main className="flex flex-1 flex-col">
      <h1 className="px-6 pt-6 text-2xl font-semibold">Pedidos</h1>
      <KanbanBoard storeId={store.id} initialOrders={orders ?? []} />
    </main>
  )
}
