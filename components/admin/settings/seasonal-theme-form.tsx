"use client"

import { useState, useTransition } from "react"
import {
  CalendarClock,
  Check,
  ExternalLink,
  Loader2,
  Minus,
} from "lucide-react"
import { toast } from "sonner"
import { updateSeasonalThemeAction } from "@/app/(admin)/configuracoes/actions"
import {
  SEASONS,
  seasonForDay,
  type SeasonalThemeSetting,
} from "@/lib/seasonal-themes"
import { cn } from "@/lib/utils"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

function Option({
  selected,
  onSelect,
  disabled,
  swatch,
  title,
  subtitle,
  children,
}: {
  selected: boolean
  onSelect: () => void
  disabled: boolean
  swatch: React.ReactNode
  title: string
  subtitle: string
  children?: React.ReactNode
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      disabled={disabled}
      onClick={onSelect}
      className={cn(
        "bg-card focus-visible:ring-ring/50 relative flex flex-col overflow-hidden rounded-xl border text-left transition-[border-color,box-shadow] outline-none focus-visible:ring-3 disabled:opacity-60",
        selected
          ? "border-primary ring-primary/15 ring-3"
          : "hover:border-foreground/20",
      )}
    >
      <span className="relative block h-16">{swatch}</span>
      <span className="block space-y-0.5 px-3 py-2.5">
        <span className="block text-sm font-medium">{title}</span>
        <span className="text-muted-foreground block text-xs">{subtitle}</span>
        {children}
      </span>
      {selected ? (
        <span className="bg-primary text-primary-foreground absolute top-2 right-2 flex size-5 items-center justify-center rounded-full">
          <Check className="size-3" />
        </span>
      ) : null}
    </button>
  )
}

export function SeasonalThemeForm({
  current,
  storeSlug,
  available,
}: {
  current: SeasonalThemeSetting
  storeSlug: string
  /** False until the migration that adds the column has been run. */
  available: boolean
}) {
  const [value, setValue] = useState<SeasonalThemeSetting>(current)
  const [isPending, startTransition] = useTransition()
  const activeNow = seasonForDay()
  const activeLabel = SEASONS.find((s) => s.id === activeNow)?.label

  function choose(next: SeasonalThemeSetting) {
    if (next === value) return
    const previous = value
    setValue(next)
    startTransition(async () => {
      const result = await updateSeasonalThemeAction(next)
      if (result.error) {
        setValue(previous)
        toast.error(result.error)
        return
      }
      toast.success("Tema do cardápio atualizado")
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Tema sazonal do cardápio
          {isPending ? (
            <Loader2 className="text-muted-foreground size-3.5 animate-spin" />
          ) : null}
        </CardTitle>
        <CardDescription>
          Cores e animações comemorativas no topo do cardápio online. O painel
          não muda.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!available ? (
          <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
            Rode a migração{" "}
            <code className="font-mono text-xs">
              20261023120000_security_hardening_and_themes.sql
            </code>{" "}
            no Supabase para liberar os temas.
          </p>
        ) : null}

        <div
          role="radiogroup"
          aria-label="Tema sazonal"
          className="grid grid-cols-2 gap-3 sm:grid-cols-4"
        >
          <Option
            selected={value === "none"}
            onSelect={() => choose("none")}
            disabled={!available || isPending}
            swatch={
              <span className="bg-muted text-muted-foreground flex size-full items-center justify-center">
                <Minus className="size-5" />
              </span>
            }
            title="Sem tema"
            subtitle="Visual padrão da loja"
          />
          <Option
            selected={value === "auto"}
            onSelect={() => choose("auto")}
            disabled={!available || isPending}
            swatch={
              <span className="flex size-full">
                {SEASONS.map((season) => (
                  <span
                    key={season.id}
                    className="h-full flex-1"
                    style={{ background: season.swatch }}
                  />
                ))}
                <CalendarClock className="absolute top-1/2 left-1/2 size-5 -translate-x-1/2 -translate-y-1/2 text-white drop-shadow" />
              </span>
            }
            title="Automático"
            subtitle={
              activeLabel ? `Agora: ${activeLabel}` : "Troca pelo calendário"
            }
          />
          {SEASONS.map((season) => (
            <Option
              key={season.id}
              selected={value === season.id}
              onSelect={() => choose(season.id)}
              disabled={!available || isPending}
              swatch={
                <span
                  className="block size-full"
                  style={{ background: season.swatch }}
                />
              }
              title={season.label}
              subtitle={season.window}
            />
          ))}
        </div>

        <div className="text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
          <span>Pré-visualizar:</span>
          {SEASONS.map((season) => (
            <a
              key={season.id}
              href={`/cardapio/${storeSlug}?tema=${season.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground inline-flex items-center gap-1 underline-offset-4 hover:underline"
            >
              {season.label}
              <ExternalLink className="size-3" />
            </a>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
