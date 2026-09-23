import { z } from "zod"

export const categorySchema = z.object({
  name: z.string().trim().min(2, "Informe o nome da categoria"),
})

export type CategoryInput = z.infer<typeof categorySchema>

function toNumber(value: string) {
  return Number(value.trim().replace(",", "."))
}

const moneyStringSchema = z
  .string()
  .trim()
  .min(1, "Informe o preço")
  .refine((v) => {
    const n = toNumber(v)
    return Number.isFinite(n) && n >= 0
  }, "Valor inválido")

export const NO_CATEGORY_VALUE = "none"

export const productSchema = z
  .object({
    name: z.string().trim().min(2, "Informe o nome do produto"),
    description: z.string().trim(),
    categoryId: z.string().trim().uuid("Selecione uma categoria").nullable(),
    price: moneyStringSchema,
    promoPrice: z.string().trim(),
    featured: z.boolean(),
    active: z.boolean(),
    stockControlEnabled: z.boolean(),
    stockQuantity: z.string().trim(),
  })
  .refine(
    (data) => {
      if (data.promoPrice === "") return true
      const promo = toNumber(data.promoPrice)
      const price = toNumber(data.price)
      return Number.isFinite(promo) && promo >= 0 && promo < price
    },
    {
      message: "O preço promocional deve ser menor que o preço normal",
      path: ["promoPrice"],
    },
  )
  .refine(
    (data) => {
      if (!data.stockControlEnabled) return true
      const quantity = Number(data.stockQuantity)
      return (
        data.stockQuantity !== "" && Number.isInteger(quantity) && quantity >= 0
      )
    },
    { message: "Informe a quantidade em estoque", path: ["stockQuantity"] },
  )

export type ProductInput = z.infer<typeof productSchema>
