"use client"

import { useState } from "react"
import { Check, Copy } from "lucide-react"
import { PIX_KEY, PIX_KEY_TYPE, PIX_RECIPIENT_NAME } from "@/lib/pix"
import { cn } from "@/lib/utils"

export function PixInfo({ className }: { className?: string }) {
  const [copied, setCopied] = useState(false)

  function handleCopy() {
    navigator.clipboard.writeText(PIX_KEY).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div
      className={cn(
        "bg-secondary space-y-2 rounded-xl p-3 text-left text-sm",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-muted-foreground text-xs">
            Chave Pix ({PIX_KEY_TYPE})
          </p>
          <p className="font-semibold tracking-wide">{PIX_KEY}</p>
        </div>
        <button
          type="button"
          onClick={handleCopy}
          className="bg-background text-primary flex shrink-0 items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-medium"
        >
          {copied ? (
            <Check className="size-3.5" />
          ) : (
            <Copy className="size-3.5" />
          )}
          {copied ? "Copiado!" : "Copiar"}
        </button>
      </div>
      <div>
        <p className="text-muted-foreground text-xs">Destinatário</p>
        <p className="font-medium">{PIX_RECIPIENT_NAME}</p>
      </div>
      <p className="text-muted-foreground text-xs">
        Após o pagamento, envie o comprovante pelo WhatsApp.
      </p>
    </div>
  )
}
