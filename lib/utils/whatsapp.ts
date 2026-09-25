import type { AddressInput } from "@/lib/validations/store"
import type { OrderStatus, PaymentPreference } from "@/lib/services/order"
import { PAYMENT_PREFERENCE_LABEL } from "@/lib/services/order"
import { PIX_KEY, PIX_RECIPIENT_NAME } from "@/lib/pix"
import { formatAddress } from "@/lib/utils/address"
import { formatBRL } from "@/lib/utils/money"

export type WhatsappOrderItem = {
  name: string
  quantity: number
  unitPriceCents: number
  notes?: string
}

export type WhatsappOrderSummary = {
  orderId: string
  orderNumber: number
  customerName: string
  items: WhatsappOrderItem[]
  subtotalCents: number
  deliveryFeeCents: number
  discountCents: number
  totalCents: number
  fulfillmentType: "delivery" | "pickup"
  address: AddressInput | null
  paymentMethod: PaymentPreference
  estimatedMinutes: number | null
}

export function buildOrderWhatsappMessage(order: WhatsappOrderSummary): string {
  const lines: string[] = []

  lines.push(`*Pedido #${order.orderNumber}*`)
  lines.push(`Cliente: ${order.customerName}`)
  lines.push("")
  lines.push("*Itens:*")
  for (const item of order.items) {
    lines.push(
      `${item.quantity}x ${item.name} — ${formatBRL(item.unitPriceCents * item.quantity)}`,
    )
    if (item.notes) {
      lines.push(`   _obs: ${item.notes}_`)
    }
  }
  lines.push("")
  lines.push(`Subtotal: ${formatBRL(order.subtotalCents)}`)
  lines.push(`Entrega: ${formatBRL(order.deliveryFeeCents)}`)
  lines.push(`Desconto: ${formatBRL(order.discountCents)}`)
  lines.push(`*Total: ${formatBRL(order.totalCents)}*`)
  lines.push("")
  lines.push(
    `Forma de entrega: ${order.fulfillmentType === "delivery" ? "Entrega" : "Retirada no local"}`,
  )
  if (order.fulfillmentType === "delivery" && order.address) {
    lines.push(`Endereço: ${formatAddress(order.address)}`)
  }
  lines.push(`Pagamento: ${PAYMENT_PREFERENCE_LABEL[order.paymentMethod]}`)
  if (order.paymentMethod === "pix") {
    lines.push(`Chave Pix: ${PIX_KEY} (${PIX_RECIPIENT_NAME})`)
    lines.push("_Envio o comprovante por aqui._")
  }

  return lines.join("\n")
}

/** Ready-to-send WhatsApp text telling the customer where their order is.
 * The store owner reviews/edits it before it goes out. */
export function buildStatusMessage({
  customerName,
  orderNumber,
  status,
  fulfillmentType,
  trackingUrl,
}: {
  customerName: string
  orderNumber: number
  status: OrderStatus
  fulfillmentType: "delivery" | "pickup"
  trackingUrl: string
}): string {
  const firstName = customerName.trim().split(/\s+/)[0] || customerName
  const order = `*#${orderNumber}*`

  const body: Record<OrderStatus, string> = {
    new: `Recebemos seu pedido ${order} e ele já está na nossa fila! 🍪`,
    confirmed: `Seu pedido ${order} foi confirmado! 🍪`,
    preparing: `Seu pedido ${order} está sendo preparado agora! 👩‍🍳🍪`,
    out_for_delivery:
      fulfillmentType === "delivery"
        ? `Seu pedido ${order} saiu para entrega e logo chega aí! 🛵`
        : `Seu pedido ${order} está pronto para retirada! Pode vir buscar 🛍️`,
    completed: `Seu pedido ${order} foi concluído. Muito obrigado pela preferência, esperamos que goste! ❤️🍪`,
    cancelled: `Infelizmente seu pedido ${order} foi cancelado. Se tiver qualquer dúvida, é só responder esta mensagem.`,
  }

  const lines = [`Olá, ${firstName}!`, body[status]]
  if (status !== "cancelled" && status !== "completed") {
    lines.push("", `Acompanhe por aqui: ${trackingUrl}`)
  }
  return lines.join("\n")
}

/** Assumes Brazilian numbers: prepends the 55 country code when missing. */
export function buildWhatsappLink(
  phoneNumber: string,
  message: string,
): string {
  const digits = phoneNumber.replace(/\D/g, "")
  const withCountryCode = digits.startsWith("55") ? digits : `55${digits}`
  return `https://wa.me/${withCountryCode}?text=${encodeURIComponent(message)}`
}
