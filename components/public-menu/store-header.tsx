import type { Store } from "@/lib/services/store"
import type { SeasonId } from "@/lib/seasonal-themes"
import { SeasonHeroDecor } from "@/components/public-menu/seasonal/season-decor"

/** Full-width band above the store card: the seasonal scene when a theme
 * is active, otherwise the store's cover photo (or a quiet brand wash). */
export function StoreHeader({
  store,
  season,
}: {
  store: Store
  season: SeasonId | null
}) {
  if (season) {
    return (
      <div
        className="relative h-48 w-full overflow-hidden sm:h-56"
        style={{ background: "var(--season-hero)" }}
      >
        <SeasonHeroDecor season={season} />
      </div>
    )
  }

  if (store.login_photo_url) {
    return (
      <div className="bg-muted relative h-48 w-full overflow-hidden sm:h-64">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={store.login_photo_url}
          alt=""
          className="size-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/25" />
      </div>
    )
  }

  return (
    <div className="h-32 w-full bg-[radial-gradient(120%_100%_at_80%_0%,color-mix(in_oklab,var(--primary)_35%,transparent),transparent_60%),linear-gradient(180deg,color-mix(in_oklab,var(--primary)_12%,var(--background)),var(--background))]" />
  )
}
