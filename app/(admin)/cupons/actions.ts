"use server"

import { revalidatePath } from "next/cache"
import type { SupabaseClient } from "@supabase/supabase-js"
import { createClient } from "@/lib/supabase/server"
import { reaisToCents } from "@/lib/utils/money"
import { couponSchema } from "@/lib/validations/coupon"
import { getStoreByOwnerId } from "@/lib/services/store"
import { createCoupon, updateCoupon, deleteCoupon } from "@/lib/services/coupon"

export type CouponActionState = {
  error?: string
  success?: string
}

async function requireOwnedStore(supabase: SupabaseClient) {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  const { data: store } = await getStoreByOwnerId(supabase, user.id)
  return store
}

function parseCouponFormData(formData: FormData) {
  return couponSchema.safeParse({
    code: formData.get("code"),
    discountType: formData.get("discountType"),
    discountValue: formData.get("discountValue"),
    minOrder: formData.get("minOrder") ?? "",
    usageLimit: formData.get("usageLimit") ?? "",
    expiresAt: formData.get("expiresAt") ?? "",
    active: formData.get("active") === "on",
  })
}

export async function createCouponAction(
  _prevState: CouponActionState,
  formData: FormData,
): Promise<CouponActionState> {
  const parsed = parseCouponFormData(formData)

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" }
  }

  const supabase = await createClient()
  const store = await requireOwnedStore(supabase)

  if (!store) {
    return { error: "Loja não encontrada" }
  }

  const { data } = parsed
  const discountValue =
    data.discountType === "percentage"
      ? Math.round(Number(data.discountValue.replace(",", ".")))
      : reaisToCents(data.discountValue)

  const { error } = await createCoupon(supabase, store.id, {
    code: data.code,
    discount_type: data.discountType,
    discount_value: discountValue,
    min_order_cents: data.minOrder.trim() ? reaisToCents(data.minOrder) : 0,
    usage_limit: data.usageLimit.trim() ? Number(data.usageLimit) : null,
    active: data.active,
    expires_at: data.expiresAt.trim()
      ? new Date(data.expiresAt).toISOString()
      : null,
  })

  if (error) {
    if (error.code === "23505") {
      return { error: "Já existe um cupom com esse código" }
    }
    return { error: "Não foi possível criar o cupom" }
  }

  revalidatePath("/cupons")
  return { success: "Cupom criado" }
}

export async function updateCouponAction(
  _prevState: CouponActionState,
  formData: FormData,
): Promise<CouponActionState> {
  const couponId = formData.get("couponId")

  if (typeof couponId !== "string" || !couponId) {
    return { error: "Cupom inválido" }
  }

  const parsed = parseCouponFormData(formData)

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" }
  }

  const supabase = await createClient()
  const store = await requireOwnedStore(supabase)

  if (!store) {
    return { error: "Loja não encontrada" }
  }

  const { data } = parsed
  const discountValue =
    data.discountType === "percentage"
      ? Math.round(Number(data.discountValue.replace(",", ".")))
      : reaisToCents(data.discountValue)

  const { error } = await updateCoupon(supabase, couponId, {
    code: data.code,
    discount_type: data.discountType,
    discount_value: discountValue,
    min_order_cents: data.minOrder.trim() ? reaisToCents(data.minOrder) : 0,
    usage_limit: data.usageLimit.trim() ? Number(data.usageLimit) : null,
    active: data.active,
    expires_at: data.expiresAt.trim()
      ? new Date(data.expiresAt).toISOString()
      : null,
  })

  if (error) {
    if (error.code === "23505") {
      return { error: "Já existe um cupom com esse código" }
    }
    return { error: "Não foi possível salvar" }
  }

  revalidatePath("/cupons")
  return { success: "Cupom atualizado" }
}

export async function toggleCouponActiveAction(
  couponId: string,
  active: boolean,
) {
  const supabase = await createClient()
  const store = await requireOwnedStore(supabase)

  if (!store) {
    return
  }

  await updateCoupon(supabase, couponId, { active })
  revalidatePath("/cupons")
}

export async function deleteCouponAction(couponId: string) {
  const supabase = await createClient()
  const store = await requireOwnedStore(supabase)

  if (!store) {
    return
  }

  await deleteCoupon(supabase, couponId)
  revalidatePath("/cupons")
}
