import { Plus } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { getStoreByOwnerId } from "@/lib/services/store"
import { getCategories, getProducts } from "@/lib/services/product"
import { Button } from "@/components/ui/button"
import { CategoryManager } from "@/components/admin/products/category-manager"
import { ProductFormDialog } from "@/components/admin/products/product-form-dialog"
import { ProductTable } from "@/components/admin/products/product-table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PageHeader } from "@/components/admin/page-header"

export default async function ProdutosPage() {
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

  const [{ data: categories }, { data: products }] = await Promise.all([
    getCategories(supabase, store.id),
    getProducts(supabase, store.id),
  ])

  const allCategories = categories ?? []
  const allProducts = products ?? []

  return (
    <main className="mx-auto max-w-3xl space-y-6 px-4 py-6 sm:px-8 sm:py-8">
      <PageHeader
        title="Produtos"
        description="Cardápio, preços, destaques e estoque."
        actions={
          <ProductFormDialog
            mode="create"
            categories={allCategories}
            trigger={
              <Button>
                <Plus />
                Novo produto
              </Button>
            }
          />
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Categorias</CardTitle>
        </CardHeader>
        <CardContent>
          <CategoryManager categories={allCategories} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Todos os produtos</CardTitle>
        </CardHeader>
        <CardContent>
          <ProductTable products={allProducts} categories={allCategories} />
        </CardContent>
      </Card>
    </main>
  )
}
