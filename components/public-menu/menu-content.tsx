"use client"

import { useState } from "react"
import { Search } from "lucide-react"
import type { Category, Product } from "@/lib/services/product"
import { ProductListItem } from "@/components/public-menu/product-list-item"
import { cn } from "@/lib/utils"

const ALL_TAB = "all"

export function MenuContent({
  categories,
  products,
}: {
  categories: Category[]
  products: Product[]
}) {
  const [tab, setTab] = useState(ALL_TAB)
  const [search, setSearch] = useState("")

  if (products.length === 0) {
    return (
      <p className="text-muted-foreground p-6 text-center text-sm">
        Cardápio em breve.
      </p>
    )
  }

  const categoriesWithProducts = categories.filter((category) =>
    products.some((product) => product.category_id === category.id),
  )

  const query = search.trim().toLowerCase()
  const filtered = products.filter((product) => {
    if (tab !== ALL_TAB && product.category_id !== tab) return false
    if (query && !product.name.toLowerCase().includes(query)) return false
    return true
  })

  return (
    <div>
      <div className="px-4 pt-4">
        <div className="relative">
          <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <input
            id="cardapio-search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Pesquisar..."
            className="border-input bg-card placeholder:text-muted-foreground w-full rounded-full border py-2.5 pr-4 pl-9 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          />
        </div>
      </div>

      <div className="bg-background/95 sticky top-0 z-10 mt-3 flex gap-2 overflow-x-auto px-4 py-3 backdrop-blur-sm">
        <button
          type="button"
          onClick={() => setTab(ALL_TAB)}
          className={cn(
            "shrink-0 rounded-full px-4 py-1.5 text-sm font-medium",
            tab === ALL_TAB
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground",
          )}
        >
          Todos
        </button>
        {categoriesWithProducts.map((category) => (
          <button
            key={category.id}
            type="button"
            onClick={() => setTab(category.id)}
            className={cn(
              "shrink-0 rounded-full px-4 py-1.5 text-sm font-medium",
              tab === category.id
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground",
            )}
          >
            {category.name}
          </button>
        ))}
      </div>

      <div className="px-4 pb-4">
        {filtered.length === 0 ? (
          <p className="text-muted-foreground py-8 text-center text-sm">
            Nenhum produto encontrado.
          </p>
        ) : (
          filtered.map((product) => (
            <ProductListItem key={product.id} product={product} />
          ))
        )}
      </div>
    </div>
  )
}
