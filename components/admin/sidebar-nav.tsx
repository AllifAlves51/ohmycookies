"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  ClipboardList,
  Package,
  Users,
  BarChart3,
  Bike,
  Tag,
  Settings,
  MessageCircle,
} from "lucide-react"
import { cn } from "@/lib/utils"

const NAV_GROUPS = [
  {
    label: "Operação",
    items: [
      { href: "/dashboard", label: "Início", icon: LayoutDashboard },
      { href: "/pedidos", label: "Pedidos", icon: ClipboardList },
      { href: "/clientes", label: "Clientes", icon: Users },
      { href: "/relatorios", label: "Relatórios", icon: BarChart3 },
    ],
  },
  {
    label: "Cardápio",
    items: [
      { href: "/produtos", label: "Produtos", icon: Package },
      { href: "/cupons", label: "Cupons", icon: Tag },
      { href: "/entrega", label: "Entrega", icon: Bike },
    ],
  },
  {
    label: "Loja",
    items: [
      { href: "/whatsapp", label: "WhatsApp", icon: MessageCircle },
      { href: "/configuracoes", label: "Configurações", icon: Settings },
    ],
  },
] as const

export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()

  return (
    <nav className="flex flex-col gap-5">
      {NAV_GROUPS.map((group) => (
        <div key={group.label} className="space-y-0.5">
          <p className="text-muted-foreground/80 px-2.5 pb-1 text-[0.68rem] font-semibold tracking-[0.08em] uppercase">
            {group.label}
          </p>
          {group.items.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(`${item.href}/`)
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "group relative flex h-8 items-center gap-2.5 rounded-md px-2.5 text-[0.84rem] font-medium transition-colors",
                  active
                    ? "bg-card text-foreground shadow-soft ring-foreground/[0.06] ring-1"
                    : "text-foreground/65 hover:bg-sidebar-accent hover:text-foreground",
                )}
              >
                <Icon
                  className={cn(
                    "size-4 shrink-0",
                    active
                      ? "text-primary"
                      : "text-foreground/45 group-hover:text-foreground/70",
                  )}
                />
                {item.label}
              </Link>
            )
          })}
        </div>
      ))}
    </nav>
  )
}
