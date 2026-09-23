"use client"

import { useRouter } from "next/navigation"
import {
  REPORT_PERIODS,
  type ReportPeriod,
} from "@/lib/utils/report-period"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export function ReportPeriodSelect({ period }: { period: ReportPeriod }) {
  const router = useRouter()

  return (
    <Select
      value={period}
      onValueChange={(value) => value && router.push(`/relatorios?period=${value}`)}
      items={REPORT_PERIODS}
    >
      <SelectTrigger className="w-48">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {REPORT_PERIODS.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
