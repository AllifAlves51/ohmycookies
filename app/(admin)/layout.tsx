import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getStoreByOwnerId } from "@/lib/services/store"
import { SidebarNav } from "@/components/admin/sidebar-nav"
import { MobileNav } from "@/components/admin/mobile-nav"
import { LogoutButton } from "@/components/shared/logout-button"

export default async function AdminLayout({ children }: LayoutProps<"/">) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const { data: store } = await getStoreByOwnerId(supabase, user.id)
  const storeName = store?.name ?? "Minha loja"

  return (
    <div className="flex min-h-full">
      <aside className="bg-sidebar text-sidebar-foreground hidden w-64 shrink-0 flex-col border-r p-4 md:flex">
        <div className="mb-6 flex items-center gap-2 px-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={store?.logo_url ?? "/placeholder-image.svg"}
            alt={storeName}
            className="bg-muted size-9 shrink-0 rounded-full object-cover"
          />
          <span className="truncate font-semibold">{storeName}</span>
        </div>
        <SidebarNav />
        <div className="mt-auto pt-4">
          <LogoutButton className="w-full justify-start" />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="bg-card flex items-center justify-between border-b px-4 py-3 md:hidden">
          <span className="font-semibold">{storeName}</span>
          <MobileNav storeName={storeName} />
        </header>
        <div className="flex-1">{children}</div>
      </div>
    </div>
  )
}
