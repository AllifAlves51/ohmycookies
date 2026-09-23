import { createClient } from "@/lib/supabase/server"
import { getStoreByOwnerId } from "@/lib/services/store"
import {
  getCustomers,
  getCustomerOrders,
  buildCustomersWithStats,
} from "@/lib/services/customer"
import { CustomerTable } from "@/components/admin/customers/customer-table"
import { Card, CardContent } from "@/components/ui/card"

export default async function ClientesPage() {
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

  const [{ data: customers }, { data: orders }] = await Promise.all([
    getCustomers(supabase, store.id),
    getCustomerOrders(supabase, store.id),
  ])

  const customersWithStats = buildCustomersWithStats(
    customers ?? [],
    orders ?? [],
  )

  return (
    <main className="mx-auto max-w-3xl space-y-6 p-6">
      <h1 className="text-2xl font-semibold">Clientes</h1>
      <Card>
        <CardContent>
          <CustomerTable customers={customersWithStats} />
        </CardContent>
      </Card>
    </main>
  )
}
