"use client"

import { useState } from "react"
import { Menu } from "lucide-react"
import { SidebarNav } from "@/components/admin/sidebar-nav"
import { LogoutButton } from "@/components/shared/logout-button"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

export function MobileNav({ storeName }: { storeName: string }) {
  const [open, setOpen] = useState(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <Button variant="ghost" size="icon-sm" aria-label="Abrir menu" />
        }
      >
        <Menu />
      </SheetTrigger>
      <SheetContent side="left" className="w-64">
        <SheetHeader>
          <SheetTitle>{storeName}</SheetTitle>
        </SheetHeader>
        <div className="flex flex-1 flex-col justify-between px-4 pb-4">
          <SidebarNav onNavigate={() => setOpen(false)} />
          <LogoutButton className="w-full justify-start" />
        </div>
      </SheetContent>
    </Sheet>
  )
}
