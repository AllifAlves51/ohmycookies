"use client"

import { formatBRL, reaisToCents } from "@/lib/utils/money"
import { Input } from "@/components/ui/input"
import { Segmented } from "@/components/ui/segmented"

export type DiscountValue = { mode: "fixed" | "percent"; raw: string }

export const NO_DISCOUNT: DiscountValue = { mode: "fixed", raw: "" }

/** Cents a typed discount is worth against `baseCents` — a percentage is
 * taken from it and a fixed amount is capped at it. Kept outside the
 * component so the total follows when the base changes (items edited). */
export function discountToCents(value: DiscountValue, baseCents: number) {
  if (!value.raw.trim()) return 0
  const cents =
    value.mode === "fixed"
      ? reaisToCents(value.raw)
      : Math.round(
          (baseCents *
            Math.min(
              Math.max(Number.parseFloat(value.raw.replace(",", ".")) || 0, 0),
              100,
            )) /
            100,
        )
  return Math.min(Math.max(cents, 0), Math.max(baseCents, 0))
}

export function DiscountField({
  id,
  value,
  baseCents,
  onChange,
}: {
  id: string
  value: DiscountValue
  baseCents: number
  onChange: (value: DiscountValue) => void
}) {
  const cents = discountToCents(value, baseCents)

  return (
    <div className="space-y-1.5">
      <div className="flex gap-2">
        <Segmented
          size="sm"
          aria-label="Tipo de desconto"
          value={value.mode}
          onChange={(mode) => onChange({ mode, raw: "" })}
          options={[
            ["fixed", "R$"],
            ["percent", "%"],
          ]}
          className="w-24 shrink-0"
        />
        <Input
          id={id}
          inputMode="decimal"
          autoComplete="off"
          placeholder={value.mode === "fixed" ? "0,00" : "0"}
          value={value.raw}
          onChange={(e) =>
            onChange({
              mode: value.mode,
              raw: e.target.value.replace(/[^\d.,]/g, ""),
            })
          }
          className="h-9"
        />
      </div>
      {value.mode === "percent" && cents > 0 ? (
        <p className="text-muted-foreground text-xs">
          Equivale a {formatBRL(cents)}
        </p>
      ) : null}
    </div>
  )
}
