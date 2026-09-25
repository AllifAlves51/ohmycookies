import { AtSign, Globe, MapPin, Share2, Wallet } from "lucide-react"
import type { Store, StoreSettings } from "@/lib/services/store"
import { formatAddress } from "@/lib/utils/address"
import { formatBRL } from "@/lib/utils/money"
import { OpeningHoursDisclosure } from "@/components/public-menu/opening-hours-disclosure"

export function StoreInfoBlock({
  store,
  settings,
  isOpen,
}: {
  store: Store
  settings: StoreSettings | null
  isOpen: boolean
}) {
  return (
    <div className="space-y-3 px-4 pt-4">
      <div className="flex items-center gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={store.logo_url ?? "/logo.webp"}
          alt={store.name}
          className="bg-muted size-16 shrink-0 rounded-full border object-cover"
        />
        <div className="min-w-0 flex-1 space-y-1">
          <h1 className="text-lg font-semibold">{store.name}</h1>
          {store.address ? (
            <p className="text-muted-foreground flex items-start gap-1.5 text-xs">
              <MapPin className="mt-0.5 size-3.5 shrink-0" />
              {formatAddress(store.address)}
            </p>
          ) : null}
          <p className="text-muted-foreground flex items-center gap-1.5 text-xs">
            <Wallet className="size-3.5 shrink-0" />
            {settings && settings.min_order_cents > 0
              ? `Pedido mínimo: ${formatBRL(settings.min_order_cents)}`
              : "Sem pedido mínimo"}
          </p>
        </div>
      </div>
      <OpeningHoursDisclosure openingHours={store.opening_hours} isOpen={isOpen} />
      {store.instagram_url || store.facebook_url || store.website_url ? (
        <div className="flex gap-2">
          {store.instagram_url ? (
            <a
              href={store.instagram_url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="bg-muted flex size-8 items-center justify-center rounded-full"
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
              className="bg-muted flex size-8 items-center justify-center rounded-full"
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
              className="bg-muted flex size-8 items-center justify-center rounded-full"
            >
              <Globe className="size-4" />
            </a>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
