"use client"

import { useState } from "react"
import { AtSign, Clock, MapPin, MessageCircle, Share2, Globe } from "lucide-react"
import type { Store } from "@/lib/services/store"
import { formatAddress } from "@/lib/utils/address"
import { WEEK_DAYS } from "@/lib/validations/store"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"

export function StoreInfoSheet({
  store,
  trigger,
}: {
  store: Store
  trigger: React.ReactNode
}) {
  const [open, setOpen] = useState(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      {trigger}
      <SheetContent side="left">
        <SheetHeader>
          <SheetTitle>{store.name}</SheetTitle>
        </SheetHeader>
        <div className="flex-1 space-y-5 overflow-y-auto px-4 pb-4">
          {store.whatsapp_number ? (
            <div className="flex items-start gap-3 text-sm">
              <MessageCircle className="text-primary mt-0.5 size-4 shrink-0" />
              <span>{store.whatsapp_number}</span>
            </div>
          ) : null}

          {store.address ? (
            <div className="flex items-start gap-3 text-sm">
              <MapPin className="text-primary mt-0.5 size-4 shrink-0" />
              <span>{formatAddress(store.address)}</span>
            </div>
          ) : null}

          {store.opening_hours ? (
            <div className="flex items-start gap-3 text-sm">
              <Clock className="text-primary mt-0.5 size-4 shrink-0" />
              <ul className="space-y-1">
                {WEEK_DAYS.map((day) => {
                  const hours = store.opening_hours?.[day.key]
                  return (
                    <li key={day.key} className="flex justify-between gap-4">
                      <span className="text-muted-foreground">
                        {day.label}
                      </span>
                      <span>
                        {hours?.open ? `${hours.from} - ${hours.to}` : "Fechado"}
                      </span>
                    </li>
                  )
                })}
              </ul>
            </div>
          ) : null}

          {store.instagram_url || store.facebook_url || store.website_url ? (
            <div className="flex gap-3 pt-2">
              {store.instagram_url ? (
                <Button
                  variant="outline"
                  size="icon-sm"
                  nativeButton={false}
                  render={
                    <a
                      href={store.instagram_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Instagram"
                    />
                  }
                >
                  <AtSign />
                </Button>
              ) : null}
              {store.facebook_url ? (
                <Button
                  variant="outline"
                  size="icon-sm"
                  nativeButton={false}
                  render={
                    <a
                      href={store.facebook_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Facebook"
                    />
                  }
                >
                  <Share2 />
                </Button>
              ) : null}
              {store.website_url ? (
                <Button
                  variant="outline"
                  size="icon-sm"
                  nativeButton={false}
                  render={
                    <a
                      href={store.website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Site"
                    />
                  }
                >
                  <Globe />
                </Button>
              ) : null}
            </div>
          ) : null}
        </div>
      </SheetContent>
    </Sheet>
  )
}
