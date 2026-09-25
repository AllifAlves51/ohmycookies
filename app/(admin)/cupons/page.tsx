import { createClient } from "@/lib/supabase/server"
import { getStoreByOwnerId } from "@/lib/services/store"
import { getCoupons } from "@/lib/services/coupon"
import { CouponRow } from "@/components/admin/coupons/coupon-row"
import { NewCouponForm } from "@/components/admin/coupons/new-coupon-form"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export default async function CuponsPage() {
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

  const { data: coupons } = await getCoupons(supabase, store.id)
  const allCoupons = coupons ?? []

  return (
    <main className="mx-auto max-w-4xl space-y-6 p-6">
      <h1 className="text-2xl font-semibold">Cupons</h1>

      <Card>
        <CardHeader>
          <CardTitle>Cupons de desconto</CardTitle>
          <CardDescription>
            O cliente digita o código no checkout do cardápio pra aplicar o
            desconto. Deixe o limite de usos e a validade em branco para um
            cupom sem restrição.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {allCoupons.length > 0 ? (
            <div className="hidden grid-cols-[100px_140px_110px_110px_90px_130px_auto_auto] gap-3 pb-2 text-xs font-medium sm:grid">
              <span>Código</span>
              <span>Tipo</span>
              <span>Desconto</span>
              <span>Pedido mín.</span>
              <span>Limite</span>
              <span>Validade</span>
              <span>Ativo</span>
              <span />
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">
              Nenhum cupom cadastrado ainda.
            </p>
          )}

          {allCoupons.map((coupon) => (
            <CouponRow key={coupon.id} coupon={coupon} />
          ))}

          <NewCouponForm />
        </CardContent>
      </Card>
    </main>
  )
}
