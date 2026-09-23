import type { TopProductRow } from "@/lib/services/dashboard"

export function TopProductsList({ products }: { products: TopProductRow[] }) {
  if (products.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        Nenhuma venda registrada ainda.
      </p>
    )
  }

  return (
    <ul className="space-y-2">
      {products.map((product, index) => (
        <li
          key={product.product_name}
          className="flex items-center justify-between text-sm"
        >
          <span className="flex items-center gap-2">
            <span className="text-muted-foreground w-4 text-right tabular-nums">
              {index + 1}
            </span>
            {product.product_name}
          </span>
          <span className="text-muted-foreground tabular-nums">
            {product.quantity} un.
          </span>
        </li>
      ))}
    </ul>
  )
}
