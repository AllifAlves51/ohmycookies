import { UserAvatar } from "@/components/admin/user-avatar"
import { DashboardDatePicker } from "@/components/admin/dashboard/dashboard-date-picker"
import { addDays, formatDayKeyLong } from "@/lib/utils/store-date"

function summaryLine(dayKey: string, today: string) {
  if (dayKey === today) return "Aqui está o resumo da sua loja hoje."
  if (dayKey === addDays(today, -1))
    return "Aqui está o resumo da sua loja ontem."
  return `Aqui está o resumo da sua loja em ${formatDayKeyLong(dayKey)}.`
}

export function DashboardHeader({
  name,
  avatarUrl,
  dayKey,
  today,
}: {
  name: string
  avatarUrl: string | null
  dayKey: string
  today: string
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold">Olá, {name}!</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          {summaryLine(dayKey, today)}
        </p>
      </div>
      <div className="flex items-center gap-3">
        <DashboardDatePicker dayKey={dayKey} today={today} />
        <UserAvatar name={name} avatarUrl={avatarUrl} />
      </div>
    </div>
  )
}
