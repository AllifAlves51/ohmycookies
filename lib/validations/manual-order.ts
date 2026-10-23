import { z } from "zod"

const manualOrderItemSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().positive(),
})

/** Looser than the checkout's addressSchema: on the phone the owner rarely
 * has the CEP, and the city/state default to the store's own. */
export const manualAddressSchema = z.object({
  street: z.string().trim().min(1, "Informe a rua"),
  number: z.string().trim().min(1, "Informe o número"),
  neighborhood: z.string().trim().min(1, "Informe o bairro"),
  complement: z.string().trim(),
  city: z.string().trim().min(1, "Informe a cidade"),
  state: z
    .string()
    .trim()
    .length(2, "Use a sigla do estado (ex: MT)")
    .toUpperCase(),
  zip: z
    .string()
    .trim()
    .refine((v) => v === "" || /^\d{5}-?\d{3}$/.test(v), "CEP inválido"),
})

export const manualOrderSchema = z
  .object({
    customerName: z.string().trim().min(2, "Informe o nome do cliente"),
    customerWhatsapp: z
      .string()
      .trim()
      .regex(/^\d{10,13}$/, "Informe o WhatsApp com DDD, somente números"),
    fulfillmentType: z.enum(["delivery", "pickup"]),
    deliveryZoneId: z.string().uuid().nullable(),
    address: manualAddressSchema.nullable(),
    paymentMethod: z.enum(["cash", "pix", "card"]),
    discountCents: z.number().int().min(0, "Desconto inválido").default(0),
    notes: z.string().trim().max(500).optional(),
    items: z.array(manualOrderItemSchema).min(1, "Adicione ao menos um item"),
  })
  .refine(
    (data) =>
      data.fulfillmentType !== "delivery" || data.deliveryZoneId !== null,
    { message: "Selecione a região de entrega", path: ["deliveryZoneId"] },
  )
  .refine(
    (data) => data.fulfillmentType !== "delivery" || data.address !== null,
    { message: "Informe o endereço de entrega", path: ["address"] },
  )

export type ManualOrderInput = z.input<typeof manualOrderSchema>
