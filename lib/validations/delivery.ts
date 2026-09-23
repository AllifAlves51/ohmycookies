import { z } from "zod"

function toNumber(value: string) {
  return Number(value.trim().replace(",", "."))
}

export const deliveryZoneSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome da região"),
  fee: z
    .string()
    .trim()
    .min(1, "Informe a taxa")
    .refine((v) => {
      const n = toNumber(v)
      return Number.isFinite(n) && n >= 0
    }, "Valor inválido"),
  estimatedTimeMinutes: z
    .string()
    .trim()
    .min(1, "Informe o prazo")
    .refine((v) => {
      const n = Number(v)
      return Number.isInteger(n) && n > 0
    }, "Prazo inválido"),
  active: z.boolean(),
})

export type DeliveryZoneInput = z.infer<typeof deliveryZoneSchema>
