import type { Store } from "@/lib/services/store"

export function StoreHeader({ store }: { store: Store }) {
  if (!store.login_photo_url) return null

  return (
    <div className="bg-muted aspect-[16/9] w-full overflow-hidden">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={store.login_photo_url}
        alt=""
        className="size-full object-cover"
      />
    </div>
  )
}
