"use client"

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts"
import type { OrdersByStatusCounts } from "@/lib/services/report"

const ROWS: {
  key: keyof Omit<OrdersByStatusCounts, "total">
  label: string
  color: string
}[] = [
  { key: "completed", label: "Entregues", color: "#22c55e" },
  { key: "preparing", label: "Em preparo", color: "#60a5fa" },
  { key: "outForDelivery", label: "Saiu para entrega", color: "#fbbf24" },
  { key: "cancelled", label: "Cancelados", color: "#9ca3af" },
]

function ChartTooltip({
  active,
  payload,
}: {
  active?: boolean
  payload?: { payload: { label: string; value: number; percent: number } }[]
}) {
  if (!active || !payload?.[0]) return null
  const point = payload[0].payload

  return (
    <div className="bg-popover text-popover-foreground ring-foreground/10 rounded-lg px-3 py-2 text-sm shadow-md ring-1">
      <p className="font-semibold">{point.label}</p>
      <p className="text-muted-foreground text-xs">{point.percent}%</p>
    </div>
  )
}

export function OrdersByStatusChart({
  counts,
}: {
  counts: OrdersByStatusCounts
}) {
  if (counts.total === 0) {
    return (
      <p className="text-muted-foreground py-8 text-center text-sm">
        Nenhum pedido no período selecionado.
      </p>
    )
  }

  const data = ROWS.map((row) => ({
    ...row,
    value: counts[row.key],
    percent: Math.round((counts[row.key] / counts.total) * 100),
  }))

  return (
    <div className="flex items-center gap-4">
      <div className="relative h-48 w-48 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="label"
              innerRadius={55}
              outerRadius={80}
              paddingAngle={2}
            >
              {data.map((row) => (
                <Cell key={row.key} fill={row.color} />
              ))}
            </Pie>
            <Tooltip content={<ChartTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-bold">{counts.total}</span>
          <span className="text-muted-foreground text-xs">pedidos</span>
        </div>
      </div>
      <ul className="space-y-2 text-sm">
        {data.map((row) => (
          <li key={row.key} className="flex items-center gap-2">
            <span
              className="size-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: row.color }}
            />
            <span className="font-medium">{row.label}</span>
            <span className="text-muted-foreground ml-auto tabular-nums">
              {row.percent}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
