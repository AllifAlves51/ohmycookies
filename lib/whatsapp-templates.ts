import type { OrderStatus } from "@/lib/services/order"

export type TemplateKey =
  | "greeting"
  | "away"
  | "received"
  | "preparing"
  | "out_for_delivery"
  | "ready_for_pickup"
  | "completed"
  | "cancelled"

export type WhatsappTemplate = { enabled: boolean; text: string }
export type WhatsappTemplates = Record<TemplateKey, WhatsappTemplate>

export const TEMPLATE_META: {
  key: TemplateKey
  label: string
  description: string
  /** Greeting/away aren't tied to an order: there's no connection to send
   * them automatically, so they're copied into WhatsApp Business instead. */
  kind: "business" | "status"
  sampleCustomerMessage: string
}[] = [
  {
    key: "greeting",
    label: "Saudação",
    description:
      "Primeira mensagem quando um cliente te chama. Cole no WhatsApp Business em Ferramentas comerciais → Mensagem de saudação.",
    kind: "business",
    sampleCustomerMessage: "Olá, gostaria do cardápio!",
  },
  {
    key: "away",
    label: "Ausência",
    description:
      "Resposta fora do horário de funcionamento. Cole no WhatsApp Business em Ferramentas comerciais → Mensagem de ausência.",
    kind: "business",
    sampleCustomerMessage: "Oi, vocês estão abertos?",
  },
  {
    key: "received",
    label: "Pedido recebido",
    description: "Quando o pedido é reaberto ou volta para Novos.",
    kind: "status",
    sampleCustomerMessage: "Acabei de fazer meu pedido!",
  },
  {
    key: "preparing",
    label: "Em preparo",
    description: "Quando o pedido passa para Em preparo.",
    kind: "status",
    sampleCustomerMessage: "Oi! Meu pedido já foi aceito?",
  },
  {
    key: "out_for_delivery",
    label: "Saiu para entrega",
    description: "Quando um pedido de entrega sai para entrega.",
    kind: "status",
    sampleCustomerMessage: "Meu pedido já saiu?",
  },
  {
    key: "ready_for_pickup",
    label: "Pronto para retirada",
    description: "Quando um pedido de retirada fica pronto.",
    kind: "status",
    sampleCustomerMessage: "Já posso buscar?",
  },
  {
    key: "completed",
    label: "Finalizado",
    description: "Quando o pedido é concluído.",
    kind: "status",
    sampleCustomerMessage: "Recebi, obrigado!",
  },
  {
    key: "cancelled",
    label: "Cancelado",
    description: "Quando o pedido é cancelado.",
    kind: "status",
    sampleCustomerMessage: "O que aconteceu com meu pedido?",
  },
]

export const TEMPLATE_VARIABLES: {
  token: string
  label: string
  onlyStatus?: boolean
}[] = [
  { token: "{nome}", label: "Nome do cliente", onlyStatus: true },
  { token: "{pedido}", label: "Nº do pedido", onlyStatus: true },
  { token: "{link_pedido}", label: "Link de acompanhamento", onlyStatus: true },
  { token: "{cardapio}", label: "Link do cardápio" },
  { token: "{loja}", label: "Nome da loja" },
]

export const DEFAULT_TEMPLATES: WhatsappTemplates = {
  greeting: {
    enabled: true,
    text: "Olá, seja bem-vindo(a) à {loja}! 🍪\n\nFaça seu pedido pelo nosso cardápio online, é rapidinho:\n👉 {cardapio}\n\nQualquer dúvida, é só chamar por aqui! ❤️",
  },
  away: {
    enabled: true,
    text: "Olá! No momento estamos fechados 😴\n\nVocê já pode ver o cardápio e deixar seu pedido:\n👉 {cardapio}\n\nRespondemos assim que abrirmos!",
  },
  received: {
    enabled: true,
    text: "Olá, {nome}! Recebemos seu pedido *#{pedido}* e ele já está na nossa fila! 🍪\n\nAcompanhe por aqui: {link_pedido}",
  },
  preparing: {
    enabled: true,
    text: "Olá, {nome}! Seu pedido *#{pedido}* está sendo preparado agora! 👩‍🍳🍪\n\nAcompanhe por aqui: {link_pedido}",
  },
  out_for_delivery: {
    enabled: true,
    text: "Olá, {nome}! Seu pedido *#{pedido}* saiu para entrega e logo chega aí! 🛵\n\nAcompanhe por aqui: {link_pedido}",
  },
  ready_for_pickup: {
    enabled: true,
    text: "Olá, {nome}! Seu pedido *#{pedido}* está pronto para retirada! Pode vir buscar 🛍️",
  },
  completed: {
    enabled: true,
    text: "Olá, {nome}! Seu pedido *#{pedido}* foi concluído. Muito obrigado pela preferência, esperamos que goste! ❤️🍪",
  },
  cancelled: {
    enabled: true,
    text: "Olá, {nome}. Infelizmente seu pedido *#{pedido}* foi cancelado. Se tiver qualquer dúvida, é só responder esta mensagem.",
  },
}

const TEMPLATE_KEYS = TEMPLATE_META.map((meta) => meta.key)

/** Merges what's stored in the database over the defaults, ignoring any
 * malformed entries. */
export function resolveTemplates(stored: unknown): WhatsappTemplates {
  const result = { ...DEFAULT_TEMPLATES }
  if (!stored || typeof stored !== "object") return result

  for (const key of TEMPLATE_KEYS) {
    const entry = (stored as Record<string, unknown>)[key]
    if (!entry || typeof entry !== "object") continue
    const { enabled, text } = entry as Partial<WhatsappTemplate>
    result[key] = {
      enabled: typeof enabled === "boolean" ? enabled : result[key].enabled,
      text: typeof text === "string" && text.trim() ? text : result[key].text,
    }
  }
  return result
}

export function templateKeyForStatus(
  status: OrderStatus,
  fulfillmentType: "delivery" | "pickup",
): TemplateKey {
  switch (status) {
    case "new":
    case "confirmed":
      return "received"
    case "preparing":
      return "preparing"
    case "out_for_delivery":
      return fulfillmentType === "pickup"
        ? "ready_for_pickup"
        : "out_for_delivery"
    case "completed":
      return "completed"
    case "cancelled":
      return "cancelled"
  }
}

export type TemplateValues = {
  nome?: string
  pedido?: number | string
  link_pedido?: string
  cardapio?: string
  loja?: string
}

export function renderTemplate(text: string, values: TemplateValues) {
  return text.replace(
    /\{(nome|pedido|link_pedido|cardapio|loja)\}/g,
    (match, name) => {
      const value = values[name as keyof TemplateValues]
      return value === undefined || value === "" ? match : String(value)
    },
  )
}

/** The customer-facing status message, or null when the owner switched
 * that status's message off. */
export function buildStatusMessage({
  templates,
  status,
  fulfillmentType,
  customerName,
  orderNumber,
  trackingUrl,
  menuUrl,
  storeName,
}: {
  templates: WhatsappTemplates
  status: OrderStatus
  fulfillmentType: "delivery" | "pickup"
  customerName: string
  orderNumber: number
  trackingUrl: string
  menuUrl: string
  storeName: string
}): string | null {
  const template = templates[templateKeyForStatus(status, fulfillmentType)]
  if (!template.enabled) return null

  return renderTemplate(template.text, {
    nome: customerName.trim().split(/\s+/)[0] || customerName,
    pedido: orderNumber,
    link_pedido: trackingUrl,
    cardapio: menuUrl,
    loja: storeName,
  })
}
