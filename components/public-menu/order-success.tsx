import { CheckCircle2, MessageCircle } from "lucide-react"
import {
  buildOrderWhatsappMessage,
  buildWhatsappLink,
  type WhatsappOrderSummary,
} from "@/lib/utils/whatsapp"
import { Button } from "@/components/ui/button"

export function OrderSuccess({
  summary,
  storeWhatsapp,
  onClose,
}: {
  summary: WhatsappOrderSummary
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
      <Button
        type="button"
        variant="outline"
        className="w-full rounded-xl"
        onClick={onClose}
      >
        Fechar
      </Button>
    </div>
  )
}
