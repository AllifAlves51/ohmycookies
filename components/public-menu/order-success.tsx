import Link from "next/link"
import { CheckCircle2, MapPin, MessageCircle } from "lucide-react"
import {
  buildOrderWhatsappMessage,
  buildWhatsappLink,
  type WhatsappOrderSummary,
} from "@/lib/utils/whatsapp"
import { Button } from "@/components/ui/button"

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
      <h2 className="text-lg font-semibold">
        Pedido #{summary.orderNumber} enviado!
      </h2>
      <p className="text-muted-foreground text-sm">
        A loja vai confirmar seu pedido em breve.
      </p>
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
        Fechar
      </Button>
    </div>
  )
}
