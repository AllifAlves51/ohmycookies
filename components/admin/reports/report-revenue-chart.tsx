"use client"

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import type { RevenueByDay } from "@/lib/services/report"
import { formatBRL } from "@/lib/utils/money"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

function formatDayLabel(iso: string) {
  const date = new Date(`${iso}T00:00:00`)
  return `${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}`
}

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
        {formatDayLabel(point.date)}
      </p>
      <p className="font-semibold">{formatBRL(point.revenueCents)}</p>
    </div>
  )
}

export function ReportRevenueChart({ data }: { data: RevenueByDay[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Faturamento por dia</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="reportRevenueFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                vertical={false}
                stroke="var(--border)"
                strokeDasharray="0"
              />
              <XAxis
                dataKey="date"
                tickFormatter={formatDayLabel}
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
                fill="url(#reportRevenueFill)"
                dot={{ r: 3, fill: "var(--primary)", strokeWidth: 0 }}
                activeDot={{ r: 5 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
