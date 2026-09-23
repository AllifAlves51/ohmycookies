import type { AddressInput } from "@/lib/validations/store"
import { formatAddress } from "@/lib/utils/address"
import { formatBRL } from "@/lib/utils/money"

export type WhatsappOrderItem = {
  name: string
  quantity: number
  unitPriceCents: number
}

export type WhatsappOrderSummary = {
  orderNumber: number
  customerName: string
  items: WhatsappOrderItem[]
  subtotalCents: number
  deliveryFeeCents: number
  discountCents: number
  totalCents: number
  fulfillmentType: "delivery" | "pickup"
  address: AddressInput | null
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
