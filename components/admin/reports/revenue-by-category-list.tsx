import type { RevenueByCategoryRow } from "@/lib/services/report"

export function RevenueByCategoryList({
  data,
}: {
  data: RevenueByCategoryRow[]
}) {
  if (data.length === 0) {
    return (
      <p className="text-muted-foreground py-8 text-center text-sm">
        Nenhuma venda no período selecionado.
      </p>
    )
  }

  const total = data.reduce((sum, row) => sum + row.revenueCents, 0)

  return (
    <ul className="space-y-3">
      {data.map((row) => {
        const percent = total > 0 ? Math.round((row.revenueCents / total) * 100) : 0
        return (
          <li key={row.category} className="flex items-center gap-3 text-sm">
            <span className="w-24 shrink-0 truncate font-medium">
              {row.category}
            </span>
            <div className="bg-secondary h-2 flex-1 overflow-hidden rounded-full">
              <div
                className="bg-primary h-full rounded-full"
                style={{ width: `${percent}%` }}
              />
            </div>
            <span className="text-muted-foreground w-10 shrink-0 text-right tabular-nums">
              {percent}%
            </span>
          </li>
        )
      })}
    </ul>
  )
}
