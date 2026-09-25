import { z } from "zod"

function toNumber(value: string) {
  return Number(value.trim().replace(",", "."))
}

export const deliveryZoneSchema = z.object({
  radiusKm: z
    .string()
    .trim()
    .min(1, "Informe o raio em km")
    .refine((v) => {
      const n = toNumber(v)
      return Number.isFinite(n) && n > 0
    }, "Raio inválido"),
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

export const deliverySettingsSchema = z.object({
  orderPrepMinutes: z
    .string()
    .trim()
    .refine((v) => {
      const n = Number(v)
      return Number.isInteger(n) && n >= 0
    }, "Valor inválido"),
  freeDeliveryThreshold: z.string().trim(),
  addressMapConfirmationEnabled: z.boolean(),
})

export type DeliverySettingsInput = z.infer<typeof deliverySettingsSchema>
