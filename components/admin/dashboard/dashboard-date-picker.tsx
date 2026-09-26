"use client"

import { useRef, useTransition } from "react"
import { useRouter } from "next/navigation"
import { CalendarDays, ChevronLeft, ChevronRight, Loader2 } from "lucide-react"
import { addDays, formatDayKeyLong } from "@/lib/utils/store-date"
import { cn } from "@/lib/utils"

function labelFor(dayKey: string, today: string) {
  const long = formatDayKeyLong(dayKey)
  if (dayKey === today) return `Hoje, ${long}`
  if (dayKey === addDays(today, -1)) return `Ontem, ${long}`
  return long
}

/** Picks which day the dashboard summarizes. The day lives in the URL
 * (?data=YYYY-MM-DD) so the page stays a server component and the view
 * survives reloads/links. */
export function DashboardDatePicker({
  dayKey,
  today,
}: {
  dayKey: string
  today: string
}) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [isPending, startTransition] = useTransition()

  function goTo(key: string) {
    if (!key || key > today) return
    startTransition(() => {
      router.push(key === today ? "/dashboard" : `/dashboard?data=${key}`)
    })
  }

  function openCalendar() {
    const input = inputRef.current
    if (!input) return
    try {
      input.showPicker()
    } catch {
      input.focus()
    }
  }

  const isToday = dayKey === today

  return (
    <div className="bg-card flex items-center rounded-xl border text-sm">
      <button
        type="button"
        onClick={() => goTo(addDays(dayKey, -1))}
        className="text-muted-foreground hover:text-foreground rounded-l-xl px-2.5 py-2"
        aria-label="Dia anterior"
      >
        <ChevronLeft className="size-4" />
      </button>

      <button
        type="button"
        onClick={openCalendar}
        className="relative flex items-center gap-2 border-x px-3 py-2"
      >
        {isPending ? (
          <Loader2 className="text-muted-foreground size-4 animate-spin" />
        ) : (
          <CalendarDays className="text-muted-foreground size-4" />
        )}
        <span>{labelFor(dayKey, today)}</span>
        {/* Invisible native date input: gives a real calendar on every
            platform, anchored under the button. */}
        <input
          ref={inputRef}
          type="date"
          value={dayKey}
          max={today}
          onChange={(e) => goTo(e.target.value)}
          tabIndex={-1}
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-0"
        />
      </button>

      <button
        type="button"
        onClick={() => goTo(addDays(dayKey, 1))}
        disabled={isToday}
        className={cn(
          "text-muted-foreground hover:text-foreground rounded-r-xl px-2.5 py-2",
          isToday && "pointer-events-none opacity-30",
        )}
        aria-label="Próximo dia"
      >
        <ChevronRight className="size-4" />
      </button>

      {!isToday ? (
        <button
          type="button"
          onClick={() => goTo(today)}
          className="text-primary border-l px-3 py-2 font-medium"
        >
          Hoje
        </button>
      ) : null}
    </div>
  )
}
