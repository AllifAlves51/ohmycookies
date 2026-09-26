import type { LucideIcon } from "lucide-react"
import { ArrowDown, ArrowUp } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

export function StatCard({
  label,
  value,
  icon: Icon,
  deltaPct,
  deltaLabel = "vs. período anterior",
}: {
  label: string
  value: string
  icon: LucideIcon
  deltaPct?: number | null
  deltaLabel?: string
}) {
  return (
    <Card>
      <CardContent className="flex items-start justify-between p-4">
        <div>
          <p className="text-muted-foreground text-sm">{label}</p>
          <p className="mt-1 text-2xl font-semibold">{value}</p>
          {deltaPct !== undefined && deltaPct !== null ? (
            <p
              className={cn(
                "mt-1 flex items-center gap-0.5 text-xs font-medium",
                deltaPct >= 0 ? "text-green-600" : "text-destructive",
              )}
            >
              {deltaPct >= 0 ? (
                <ArrowUp className="size-3" />
              ) : (
                <ArrowDown className="size-3" />
              )}
              {Math.abs(deltaPct)}% {deltaLabel}
            </p>
          ) : null}
        </div>
        <div className="bg-secondary text-primary flex size-9 shrink-0 items-center justify-center rounded-full">
          <Icon className="size-4" />
        </div>
      </CardContent>
    </Card>
  )
}
