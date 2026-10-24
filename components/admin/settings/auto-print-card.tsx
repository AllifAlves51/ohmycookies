"use client"

import { useState, useSyncExternalStore } from "react"
import { Check, Copy, Printer } from "lucide-react"
import { toast } from "sonner"
import {
  autoPrintOrder,
  setAutoPrintEnabled,
  useAutoPrintEnabled,
} from "@/lib/auto-print"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

const noopSubscribe = () => () => {}

const CHROME_PATH = `"C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"`

export function AutoPrintCard({
  latestOrderId,
}: {
  /** Used by "Imprimir teste" — the most recent order of the store. */
  latestOrderId: string | null
}) {
  const enabled = useAutoPrintEnabled()
  const [copied, setCopied] = useState(false)

  // Read after hydration so the server render (no window) doesn't mismatch.
  const origin = useSyncExternalStore(
    noopSubscribe,
    () => window.location.origin,
    () => "",
  )
  const shortcut = `${CHROME_PATH} --kiosk-printing --app=${origin}/pedidos`

  function copyShortcut() {
    navigator.clipboard.writeText(shortcut).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Impressão automática</CardTitle>
        <CardDescription>
          Imprime o cupom assim que um pedido novo chega. Vale só para este
          computador — ligue apenas no que fica ao lado da impressora.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="flex items-center justify-between gap-4 rounded-lg border p-3">
          <div className="space-y-0.5">
            <Label htmlFor="autoPrint">Imprimir pedidos novos</Label>
            <p className="text-muted-foreground text-xs">
              {enabled
                ? "Ligado neste computador. O painel precisa ficar aberto."
                : "Desligado neste computador."}
            </p>
          </div>
          <Switch
            id="autoPrint"
            checked={enabled}
            onCheckedChange={(checked) => {
              setAutoPrintEnabled(checked)
              toast.success(
                checked
                  ? "Impressão automática ligada neste computador"
                  : "Impressão automática desligada",
              )
            }}
          />
        </div>

        <div className="space-y-2 text-sm">
          <p className="font-medium">Para imprimir sem nenhum clique</p>
          <p className="text-muted-foreground text-xs leading-relaxed">
            Por segurança, o navegador sempre mostra a janela de impressão. Para
            ela ir direto para a impressora: defina a impressora térmica como{" "}
            <strong className="text-foreground font-medium">
              impressora padrão do Windows
            </strong>
            , feche todas as janelas do Chrome e abra o painel por um atalho com
            este destino:
          </p>
          <div className="bg-muted flex items-start gap-2 rounded-md p-2">
            <code className="min-w-0 flex-1 font-mono text-[0.7rem] leading-relaxed break-all">
              {shortcut}
            </code>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label="Copiar"
              onClick={copyShortcut}
            >
              {copied ? <Check /> : <Copy />}
            </Button>
          </div>
          <p className="text-muted-foreground text-xs leading-relaxed">
            Área de trabalho → botão direito → Novo → Atalho → cole o texto
            acima. Abra o painel sempre por esse atalho.
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          disabled={!latestOrderId}
          onClick={() => {
            if (latestOrderId) {
              autoPrintOrder(latestOrderId, { force: true })
              toast("Enviando o último pedido para a impressora…")
            }
          }}
        >
          <Printer />
          Imprimir teste (último pedido)
        </Button>
      </CardContent>
    </Card>
  )
}
