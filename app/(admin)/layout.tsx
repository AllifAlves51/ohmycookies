import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getStoreByOwnerId } from "@/lib/services/store"
import { SidebarNav } from "@/components/admin/sidebar-nav"
import { MobileNav } from "@/components/admin/mobile-nav"
import { LogoutButton } from "@/components/shared/logout-button"
import { NewOrderAlert } from "@/components/admin/new-order-alert"
import { ExternalLink } from "lucide-react"

export const metadata: Metadata = {
  title: "Painel",
  robots: { index: false, follow: false },
  manifest: "/painel.webmanifest",
}

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
    <div className="bg-background flex min-h-full">
      {store ? <NewOrderAlert storeId={store.id} /> : null}
      <aside className="bg-sidebar text-sidebar-foreground border-sidebar-border sticky top-0 hidden h-screen w-60 shrink-0 flex-col overflow-y-auto border-r md:flex">
        <div className="flex items-center gap-2.5 px-4 pt-5 pb-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={store?.logo_url ?? "/placeholder-image.svg"}
            alt=""
            className="bg-muted size-8 shrink-0 rounded-lg border object-cover"
          />
          <div className="min-w-0">
            <p className="truncate text-sm leading-tight font-semibold">
              {storeName}
            </p>
            <p className="text-muted-foreground text-xs">Painel da loja</p>
          </div>
        </div>
        <div className="flex-1 px-2.5">
          <SidebarNav />
        </div>
        <div className="border-sidebar-border mt-4 border-t p-2.5">
          {store ? (
            <a
              href={`/cardapio/${store.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground/65 hover:bg-sidebar-accent hover:text-foreground flex h-8 items-center gap-2.5 rounded-md px-2.5 text-[0.84rem] font-medium transition-colors"
            >
              <ExternalLink className="text-foreground/45 size-4" />
              Ver cardápio online
            </a>
          ) : null}
          <LogoutButton className="text-foreground/65 [&_svg]:text-foreground/45 h-8 w-full justify-start gap-2.5 px-2.5 text-[0.84rem]" />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="bg-card/90 sticky top-0 z-20 flex items-center justify-between border-b px-4 py-2.5 backdrop-blur md:hidden">
          <div className="flex min-w-0 items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={store?.logo_url ?? "/placeholder-image.svg"}
              alt=""
              className="bg-muted size-7 shrink-0 rounded-md border object-cover"
            />
            <span className="truncate text-sm font-semibold">{storeName}</span>
          </div>
          <MobileNav storeName={storeName} />
        </header>
        <div className="flex-1">{children}</div>
      </div>
    </div>
  )
}
