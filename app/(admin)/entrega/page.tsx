import { createClient } from "@/lib/supabase/server"
import { getStoreByOwnerId } from "@/lib/services/store"
import { getDeliveryZones } from "@/lib/services/delivery"
import { DeliveryZoneRow } from "@/components/admin/delivery/delivery-zone-row"
import { NewDeliveryZoneForm } from "@/components/admin/delivery/new-delivery-zone-form"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export default async function EntregaPage() {
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

  const { data: zones } = await getDeliveryZones(supabase, store.id)
  const allZones = zones ?? []

  return (
    <main className="mx-auto max-w-3xl space-y-6 p-6">
      <h1 className="text-2xl font-semibold">Entrega</h1>

      <Card>
        <CardHeader>
          <CardTitle>Regiões de entrega</CardTitle>
          <CardDescription>
            O cliente escolhe a região dele no checkout e a taxa correspondente
            é aplicada ao pedido.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {allZones.length > 0 ? (
            <div className="hidden grid-cols-[1fr_140px_140px_auto_auto] gap-3 pb-2 text-xs font-medium sm:grid">
              <span>Região</span>
              <span>Taxa</span>
              <span>Prazo</span>
              <span>Ativo</span>
              <span />
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">
              Nenhuma região cadastrada ainda.
            </p>
          )}

          {allZones.map((zone) => (
            <DeliveryZoneRow key={zone.id} zone={zone} />
          ))}

          <NewDeliveryZoneForm />
        </CardContent>
      </Card>
    </main>
  )
}
