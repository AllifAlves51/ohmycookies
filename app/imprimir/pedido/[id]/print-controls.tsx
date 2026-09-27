"use client"

import { useEffect, useState } from "react"
import { Printer, X } from "lucide-react"

type Width = "80mm" | "58mm"
const STORAGE_KEY = "ohmycookies:print-width"

/** CSS variables don't work inside @page, so the paper size rule is
 * written directly whenever the width changes. */
function applyWidth(width: Width) {
  document.documentElement.style.setProperty("--ticket-width", width)
  let style = document.getElementById("ticket-page-size")
  if (!style) {
    style = document.createElement("style")
    style.id = "ticket-page-size"
    document.head.appendChild(style)
  }
  style.textContent = `@media print { @page { size: ${width} auto; margin: 0; } }`
}

function readWidth(): Width {
  try {
    return localStorage.getItem(STORAGE_KEY) === "58mm" ? "58mm" : "80mm"
  } catch {
    return "80mm"
  }
}

/** Screen-only toolbar: paper width (remembered per computer), print and
 * close. Opens the print dialog automatically once the ticket is ready. */
export function PrintControls() {
  const [width, setWidth] = useState<Width>("80mm")

  useEffect(() => {
    const saved = readWidth()
    applyWidth(saved)
    // eslint-disable-next-line react-hooks/set-state-in-effect -- syncs the toggle with the width saved on this computer (not readable during SSR).
    setWidth(saved)
    const timer = setTimeout(() => window.print(), 300)
    return () => clearTimeout(timer)
  }, [])

  function choose(next: Width) {
    setWidth(next)
    applyWidth(next)
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      // Not remembering the choice is fine.
    }
  }

  return (
    <div className="no-print flex flex-wrap items-center justify-center gap-2 text-sm">
      <div className="flex rounded-lg border bg-white p-0.5">
        {(["80mm", "58mm"] as const).map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => choose(option)}
            className={
              width === option
                ? "bg-primary text-primary-foreground rounded-md px-3 py-1.5 font-medium"
                : "text-muted-foreground rounded-md px-3 py-1.5"
            }
          >
            Bobina {option}
          </button>
        ))}
      </div>
      <button
        type="button"
        onClick={() => window.print()}
        className="bg-primary text-primary-foreground flex items-center gap-1.5 rounded-lg px-4 py-2 font-medium"
      >
        <Printer className="size-4" />
        Imprimir
      </button>
      <button
        type="button"
        onClick={() => window.close()}
        className="flex items-center gap-1.5 rounded-lg border bg-white px-3 py-2"
      >
        <X className="size-4" />
        Fechar
      </button>
    </div>
  )
}
