"use client"

import { useEffect, useState, useTransition } from "react"
import { CheckCircle2, Loader2, QrCode, Smartphone, Unplug } from "lucide-react"
import { toast } from "sonner"
import {
  connectWhatsappAction,
  disconnectWhatsappAction,
  getWhatsappStatusAction,
  saveBotSettingsAction,
  type WhatsappStatus,
} from "@/app/(admin)/whatsapp/actions"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

const POLL_MS = 3000
// WhatsApp rotates the QR roughly every 20–40s; fetch a fresh one.
const QR_REFRESH_MS = 30000

function asImageSrc(base64: string) {
  return base64.startsWith("data:") ? base64 : `data:image/png;base64,${base64}`
}

export function WhatsappConnectionCard({
  initialStatus,
  storeWhatsapp,
  initialSettings,
}: {
  initialStatus: WhatsappStatus
  storeWhatsapp: string | null
  initialSettings: {
    greetingIntervalMinutes: number
    alertNumber: string
    alertsEnabled: boolean
  }
}) {
  const [status, setStatus] = useState(initialStatus)
  const [qr, setQr] = useState<{
    base64: string | null
    pairingCode: string | null
  } | null>(null)
  const [isConnecting, startConnecting] = useTransition()
  const [isSaving, startSaving] = useTransition()
  const [interval, setIntervalMinutes] = useState(
    String(initialSettings.greetingIntervalMinutes),
  )
  const [alertNumber, setAlertNumber] = useState(initialSettings.alertNumber)
  const [alertsEnabled, setAlertsEnabled] = useState(
    initialSettings.alertsEnabled,
  )

  const connected = status.state === "open"
  const configured = status.state !== "unconfigured"

  function requestQr() {
    startConnecting(async () => {
      const result = await connectWhatsappAction()
      if ("error" in result) {
        toast.error(result.error)
        setQr(null)
        return
      }
      if (result.connected) {
        setQr(null)
        setStatus((prev) => ({ ...prev, state: "open" }))
        toast.success("WhatsApp conectado!")
        return
      }
      setQr({ base64: result.qrBase64, pairingCode: result.pairingCode })
    })
  }

  // While the QR dialog is open: watch for the scan, and keep the QR fresh.
  useEffect(() => {
    if (!qr) return
    const poll = setInterval(async () => {
      const next = await getWhatsappStatusAction()
      if (next.state === "open") {
        setQr(null)
        setStatus(next)
        toast.success("WhatsApp conectado!")
      }
    }, POLL_MS)
    const refresh = setInterval(requestQr, QR_REFRESH_MS)
    return () => {
      clearInterval(poll)
      clearInterval(refresh)
    }
    // requestQr is stable enough for this purpose; re-running on every
    // render would reset the timers.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qr !== null])

  function handleDisconnect() {
    startConnecting(async () => {
      const { ok } = await disconnectWhatsappAction()
      if (!ok) {
        toast.error("Não foi possível desconectar. Tente novamente.")
        return
      }
      setStatus((prev) => ({ ...prev, state: "close" }))
      toast.success("WhatsApp desconectado")
    })
  }

  function handleSaveSettings() {
    startSaving(async () => {
      const result = await saveBotSettingsAction({
        greetingIntervalMinutes: interval,
        alertNumber,
        alertsEnabled,
      })
      if (result.error) toast.error(result.error)
      else toast.success(result.success ?? "Salvo")
    })
  }

  return (
    <div className="bg-card space-y-5 rounded-xl border p-4 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "flex size-10 items-center justify-center rounded-full",
              connected
                ? "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400"
                : "bg-muted text-muted-foreground",
            )}
          >
            <Smartphone className="size-5" />
          </div>
          <div>
            <p className="font-semibold">Robô do WhatsApp</p>
            <p className="text-muted-foreground text-xs">
              {connected
                ? "Conectado: saudação, avisos de status e alertas automáticos."
                : "Conecte o WhatsApp da loja para enviar mensagens automaticamente."}
            </p>
          </div>
        </div>

        <span
          className={cn(
            "rounded-full px-2.5 py-1 text-xs font-medium",
            connected
              ? "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400"
              : status.state === "connecting"
                ? "bg-amber-100 text-amber-700"
                : "bg-muted text-muted-foreground",
          )}
        >
          {connected
            ? "Conectado"
            : status.state === "connecting"
              ? "Conectando..."
              : status.state === "error"
                ? "Servidor indisponível"
                : configured
                  ? "Desconectado"
                  : "Não configurado"}
        </span>
      </div>

      {!configured ? (
        <div className="bg-muted/60 space-y-1 rounded-lg p-3 text-xs">
          <p className="font-medium">
            Falta configurar o servidor do WhatsApp.
          </p>
          <p className="text-muted-foreground">
            Variáveis ausentes na Vercel: {status.missingConfig.join(", ")}.
            Veja o passo a passo em docs/whatsapp-evolution-setup.md.
          </p>
        </div>
      ) : connected ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-muted-foreground text-xs">
            Lembre de <strong>desativar a Mensagem de saudação</strong> do
            WhatsApp Business, para o cliente não receber duas.
          </p>
          <AlertDialog>
            <AlertDialogTrigger
              render={
                <Button variant="outline" size="sm" disabled={isConnecting} />
              }
            >
              <Unplug />
              Desconectar
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Desconectar o WhatsApp?</AlertDialogTitle>
                <AlertDialogDescription>
                  O robô para de enviar mensagens. O painel volta a oferecer o
                  envio manual. Você pode conectar de novo quando quiser.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Voltar</AlertDialogCancel>
                <AlertDialogAction onClick={handleDisconnect}>
                  Desconectar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      ) : (
        <Button
          type="button"
          onClick={requestQr}
          disabled={isConnecting}
          className="bg-green-600 text-white hover:bg-green-700"
        >
          {isConnecting ? <Loader2 className="animate-spin" /> : <QrCode />}
          Conectar WhatsApp
        </Button>
      )}

      {configured ? (
        <div className="grid gap-4 border-t pt-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="greetingInterval">
              Intervalo da saudação (min)
            </Label>
            <Input
              id="greetingInterval"
              type="number"
              min={0}
              value={interval}
              onChange={(e) => setIntervalMinutes(e.target.value)}
              className="max-w-32"
            />
            <p className="text-muted-foreground text-xs">
              Só envia a saudação de novo se a conversa ficou parada por esse
              tempo.
            </p>
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor="alertNumber">Alerta de novo pedido para</Label>
              <Switch
                checked={alertsEnabled}
                onCheckedChange={setAlertsEnabled}
                aria-label="Ativar alertas de novo pedido"
              />
            </div>
            <Input
              id="alertNumber"
              inputMode="numeric"
              value={alertNumber}
              onChange={(e) => setAlertNumber(e.target.value)}
              placeholder={storeWhatsapp ?? "66999990000"}
              disabled={!alertsEnabled}
            />
            <p className="text-muted-foreground text-xs">
              Seu número pessoal, com DDD. Em branco, usa o WhatsApp da loja.
            </p>
          </div>
          <div className="sm:col-span-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleSaveSettings}
              disabled={isSaving}
            >
              {isSaving ? "Salvando..." : "Salvar configurações do robô"}
            </Button>
          </div>
        </div>
      ) : null}

      <Dialog open={qr !== null} onOpenChange={(open) => !open && setQr(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Conectar WhatsApp</DialogTitle>
            <DialogDescription>
              No celular da loja, abra o WhatsApp →{" "}
              <strong>Aparelhos conectados</strong> →{" "}
              <strong>Conectar um aparelho</strong> e aponte a câmera para o
              código.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center gap-3">
            {qr?.base64 ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={asImageSrc(qr.base64)}
                alt="QR code para conectar o WhatsApp"
                className="size-64 rounded-lg bg-white p-2"
              />
            ) : (
              <div className="bg-muted flex size-64 items-center justify-center rounded-lg">
                <Loader2 className="text-muted-foreground animate-spin" />
              </div>
            )}
            {qr?.pairingCode ? (
              <p className="text-muted-foreground text-center text-xs">
                Ou use o código de pareamento:{" "}
                <span className="text-foreground font-mono font-semibold">
                  {qr.pairingCode}
                </span>
              </p>
            ) : null}
            <p className="text-muted-foreground flex items-center gap-1.5 text-xs">
              <Loader2 className="size-3 animate-spin" />
              Aguardando leitura do código...
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {connected ? (
        <p className="flex items-center gap-1.5 text-xs text-green-700 dark:text-green-400">
          <CheckCircle2 className="size-3.5" />
          Mudanças de status no painel avisam o cliente automaticamente.
        </p>
      ) : null}
    </div>
  )
}
