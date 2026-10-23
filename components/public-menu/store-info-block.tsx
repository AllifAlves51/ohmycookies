import { AtSign, CreditCard, Globe, MapPin, Share2, Wallet } from "lucide-react"
import { ACCEPTED_PAYMENTS_NOTE } from "@/lib/pix"
import type { Store, PublicStoreSettings } from "@/lib/services/store"
import { formatAddress } from "@/lib/utils/address"
import { formatBRL } from "@/lib/utils/money"
import { OpeningHoursDisclosure } from "@/components/public-menu/opening-hours-disclosure"

const SOCIAL_LINK =
  "text-muted-foreground hover:text-foreground hover:bg-muted flex size-8 items-center justify-center rounded-full border transition-colors"

export function StoreInfoBlock({
  store,
  settings,
  isOpen,
}: {
  store: Store
  settings: PublicStoreSettings | null
  isOpen: boolean
}) {
  const hasLinks =
    store.instagram_url || store.facebook_url || store.website_url

  return (
    <section className="bg-card shadow-raised relative z-10 mx-3 -mt-14 space-y-4 rounded-2xl border p-4 sm:mx-0">
      <div className="flex items-start gap-3.5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={store.logo_url ?? "/logo.webp"}
          alt={store.name}
          className="bg-muted ring-card size-[4.5rem] shrink-0 rounded-full border object-cover shadow-sm ring-4"
        />
        <div className="min-w-0 flex-1 space-y-1.5 pt-0.5">
          <h1 className="text-lg leading-tight font-semibold tracking-tight">
            {store.name}
          </h1>
          {store.address ? (
            <p className="text-muted-foreground flex items-start gap-1.5 text-xs leading-relaxed">
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
          <p className="text-muted-foreground flex items-start gap-1.5 text-xs leading-relaxed">
            <CreditCard className="mt-0.5 size-3.5 shrink-0" />
            {ACCEPTED_PAYMENTS_NOTE}
          </p>
        </div>
      </div>

      <OpeningHoursDisclosure
        openingHours={store.opening_hours}
        isOpen={isOpen}
      />

      {hasLinks ? (
        <div className="flex gap-2">
          {store.instagram_url ? (
            <a
              href={store.instagram_url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className={SOCIAL_LINK}
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
              className={SOCIAL_LINK}
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
              className={SOCIAL_LINK}
            >
              <Globe className="size-4" />
            </a>
          ) : null}
        </div>
      ) : null}
    </section>
  )
}
