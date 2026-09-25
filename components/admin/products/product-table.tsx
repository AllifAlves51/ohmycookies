"use client"

import { useTransition } from "react"
import { Copy, Pencil, Trash2 } from "lucide-react"
import {
  toggleProductActiveAction,
  duplicateProductAction,
  deleteProductAction,
} from "@/app/(admin)/produtos/actions"
import type { Category, Product } from "@/lib/services/product"
import { formatBRL } from "@/lib/utils/money"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { ProductFormDialog } from "@/components/admin/products/product-form-dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

function ProductRow({
  product,
  categories,
}: {
  product: Product
  categories: Category[]
}) {
  const [isTogglePending, startToggleTransition] = useTransition()
  const [isDuplicatePending, startDuplicateTransition] = useTransition()
  const [isDeletePending, startDeleteTransition] = useTransition()

  return (
    <div className="flex flex-col gap-2 border-b px-1 py-3 last:border-b-0 sm:flex-row sm:items-center sm:gap-3">
      <div className="flex items-center gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={product.image_url ?? "/placeholder-image.svg"}
          alt={product.name}
          className="bg-muted size-12 shrink-0 rounded-md object-cover"
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium">{product.name}</span>
            {product.featured ? <Badge>Destaque</Badge> : null}
            {product.stock_control_enabled ? (
              <Badge variant="secondary">
                Estoque: {product.stock_quantity ?? 0}
              </Badge>
            ) : null}
          </div>
          <div className="text-muted-foreground text-sm">
            {product.promo_price_cents ? (
              <>
                <span className="line-through">
                  {formatBRL(product.price_cents)}
                </span>{" "}
                <span className="text-foreground">
                  {formatBRL(product.promo_price_cents)}
                </span>
              </>
            ) : (
              formatBRL(product.price_cents)
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:ml-auto">
        <ProductFormDialog
          mode="edit"
          product={product}
          categories={categories}
          trigger={
            <Button variant="outline" size="icon-sm">
              <Pencil />
            </Button>
          }
        />

        <Button
          variant="outline"
          size="icon-sm"
          disabled={isDuplicatePending}
          onClick={() =>
            startDuplicateTransition(() => duplicateProductAction(product.id))
          }
        >
          <Copy />
        </Button>

        <Switch
          checked={product.active}
          disabled={isTogglePending}
          onCheckedChange={(checked) =>
            startToggleTransition(() =>
              toggleProductActiveAction(product.id, checked),
            )
          }
        />

        <AlertDialog>
          <AlertDialogTrigger
            render={
              <Button
                type="button"
                variant="outline"
                size="icon-sm"
                className="text-destructive"
                aria-label={`Excluir ${product.name}`}
                disabled={isDeletePending}
              />
            }
          >
            <Trash2 />
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir {product.name}?</AlertDialogTitle>
              <AlertDialogDescription>
                Essa ação não pode ser desfeita. O produto some do cardápio
                público imediatamente. Pedidos antigos que já incluíam esse
                item continuam intactos.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-white hover:bg-destructive/90"
                onClick={() =>
                  startDeleteTransition(() => deleteProductAction(product.id))
                }
              >
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  )
}

export function ProductTable({
  products,
  categories,
}: {
  products: Product[]
  categories: Category[]
}) {
  if (products.length === 0) {
    return (
      <p className="text-muted-foreground py-6 text-center text-sm">
        Nenhum produto cadastrado ainda.
      </p>
    )
  }

  const categoryById = new Map(categories.map((c) => [c.id, c]))
  const uncategorized: Product[] = []
  const grouped = new Map<string, Product[]>()

  for (const product of products) {
    if (!product.category_id || !categoryById.has(product.category_id)) {
      uncategorized.push(product)
      continue
    }
    const list = grouped.get(product.category_id) ?? []
    list.push(product)
    grouped.set(product.category_id, list)
  }

  return (
    <div className="space-y-6">
      {categories.map((category) => {
        const items = grouped.get(category.id)
        if (!items || items.length === 0) return null
        return (
          <div key={category.id}>
            <h3 className="mb-1 text-sm font-medium">{category.name}</h3>
            <div>
              {items.map((product) => (
                <ProductRow
                  key={product.id}
                  product={product}
                  categories={categories}
                />
              ))}
            </div>
          </div>
        )
      })}
      {uncategorized.length > 0 ? (
        <div>
          <h3 className="text-muted-foreground mb-1 text-sm font-medium">
            Sem categoria
          </h3>
          <div>
            {uncategorized.map((product) => (
              <ProductRow
                key={product.id}
                product={product}
                categories={categories}
              />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  )
}
