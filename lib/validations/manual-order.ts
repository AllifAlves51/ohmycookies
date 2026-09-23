import { z } from "zod"

const manualOrderItemSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().positive(),
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
    items: z.array(manualOrderItemSchema).min(1, "Adicione ao menos um item"),
  })
  .refine(
    (data) =>
      data.fulfillmentType !== "delivery" || data.deliveryZoneId !== null,
    { message: "Selecione a região de entrega", path: ["deliveryZoneId"] },
  )

export type ManualOrderInput = z.infer<typeof manualOrderSchema>
