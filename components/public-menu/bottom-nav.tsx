"use client"

import { BookOpen, ClipboardList, Search } from "lucide-react"
import { useCart } from "@/components/public-menu/cart-context"

function focusSearch() {
  const input = document.getElementById("cardapio-search")
  input?.scrollIntoView({ behavior: "smooth", block: "center" })
  ;(input as HTMLInputElement | null)?.focus()
}

export function BottomNav() {
  const { openHistory } = useCart()

  return (
    <nav className="bg-background/95 fixed inset-x-0 bottom-0 z-30 mx-auto flex max-w-md items-center justify-around border-t py-2 backdrop-blur-sm">
      <button
        type="button"
        onClick={() =>
          window.scrollTo({ top: 0, behavior: "smooth" })
        }
        className="text-primary flex flex-col items-center gap-0.5 text-xs font-medium"
      >
        <BookOpen className="size-5" />
        Itens
      </button>
      <button
        type="button"
        onClick={focusSearch}
        className="text-muted-foreground flex flex-col items-center gap-0.5 text-xs"
      >
        <Search className="size-5" />
        Pesquisar
      </button>
      <button
        type="button"
        onClick={openHistory}
        className="text-muted-foreground flex flex-col items-center gap-0.5 text-xs"
      >
        <ClipboardList className="size-5" />
        Pedidos
      </button>
    </nav>
  )
}
