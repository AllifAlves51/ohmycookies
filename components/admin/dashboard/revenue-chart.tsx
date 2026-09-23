"use client"

import { useMemo, useState } from "react"
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import type { RevenueByDay } from "@/lib/services/dashboard"
import { formatBRL } from "@/lib/utils/money"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const WEEKDAY_SHORT = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"]

const PERIOD_OPTIONS = [
  { value: "7", label: "Últimos 7 dias" },
  { value: "14", label: "Últimos 14 dias" },
  { value: "30", label: "Últimos 30 dias" },
]

function formatDayLabel(iso: string, useWeekday: boolean) {
  const date = new Date(`${iso}T00:00:00`)
  if (useWeekday) return WEEKDAY_SHORT[date.getDay()]
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
        {formatDayLabel(point.date, false)}
      </p>
      <p className="font-semibold">{formatBRL(point.revenueCents)}</p>
    </div>
  )
}

export function RevenueChart({ data }: { data: RevenueByDay[] }) {
  const [period, setPeriod] = useState("7")
  const sliced = useMemo(
    () => data.slice(-Number(period)),
    [data, period],
  )
  const useWeekday = period === "7"

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle>Faturamento</CardTitle>
        <Select
          value={period}
          onValueChange={(value) => value && setPeriod(value)}
          items={PERIOD_OPTIONS}
        >
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PERIOD_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={sliced}
              margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
            >
              <CartesianGrid
                vertical={false}
                stroke="var(--border)"
                strokeDasharray="0"
              />
              <XAxis
                dataKey="date"
                tickFormatter={(value) => formatDayLabel(value, useWeekday)}
                tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
                axisLine={false}
                tickLine={false}
                minTickGap={16}
              />
              <YAxis
                tickFormatter={(value: number) => formatBRL(value)}
                tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
                axisLine={false}
                tickLine={false}
                width={72}
              />
              <Tooltip
                content={<ChartTooltip />}
                cursor={{ fill: "var(--muted)" }}
              />
              <Bar
                dataKey="revenueCents"
                fill="var(--primary)"
                radius={[6, 6, 0, 0]}
                maxBarSize={40}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
