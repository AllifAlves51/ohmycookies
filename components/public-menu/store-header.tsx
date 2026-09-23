import { AtSign, Share2, Globe } from "lucide-react"
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
          src={store.logo_url ?? "/placeholder-image.svg"}
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

      {store.instagram_url || store.facebook_url || store.website_url ? (
        <div className="mt-4 flex gap-3">
          {store.instagram_url ? (
            <a
              href={store.instagram_url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="flex size-8 items-center justify-center rounded-full bg-white/15"
            >
              <AtSign className="size-4" />
            </a>
          ) : null}
          {store.facebook_url ? (
            <a
              href={store.facebook_url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook"
              className="flex size-8 items-center justify-center rounded-full bg-white/15"
            >
              <Share2 className="size-4" />
            </a>
          ) : null}
          {store.website_url ? (
            <a
              href={store.website_url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Site"
              className="flex size-8 items-center justify-center rounded-full bg-white/15"
            >
              <Globe className="size-4" />
            </a>
          ) : null}
        </div>
      ) : null}
    </header>
  )
}
