"use client"

import { cn } from "cn"

/** Single-choice pill group (Retirada/Entrega, Pix/Dinheiro/Cartão…).
 * Renders as a radiogroup so it reads correctly to screen readers. */
export function Segmented<T extends string>({
  value,
  onChange,
  options,
  className,
  size = "default",
  "aria-label": ariaLabel,
}: {
  value: T
  onChange: (value: T) => void
  options: readonly (readonly [T, React.ReactNode])[]
  className?: string
  size?: "sm" | "default"
  "aria-label"?: string
}) {
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={cn(
        "bg-muted/70 grid auto-cols-fr grid-flow-col gap-1 rounded-lg p-1",
        className,
      )}
    >
      {options.map(([optionValue, label]) => {
        const selected = optionValue === value
        return (
          <button
            key={optionValue}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(optionValue)}
            className={cn(
              "focus-visible:ring-ring/50 inline-flex items-center justify-center gap-1.5 rounded-md font-medium whitespace-nowrap transition-[background-color,color,box-shadow] outline-none focus-visible:ring-3 [&_svg]:size-3.5 [&_svg]:shrink-0",
              size === "sm" ? "h-7 px-2 text-xs" : "h-8 px-3 text-sm",
              selected
                ? "bg-card text-foreground ring-foreground/5 shadow-xs ring-1"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {label}
          </button>
        )
      })}
    </div>
  )
}
