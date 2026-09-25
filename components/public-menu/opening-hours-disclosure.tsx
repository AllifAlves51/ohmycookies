"use client"

import { useState } from "react"
import { ChevronDown } from "lucide-react"
import { WEEK_DAYS, type OpeningHoursInput } from "@/lib/validations/store"
import { cn } from "@/lib/utils"

export function OpeningHoursDisclosure({
  openingHours,
  isOpen,
}: {
  openingHours: OpeningHoursInput | null
  isOpen: boolean
}) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="bg-muted rounded-xl">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center justify-between px-3 py-2 text-sm"
      >
        <span className="flex items-center gap-1.5">
          <span
            className={cn(
              "size-2 rounded-full",
              isOpen ? "bg-green-500" : "bg-gray-400",
            )}
          />
          {isOpen ? "Aberto agora" : "Fechado no momento"}
        </span>
        <span className="text-primary flex items-center gap-1 text-xs font-medium">
          Ver horários
          <ChevronDown
            className={cn(
              "size-3.5 transition-transform",
              expanded && "rotate-180",
            )}
          />
        </span>
      </button>
      {expanded && openingHours ? (
        <ul className="space-y-1 border-t px-3 py-2 text-xs">
          {WEEK_DAYS.map((day) => {
            const hours = openingHours[day.key]
            return (
              <li key={day.key} className="flex justify-between">
                <span className="text-muted-foreground">{day.label}</span>
                <span>{hours.open ? `${hours.from} - ${hours.to}` : "Fechado"}</span>
              </li>
            )
          })}
        </ul>
      ) : null}
    </div>
  )
}
