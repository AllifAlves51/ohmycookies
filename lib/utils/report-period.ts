export type ReportPeriod = "today" | "7d" | "30d" | "month"

export const REPORT_PERIODS: { value: ReportPeriod; label: string }[] = [
  { value: "today", label: "Hoje" },
  { value: "7d", label: "Últimos 7 dias" },
  { value: "30d", label: "Últimos 30 dias" },
  { value: "month", label: "Este mês" },
]

export function isReportPeriod(
  value: string | string[] | undefined,
): value is ReportPeriod {
  return (
    value === "today" || value === "7d" || value === "30d" || value === "month"
  )
}

export function getReportDateRange(period: ReportPeriod): {
  from: Date
  to: Date
} {
  const to = new Date()
  const from = new Date()

  switch (period) {
    case "today":
      from.setHours(0, 0, 0, 0)
      break
    case "7d":
      from.setDate(from.getDate() - 6)
      from.setHours(0, 0, 0, 0)
      break
    case "30d":
      from.setDate(from.getDate() - 29)
      from.setHours(0, 0, 0, 0)
      break
    case "month":
      from.setDate(1)
      from.setHours(0, 0, 0, 0)
      break
  }

  return { from, to }
}
