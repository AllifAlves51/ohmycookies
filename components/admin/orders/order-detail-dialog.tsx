"use client"

import { useEffect, useState, useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ChevronLeft,
  ChevronRight,
  Copy,
  MessageCircle,
  Trash2,
} from "lucide-react"
import {
  getOrderDetailAction,
  updateOrderNotesAction,
  setOrderPaymentStatusAction,
  deleteOrderAction,
  updateOrderStatusAction,
  type OrderDetail,
} from "@/app/(admin)/pedidos/actions"
import {
  PAYMENT_PREFERENCE_LABEL,
  STATUS_COLUMNS,
  type OrderStatus,
  type OrderWithCustomer,
} from "@/lib/services/order"
import { formatBRL } from "@/lib/utils/money"
import { formatAddress } from "@/lib/utils/address"
import { buildWhatsappLink } from "@/lib/utils/whatsapp"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
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

const STAGES: OrderStatus[] = ["new", "preparing", "out_for_delivery", "completed"]
const STATUS_LABEL = new Map(STATUS_COLUMNS.map((c) => [c.status, c.label]))

function formatDateTime(iso: string) {
  const date = new Date(iso)
  const dd = String(date.getDate()).padStart(2, "0")
  const mm = String(date.getMonth() + 1).padStart(2, "0")
  const hh = String(date.getHours()).padStart(2, "0")
  const min = String(date.getMinutes()).padStart(2, "0")
  return `${hh}:${min} - ${dd}/${mm}`
}

export function OrderDetailDialog({
  order,
  storeSlug,
  open,
  onOpenChange,
}: {
  order: OrderWithCustomer
  storeSlug: string
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const router = useRouter()
  const [detail, setDetail] = useState<OrderDetail | null>(null)
  const [notes, setNotes] = useState("")
  const [copied, setCopied] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [status, setStatus] = useState(order.status)

  useEffect(() => {
    if (!open) return
    // eslint-disable-next-line react-hooks/set-state-in-effect -- resyncs local optimistic status with the server-confirmed one each time the dialog reopens for this order.
    setStatus(order.status)
    getOrderDetailAction(order.id).then((result) => {
      setDetail(result)
      setNotes(result?.notes ?? "")
    })
  }, [open, order.id, order.status])

  const currentIndex = STAGES.indexOf(status)
  const nextStatus =
    currentIndex >= 0 && currentIndex < STAGES.length - 1
      ? STAGES[currentIndex + 1]
      : null
  const prevStatus = currentIndex > 0 ? STAGES[currentIndex - 1] : null

  const whatsappLink = order.customer?.whatsapp
    ? buildWhatsappLink(
        order.customer.whatsapp,
        `Olá, ${order.customer.name}! Sobre seu pedido #${order.order_number}...`,
      )
    : null

  const trackingPath = `/cardapio/${storeSlug}/pedido/${order.id}`

  function changeStatus(newStatus: OrderStatus) {
    setStatus(newStatus)
    startTransition(async () => {
      await updateOrderStatusAction(order.id, newStatus)
      router.refresh()
    })
  }

  function handleCopyLink() {
    const url = `${window.location.origin}${trackingPath}`
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  function handleSaveNotes() {
    startTransition(() => updateOrderNotesAction(order.id, notes))
  }

  function handleSetPaymentStatus(status: "pending" | "paid") {
    startTransition(() =>
      setOrderPaymentStatusAction(
        order.id,
        order.payment_preference,
        status,
        order.total_cents,
      ),
    )
    setDetail((prev) => (prev ? { ...prev, paymentStatus: status } : prev))
  }

  function handleDelete() {
    startTransition(() => deleteOrderAction(order.id))
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Pedido #{order.order_number}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {status === "cancelled" ? (
            <div className="bg-muted flex items-center justify-between rounded-lg p-3 text-sm">
              <span>Este pedido foi cancelado.</span>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={isPending}
                onClick={() => changeStatus("new")}
              >
                Reabrir pedido
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-3 rounded-lg border p-3">
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={!prevStatus || isPending}
                onClick={() => prevStatus && changeStatus(prevStatus)}
              >
                <ChevronLeft />
                Voltar
              </Button>
              <span className="text-sm font-medium">
                {STATUS_LABEL.get(status)}
              </span>
              <Button
                type="button"
                size="sm"
                disabled={!nextStatus || isPending}
                onClick={() => nextStatus && changeStatus(nextStatus)}
              >
                Avançar
                <ChevronRight />
              </Button>
            </div>
          )}

          {status !== "cancelled" ? (
            <button
              type="button"
              onClick={() => changeStatus("cancelled")}
              disabled={isPending}
              className="text-destructive text-xs underline underline-offset-4"
            >
              Cancelar pedido
            </button>
          ) : null}

          <div className="space-y-1 rounded-lg border p-3 text-sm">
            <div className="flex items-center justify-between">
              <p className="font-medium">{order.customer?.name ?? "Cliente"}</p>
              {detail ? (
                <span className="text-muted-foreground text-xs">
                  {detail.customerOrderCount}{" "}
                  {detail.customerOrderCount === 1 ? "pedido" : "pedidos"} nesta
                  loja
                </span>
              ) : null}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">
                {order.customer?.whatsapp}
              </span>
              {whatsappLink ? (
                <a
                  href={whatsappLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary flex items-center gap-1 text-xs font-medium"
                >
                  <MessageCircle className="size-3.5" />
                  Enviar mensagem
                </a>
              ) : null}
            </div>
            {order.fulfillment_type === "delivery" && order.delivery_address ? (
              <p className="text-muted-foreground pt-1">
                {formatAddress(order.delivery_address)}
              </p>
            ) : null}
          </div>

          <div className="space-y-2 rounded-lg border p-3 text-sm">
            <p className="font-medium">Itens do pedido</p>
            {!detail ? (
              <p className="text-muted-foreground text-xs">Carregando...</p>
            ) : detail.items.length === 0 ? (
              <p className="text-muted-foreground text-xs">Nenhum item.</p>
            ) : (
              <ul className="space-y-2">
                {detail.items.map((item, index) => (
                  <li key={index} className="flex items-center gap-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.imageUrl ?? "/placeholder-image.svg"}
                      alt=""
                      className="bg-muted size-10 shrink-0 rounded-lg object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate">{item.productName}</p>
                      <p className="text-muted-foreground text-xs">
                        {item.quantity}x {formatBRL(item.unitPriceCents)}
                      </p>
                    </div>
                    <span className="font-medium">
                      {formatBRL(item.subtotalCents)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="space-y-2 rounded-lg border p-3 text-sm">
            <div className="flex items-center justify-between">
              <p className="font-medium">
                Pagamento
                {order.payment_preference
                  ? ` — ${PAYMENT_PREFERENCE_LABEL[order.payment_preference]}`
                  : ""}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                size="sm"
                variant={detail?.paymentStatus === "pending" || !detail?.paymentStatus ? "default" : "outline"}
                disabled={isPending}
                onClick={() => handleSetPaymentStatus("pending")}
              >
                Pendente
              </Button>
              <Button
                type="button"
                size="sm"
                variant={detail?.paymentStatus === "paid" ? "default" : "outline"}
                disabled={isPending}
                onClick={() => handleSetPaymentStatus("paid")}
              >
                Pago
              </Button>
            </div>
            <div className="space-y-1 border-t pt-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatBRL(order.subtotal_cents)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Frete</span>
                <span>{formatBRL(order.delivery_fee_cents)}</span>
              </div>
              <div className="flex justify-between font-semibold">
                <span>Total</span>
                <span>{formatBRL(order.total_cents)}</span>
              </div>
            </div>
          </div>

          <div className="space-y-2 rounded-lg border p-3 text-sm">
            <p className="font-medium">Anotações internas</p>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Registre observações sobre este pedido..."
              rows={2}
            />
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={isPending}
              onClick={handleSaveNotes}
            >
              Salvar nota
            </Button>
          </div>

          <div className="text-muted-foreground flex items-center justify-between text-xs">
            <span>Criado em {formatDateTime(order.created_at)}</span>
            <span>Atualizado em {formatDateTime(order.updated_at)}</span>
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={handleCopyLink}
            >
              <Copy />
              {copied ? "Copiado!" : "Copiar link do pedido"}
            </Button>
            <Button
              type="button"
              variant="outline"
              nativeButton={false}
              render={<Link href={trackingPath} target="_blank" />}
            >
              Ver
            </Button>
          </div>

          <AlertDialog>
            <AlertDialogTrigger
              render={
                <Button
                  type="button"
                  variant="ghost"
                  className="text-destructive w-full"
                />
              }
            >
              <Trash2 />
              Excluir pedido
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Excluir este pedido?</AlertDialogTitle>
                <AlertDialogDescription>
                  Essa ação não pode ser desfeita. O pedido #{order.order_number}{" "}
                  será removido permanentemente.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive text-white hover:bg-destructive/90"
                  onClick={handleDelete}
                >
                  Excluir
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </DialogContent>
    </Dialog>
  )
}
