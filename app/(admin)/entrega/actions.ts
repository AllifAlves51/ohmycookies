"use server"

import { revalidatePath } from "next/cache"
import type { SupabaseClient } from "@supabase/supabase-js"
import { createClient } from "@/lib/supabase/server"
import { reaisToCents } from "@/lib/utils/money"
import { deliveryZoneSchema } from "@/lib/validations/delivery"
import { getStoreByOwnerId } from "@/lib/services/store"
import { createDeliveryZone, updateDeliveryZone } from "@/lib/services/delivery"

export type DeliveryActionState = {
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

function parseZoneFormData(formData: FormData) {
  return deliveryZoneSchema.safeParse({
    name: formData.get("name"),
    fee: formData.get("fee"),
    estimatedTimeMinutes: formData.get("estimatedTimeMinutes"),
    active: formData.get("active") === "on",
  })
}

export async function createDeliveryZoneAction(
  _prevState: DeliveryActionState,
  formData: FormData,
): Promise<DeliveryActionState> {
  const parsed = parseZoneFormData(formData)

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" }
  }

  const supabase = await createClient()
  const store = await requireOwnedStore(supabase)

  if (!store) {
    return { error: "Loja não encontrada" }
  }

  const { error } = await createDeliveryZone(supabase, store.id, {
    name: parsed.data.name,
    fee_cents: reaisToCents(parsed.data.fee),
    estimated_time_minutes: Number(parsed.data.estimatedTimeMinutes),
    active: parsed.data.active,
  })

  if (error) {
    if (error.code === "23505") {
      return { error: "Já existe uma região com esse nome" }
    }
    return { error: "Não foi possível criar a região" }
  }

  revalidatePath("/entrega")
  return { success: "Região criada" }
}

export async function updateDeliveryZoneAction(
  _prevState: DeliveryActionState,
  formData: FormData,
): Promise<DeliveryActionState> {
  const zoneId = formData.get("zoneId")

  if (typeof zoneId !== "string" || !zoneId) {
    return { error: "Região inválida" }
  }

  const parsed = parseZoneFormData(formData)

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" }
  }

  const supabase = await createClient()
  const store = await requireOwnedStore(supabase)

  if (!store) {
    return { error: "Loja não encontrada" }
  }

  const { error } = await updateDeliveryZone(supabase, zoneId, {
    name: parsed.data.name,
    fee_cents: reaisToCents(parsed.data.fee),
    estimated_time_minutes: Number(parsed.data.estimatedTimeMinutes),
    active: parsed.data.active,
  })

  if (error) {
    if (error.code === "23505") {
      return { error: "Já existe uma região com esse nome" }
    }
    return { error: "Não foi possível salvar" }
  }

  revalidatePath("/entrega")
  return { success: "Região atualizada" }
}

export async function toggleDeliveryZoneActiveAction(
  zoneId: string,
  active: boolean,
) {
  const supabase = await createClient()
  const store = await requireOwnedStore(supabase)

  if (!store) {
    return
  }

  await updateDeliveryZone(supabase, zoneId, { active })
  revalidatePath("/entrega")
}
