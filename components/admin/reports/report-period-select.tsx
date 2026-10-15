"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react"
import {
  REPORT_PERIOD_OPTIONS,
  type ReportPeriod,
} from "@/lib/utils/report-period"
import { addDays } from "@/lib/utils/store-date"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

/** The period lives in the URL so the page stays a server component and any
 * view (a given day, a custom range) can be reloaded or shared as a link. */
export function ReportPeriodSelect({
  period,
  fromKey,
  toKey,
  today,
}: {
  period: ReportPeriod
  fromKey: string
  toKey: string
  today: string
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [draftFrom, setDraftFrom] = useState(fromKey)
  const [draftTo, setDraftTo] = useState(toKey)
  const [syncedKeys, setSyncedKeys] = useState({ fromKey, toKey })

  // The URL is the source of truth: when it changes (preset picked, day
  // arrows), the custom-range inputs follow instead of showing stale dates.
  if (syncedKeys.fromKey !== fromKey || syncedKeys.toKey !== toKey) {
    setSyncedKeys({ fromKey, toKey })
    setDraftFrom(fromKey)
    setDraftTo(toKey)
  }

  function go(url: string) {
    startTransition(() => router.push(url))
  }

  function goToDay(day: string) {
    if (!day || day > today) return
    go(`/relatorios?period=day&date=${day}`)
  }

  function handlePeriodChange(value: ReportPeriod) {
    if (value === "day") return goToDay(toKey)
    if (value === "custom") {
      return go(`/relatorios?period=custom&from=${fromKey}&to=${toKey}`)
    }
    go(`/relatorios?period=${value}`)
  }

  const customValid =
    Boolean(draftFrom) && Boolean(draftTo) && draftFrom <= draftTo
  const customChanged = draftFrom !== fromKey || draftTo !== toKey

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select
        value={period}
        onValueChange={(value) => value && handlePeriodChange(value)}
        items={REPORT_PERIOD_OPTIONS}
      >
        <SelectTrigger className="w-48">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {REPORT_PERIOD_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {period === "day" ? (
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            aria-label="Dia anterior"
            onClick={() => goToDay(addDays(toKey, -1))}
          >
            <ChevronLeft />
          </Button>
          <Input
            type="date"
            value={toKey}
            max={today}
            aria-label="Dia do relatório"
            onChange={(e) => goToDay(e.target.value)}
            className="w-40"
          />
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            aria-label="Próximo dia"
            disabled={toKey >= today}
            onClick={() => goToDay(addDays(toKey, 1))}
          >
            <ChevronRight />
          </Button>
        </div>
      ) : null}

      {period === "custom" ? (
        <form
          className="flex flex-wrap items-center gap-2"
          onSubmit={(event) => {
            event.preventDefault()
            if (customValid) {
              go(`/relatorios?period=custom&from=${draftFrom}&to=${draftTo}`)
            }
          }}
        >
          <label className="text-muted-foreground flex items-center gap-1.5 text-sm">
            De
            <Input
              type="date"
              value={draftFrom}
              max={today}
              onChange={(e) => setDraftFrom(e.target.value)}
              className="w-40"
            />
          </label>
          <label className="text-muted-foreground flex items-center gap-1.5 text-sm">
            Até
            <Input
              type="date"
              value={draftTo}
              max={today}
              onChange={(e) => setDraftTo(e.target.value)}
              className="w-40"
            />
          </label>
          <Button
            type="submit"
            size="sm"
            disabled={!customValid || !customChanged}
          >
            Aplicar
          </Button>
        </form>
      ) : null}

      {isPending ? (
        <Loader2 className="text-muted-foreground size-4 animate-spin" />
      ) : null}
    </div>
  )
}
