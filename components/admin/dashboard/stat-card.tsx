import type { LucideIcon } from "lucide-react"
import { ArrowDownRight, ArrowUpRight } from "lucide-react"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

export function StatCard({
  label,
  value,
  icon: Icon,
  deltaPct,
  deltaLabel = "vs. período anterior",
  note,
}: {
  label: string
  value: string
  icon: LucideIcon
  deltaPct?: number | null
  deltaLabel?: string
  note?: string
}) {
  const hasDelta = deltaPct !== undefined && deltaPct !== null

  return (
    <Card className="gap-0 py-0">
      <div className="flex flex-col gap-3 p-4 sm:p-5">
        <div className="flex items-center justify-between gap-2">
          <p className="text-muted-foreground text-[0.8rem] font-medium">
            {label}
          </p>
          <Icon className="text-muted-foreground/70 size-4 shrink-0" />
        </div>
        <p className="text-[1.6rem] leading-none font-semibold tracking-tight tabular-nums">
          {value}
        </p>
        {note || hasDelta ? (
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
            {hasDelta ? (
              <span
                className={cn(
                  "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 font-medium tabular-nums",
                  deltaPct >= 0
                    ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400"
                    : "bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-400",
                )}
              >
                {deltaPct >= 0 ? (
                  <ArrowUpRight className="size-3" />
                ) : (
                  <ArrowDownRight className="size-3" />
                )}
                {Math.abs(deltaPct)}%
              </span>
            ) : null}
            <span className="text-muted-foreground">
              {hasDelta ? deltaLabel : note}
            </span>
            {hasDelta && note ? (
              <span className="text-muted-foreground w-full">{note}</span>
            ) : null}
          </div>
        ) : null}
      </div>
    </Card>
  )
}
