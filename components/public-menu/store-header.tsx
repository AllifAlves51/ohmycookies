import type { Store } from "@/lib/services/store"
import { Badge } from "@/components/ui/badge"

export function StoreHeader({
  store,
  isOpen,
}: {
  store: Store
  isOpen: boolean
}) {
  return (
    <header className="bg-primary text-primary-foreground rounded-b-3xl px-5 pt-6 pb-8">
      <div className="flex items-center gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={store.logo_url ?? "/file.svg"}
          alt={store.name}
          className="size-16 shrink-0 rounded-full border-2 border-white/50 bg-white/10 object-cover"
        />
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-xl font-semibold">{store.name}</h1>
          <Badge
            className={
              isOpen
                ? "bg-white/20 text-white"
                : "bg-black/20 text-white/90"
            }
          >
            {isOpen ? "Aberto agora" : "Fechado no momento"}
          </Badge>
        </div>
      </div>
    </header>
  )
}
