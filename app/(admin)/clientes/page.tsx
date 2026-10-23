import { createClient } from "@/lib/supabase/server"
import { getStoreByOwnerId } from "@/lib/services/store"
import {
  getCustomers,
  getCustomerOrders,
  buildCustomersWithStats,
} from "@/lib/services/customer"
import { CustomerTable } from "@/components/admin/customers/customer-table"
import { Card, CardContent } from "@/components/ui/card"
import { PageHeader } from "@/components/admin/page-header"

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
    <main className="mx-auto max-w-5xl space-y-6 px-4 py-6 sm:px-8 sm:py-8">
      <PageHeader
        title="Clientes"
        description="Quem já comprou, quanto gastou e quando voltou pela última vez."
      />
      <Card>
        <CardContent>
          <CustomerTable customers={customersWithStats} />
        </CardContent>
      </Card>
    </main>
  )
}
