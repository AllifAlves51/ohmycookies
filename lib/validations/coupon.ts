import { z } from "zod"

function toNumber(value: string) {
  return Number(value.trim().replace(",", "."))
}

export const couponSchema = z
  .object({
    code: z
      .string()
      .trim()
      .min(2, "Informe um código")
      .max(30, "Código muito longo")
      .regex(/^[a-zA-Z0-9-]+$/, "Use apenas letras, números e hífen"),
    discountType: z.enum(["percentage", "fixed"]),
    discountValue: z
      .string()
      .trim()
      .min(1, "Informe o valor do desconto")
      .refine((v) => {
        const n = toNumber(v)
        return Number.isFinite(n) && n > 0
      }, "Valor inválido"),
    minOrder: z.string().trim(),
    usageLimit: z.string().trim(),
    expiresAt: z.string().trim(),
    active: z.boolean(),
  })
  .refine(
    (data) => {
      if (data.discountType !== "percentage") return true
      const n = toNumber(data.discountValue)
      return n <= 100
    },
    { message: "Desconto percentual não pode passar de 100%", path: ["discountValue"] },
  )

export type CouponInput = z.infer<typeof couponSchema>
