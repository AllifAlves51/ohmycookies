import { z } from "zod"

export const addressSchema = z.object({
  street: z.string().trim().min(1, "Informe a rua"),
  number: z.string().trim().min(1, "Informe o número"),
  neighborhood: z.string().trim().min(1, "Informe o bairro"),
  complement: z.string().trim(),
  city: z.string().trim().min(1, "Informe a cidade"),
  state: z
    .string()
    .trim()
    .length(2, "Use a sigla do estado (ex: SP)")
    .toUpperCase(),
  zip: z
    .string()
    .trim()
    .regex(/^\d{5}-?\d{3}$/, "CEP inválido"),
})

export type AddressInput = z.infer<typeof addressSchema>

export const storeInfoSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome da loja"),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .regex(
      /^[a-z0-9]+(-[a-z0-9]+)*$/,
      "Use apenas letras minúsculas, números e hífens",
    ),
  whatsappNumber: z
    .string()
    .trim()
    .regex(/^\d{10,13}$/, "Informe o WhatsApp com DDD, somente números"),
  address: addressSchema,
})

export type StoreInfoInput = z.infer<typeof storeInfoSchema>

export const storeSettingsSchema = z
  .object({
    minOrder: z
      .string()
      .trim()
      .min(1, "Informe o valor mínimo")
      .refine(
        (v) => Number.isFinite(Number(v.replace(",", "."))),
        "Valor inválido",
      ),
    pickupEnabled: z.boolean(),
    deliveryEnabled: z.boolean(),
  })
  .refine((data) => data.pickupEnabled || data.deliveryEnabled, {
    message: "Ative ao menos uma forma de entrega (retirada ou delivery)",
    path: ["pickupEnabled"],
  })

export type StoreSettingsInput = z.infer<typeof storeSettingsSchema>

const timeRangeSchema = z
  .object({
    open: z.boolean(),
    from: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Horário inválido"),
    to: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Horário inválido"),
  })
  .refine((data) => !data.open || data.from < data.to, {
    message: "O horário de fim deve ser depois do início",
    path: ["to"],
  })

export const openingHoursSchema = z.object({
  mon: timeRangeSchema,
  tue: timeRangeSchema,
  wed: timeRangeSchema,
  thu: timeRangeSchema,
  fri: timeRangeSchema,
  sat: timeRangeSchema,
  sun: timeRangeSchema,
})

export type OpeningHoursInput = z.infer<typeof openingHoursSchema>

export const WEEK_DAYS = [
  { key: "mon", label: "Segunda" },
  { key: "tue", label: "Terça" },
  { key: "wed", label: "Quarta" },
  { key: "thu", label: "Quinta" },
  { key: "fri", label: "Sexta" },
  { key: "sat", label: "Sábado" },
  { key: "sun", label: "Domingo" },
] as const

export const DEFAULT_OPENING_HOURS: OpeningHoursInput = {
  mon: { open: true, from: "08:00", to: "18:00" },
  tue: { open: true, from: "08:00", to: "18:00" },
  wed: { open: true, from: "08:00", to: "18:00" },
  thu: { open: true, from: "08:00", to: "18:00" },
  fri: { open: true, from: "08:00", to: "18:00" },
  sat: { open: true, from: "08:00", to: "18:00" },
  sun: { open: false, from: "08:00", to: "18:00" },
}
