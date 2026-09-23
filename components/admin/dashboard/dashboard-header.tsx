import { ChevronDown } from "lucide-react"

const MONTH_LONG = [
  "janeiro",
  "fevereiro",
  "março",
  "abril",
  "maio",
  "junho",
  "julho",
  "agosto",
  "setembro",
  "outubro",
  "novembro",
  "dezembro",
]

function formatTodayLabel(date: Date) {
  return `Hoje, ${date.getDate()} de ${MONTH_LONG[date.getMonth()]} de ${date.getFullYear()}`
}

export function DashboardHeader({ name }: { name: string }) {
  const today = new Date()

  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold">Olá, {name}!</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Aqui está o resumo da sua loja hoje.
        </p>
      </div>
      <div className="flex items-center gap-3">
        <div className="bg-card text-foreground flex items-center gap-2 rounded-xl border px-4 py-2 text-sm">
          <span>{formatTodayLabel(today)}</span>
          <ChevronDown className="text-muted-foreground size-4" />
        </div>
        <div
          className="bg-primary text-primary-foreground flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold"
          aria-hidden="true"
          title={name}
        >
          {name.charAt(0).toUpperCase()}
        </div>
      </div>
    </div>
  )
}
