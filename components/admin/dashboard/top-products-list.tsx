import Link from "next/link"
import type { TopProductRow } from "@/lib/services/dashboard"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export type TopProductWithImage = TopProductRow & { image_url: string | null }

export function TopProductsList({
  products,
}: {
  products: TopProductWithImage[]
}) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle>Produtos mais vendidos</CardTitle>
        <Link
          href="/produtos"
          className="text-primary text-sm font-medium hover:underline"
        >
          Ver todos
        </Link>
      </CardHeader>
      <CardContent>
        {products.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            Nenhuma venda registrada ainda.
          </p>
        ) : (
          <ul className="space-y-3">
            {products.map((product, index) => (
              <li
                key={product.product_id ?? product.product_name}
                className="flex items-center gap-3"
              >
                <span className="text-muted-foreground w-4 shrink-0 text-sm tabular-nums">
                  {index + 1}.
                </span>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={product.image_url ?? "/placeholder-image.svg"}
                  alt=""
                  className="bg-muted size-10 shrink-0 rounded-full object-cover"
                />
                <span className="min-w-0 flex-1 truncate text-sm font-medium">
                  {product.product_name}
                </span>
                <span className="text-sm font-semibold tabular-nums">
                  {product.quantity}
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
