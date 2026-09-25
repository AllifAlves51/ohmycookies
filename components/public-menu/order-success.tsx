import Link from "next/link"
import { CheckCircle2, Clock, MapPin, MessageCircle } from "lucide-react"
import {
  buildOrderWhatsappMessage,
  buildWhatsappLink,
  type WhatsappOrderSummary,
} from "@/lib/utils/whatsapp"
import { Button } from "@/components/ui/button"
import { PixInfo } from "@/components/public-menu/pix-info"

export function OrderSuccess({
  summary,
  storeSlug,
  storeWhatsapp,
  onClose,
}: {
  summary: WhatsappOrderSummary
  storeSlug: string
  storeWhatsapp: string | null
  onClose: () => void
}) {
  const whatsappLink = storeWhatsapp
    ? buildWhatsappLink(storeWhatsapp, buildOrderWhatsappMessage(summary))
    : null

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
      <div className="bg-secondary flex size-16 items-center justify-center rounded-full">
        <CheckCircle2 className="text-primary size-9" />
      </div>
      <h2 className="text-lg font-semibold">Pedido enviado!</h2>
      <p className="text-muted-foreground text-sm">
        Recebemos seu pedido e já estamos preparando seus cookies.
      </p>

      <div className="bg-secondary flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3">
        <span className="text-primary text-sm font-semibold">
          Pedido #{summary.orderNumber}
        </span>
        {summary.estimatedMinutes ? (
          <>
            <span className="text-primary/40">•</span>
            <span className="text-primary flex items-center gap-1 text-sm">
              <Clock className="size-3.5" />
              Entrega estimada {summary.estimatedMinutes} min
            </span>
          </>
        ) : null}
      </div>

      {summary.paymentMethod === "pix" ? <PixInfo className="w-full" /> : null}

      {whatsappLink ? (
        <Button
          className="w-full rounded-xl"
          nativeButton={false}
          render={
            <a href={whatsappLink} target="_blank" rel="noopener noreferrer" />
          }
        >
          <MessageCircle />
          Enviar pedido no WhatsApp
        </Button>
      ) : null}
      {summary.orderId ? (
        <Button
          className="w-full rounded-xl"
          variant="outline"
          nativeButton={false}
          render={
            <Link href={`/cardapio/${storeSlug}/pedido/${summary.orderId}`} />
          }
        >
          <MapPin />
          Acompanhar pedido
        </Button>
      ) : null}
      <Button
        type="button"
        variant="ghost"
        className="w-full rounded-xl"
        onClick={onClose}
      >
        Voltar ao cardápio
      </Button>
    </div>
  )
}
