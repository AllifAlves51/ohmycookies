"use client"

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts"
import {
  PAYMENT_PREFERENCE_LABEL,
  type PaymentPreference,
} from "@/lib/services/order"
import type { PaymentBreakdownRow } from "@/lib/services/report"

const COLORS: Record<PaymentPreference, string> = {
  pix: "var(--primary)",
  cash: "var(--secondary-foreground)",
  card: "#f0a8b4",
}

function ChartTooltip({
  active,
  payload,
}: {
  active?: boolean
  payload?: { payload: PaymentBreakdownRow }[]
}) {
  if (!active || !payload?.[0]) return null
  const point = payload[0].payload

  return (
    <div className="bg-popover text-popover-foreground ring-foreground/10 rounded-lg px-3 py-2 text-sm shadow-md ring-1">
      <p className="font-semibold">{PAYMENT_PREFERENCE_LABEL[point.method]}</p>
      <p className="text-muted-foreground text-xs">
        {point.count} {point.count === 1 ? "pedido" : "pedidos"}
      </p>
    </div>
  )
}

export function PaymentBreakdownChart({
  data,
}: {
  data: PaymentBreakdownRow[]
}) {
  if (data.length === 0) {
    return (
      <p className="text-muted-foreground py-8 text-center text-sm">
        Nenhum pedido com forma de pagamento registrada no período.
      </p>
    )
  }

  return (
    <div className="flex items-center gap-4">
      <div className="h-48 w-48 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="count"
              nameKey="method"
              innerRadius={50}
              outerRadius={80}
              paddingAngle={2}
            >
              {data.map((row) => (
                <Cell key={row.method} fill={COLORS[row.method]} />
              ))}
            </Pie>
            <Tooltip content={<ChartTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <ul className="space-y-2 text-sm">
        {data.map((row) => (
          <li key={row.method} className="flex items-center gap-2">
            <span
              className="size-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: COLORS[row.method] }}
            />
            <span className="font-medium">
              {PAYMENT_PREFERENCE_LABEL[row.method]}
            </span>
            <span className="text-muted-foreground">{row.count}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
