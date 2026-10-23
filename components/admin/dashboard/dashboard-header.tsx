import { PageHeader } from "@/components/admin/page-header"
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
    <PageHeader
      title={`Olá, ${name}`}
      description={summaryLine(dayKey, today)}
      actions={
        <>
          <DashboardDatePicker dayKey={dayKey} today={today} />
          <UserAvatar name={name} avatarUrl={avatarUrl} />
        </>
      }
    />
  )
}
