"use client"

import { format, parseISO } from "date-fns"
import { ptBR } from "date-fns/locale"
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import type { RevenueByDay } from "@/lib/services/dashboard"
import { formatBRL } from "@/lib/utils/money"

function ChartTooltip({
  active,
  payload,
}: {
  active?: boolean
  payload?: { payload: RevenueByDay }[]
}) {
  if (!active || !payload?.[0]) return null
  const point = payload[0].payload

  return (
    <div className="bg-popover text-popover-foreground ring-foreground/10 rounded-lg px-3 py-2 text-sm shadow-md ring-1">
      <p className="text-muted-foreground text-xs">
        {format(parseISO(point.date), "dd 'de' MMMM", { locale: ptBR })}
      </p>
      <p className="font-semibold">{formatBRL(point.revenueCents)}</p>
    </div>
  )
}

export function RevenueChart({ data }: { data: RevenueByDay[] }) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
        >
          <CartesianGrid
            vertical={false}
            stroke="var(--border)"
            strokeDasharray="0"
          />
          <XAxis
            dataKey="date"
            tickFormatter={(value) => format(parseISO(value), "dd/MM")}
            tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
            axisLine={false}
            tickLine={false}
            minTickGap={24}
          />
          <YAxis
            tickFormatter={(value: number) => formatBRL(value)}
            tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
            axisLine={false}
            tickLine={false}
            width={72}
          />
          <Tooltip content={<ChartTooltip />} />
          <Area
            type="monotone"
            dataKey="revenueCents"
            stroke="var(--primary)"
            strokeWidth={2}
            fill="var(--primary)"
            fillOpacity={0.1}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
