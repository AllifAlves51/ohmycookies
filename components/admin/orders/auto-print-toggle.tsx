"use client"

import { Printer, PrinterCheck } from "lucide-react"
import { toast } from "sonner"
import { setAutoPrintEnabled, useAutoPrintEnabled } from "@/lib/auto-print"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

/** Quick on/off for automatic ticket printing on this computer; the full
 * setup (kiosk shortcut, test print) lives in Configurações. */
export function AutoPrintToggle() {
  const enabled = useAutoPrintEnabled()

  return (
    <Button
      type="button"
      variant="outline"
      size="lg"
      aria-pressed={enabled}
      title="Imprimir automaticamente os pedidos novos neste computador"
      onClick={() => {
        setAutoPrintEnabled(!enabled)
        toast.success(
          enabled
            ? "Impressão automática desligada"
            : "Impressão automática ligada neste computador",
        )
      }}
      className={cn(
        "bg-card",
        enabled &&
          "border-emerald-600/30 text-emerald-700 hover:text-emerald-800 dark:text-emerald-400",
      )}
    >
      {enabled ? <PrinterCheck /> : <Printer />}
      {enabled ? "Impressão automática" : "Imprimir automático"}
    </Button>
  )
}
