import { z } from "zod"
import { addressSchema } from "@/lib/validations/store"

const checkoutItemSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().positive(),
})

export const checkoutSchema = z
  .object({
    storeSlug: z.string().min(1),
    customerName: z.string().trim().min(2, "Informe seu nome"),
    customerWhatsapp: z
      .string()
      .trim()
      .regex(/^\d{10,13}$/, "Informe o WhatsApp com DDD, somente números"),
    fulfillmentType: z.enum(["delivery", "pickup"]),
    deliveryZoneId: z.string().uuid().nullable(),
    address: addressSchema.nullable(),
    items: z.array(checkoutItemSchema).min(1, "Seu carrinho está vazio"),
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

export type CheckoutInput = z.infer<typeof checkoutSchema>
