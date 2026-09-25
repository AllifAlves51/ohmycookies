"use client"

import { useState } from "react"
import type { Category, Product } from "@/lib/services/product"
import { ProductCard } from "@/components/public-menu/product-card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"

const ALL_TAB = "all"

export function MenuContent({
  categories,
  products,
}: {
  categories: Category[]
  products: Product[]
}) {
  const [tab, setTab] = useState(ALL_TAB)

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

  return (
    <Tabs value={tab} onValueChange={setTab} className="w-full gap-0">
      <TabsList className="bg-background/95 sticky top-14 z-10 w-full justify-start overflow-x-auto backdrop-blur-sm">
        <TabsTrigger
          value={ALL_TAB}
          className="data-active:bg-primary data-active:text-primary-foreground"
        >
          Todos
        </TabsTrigger>
        {categoriesWithProducts.map((category) => (
          <TabsTrigger
            key={category.id}
            value={category.id}
            className="data-active:bg-primary data-active:text-primary-foreground"
          >
            {category.name}
          </TabsTrigger>
        ))}
      </TabsList>

      <TabsContent value={ALL_TAB} className="grid grid-cols-2 gap-3 px-4 pt-4">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </TabsContent>

      {categoriesWithProducts.map((category) => (
        <TabsContent
          key={category.id}
          value={category.id}
          className="grid grid-cols-2 gap-3 px-4 pt-4"
        >
          {products
            .filter((product) => product.category_id === category.id)
            .map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
        </TabsContent>
      ))}
    </Tabs>
  )
}
