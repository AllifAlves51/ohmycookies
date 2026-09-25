"use server"

import { revalidatePath } from "next/cache"
import type { SupabaseClient } from "@supabase/supabase-js"
import { createClient } from "@/lib/supabase/server"
import { reaisToCents } from "@/lib/utils/money"
import {
  deliveryZoneSchema,
  deliverySettingsSchema,
} from "@/lib/validations/delivery"
import { getStoreByOwnerId, updateStoreSettings } from "@/lib/services/store"
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
    radiusKm: formData.get("radiusKm"),
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

  const radiusKm = Number(parsed.data.radiusKm.replace(",", "."))

  const { error } = await createDeliveryZone(supabase, store.id, {
    name: `Até ${radiusKm} km`,
    radius_km: radiusKm,
    fee_cents: reaisToCents(parsed.data.fee),
    estimated_time_minutes: Number(parsed.data.estimatedTimeMinutes),
    active: parsed.data.active,
  })

  if (error) {
    if (error.code === "23505") {
      return { error: "Já existe uma faixa com esse raio" }
    }
    return { error: "Não foi possível criar a faixa" }
  }

  revalidatePath("/entrega")
  return { success: "Faixa criada" }
}

export async function updateDeliveryZoneAction(
  _prevState: DeliveryActionState,
  formData: FormData,
): Promise<DeliveryActionState> {
  const zoneId = formData.get("zoneId")

  if (typeof zoneId !== "string" || !zoneId) {
    return { error: "Faixa inválida" }
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

  const radiusKm = Number(parsed.data.radiusKm.replace(",", "."))

  const { error } = await updateDeliveryZone(supabase, zoneId, {
    name: `Até ${radiusKm} km`,
    radius_km: radiusKm,
    fee_cents: reaisToCents(parsed.data.fee),
    estimated_time_minutes: Number(parsed.data.estimatedTimeMinutes),
    active: parsed.data.active,
  })

  if (error) {
    if (error.code === "23505") {
      return { error: "Já existe uma faixa com esse raio" }
    }
    return { error: "Não foi possível salvar" }
  }

  revalidatePath("/entrega")
  return { success: "Faixa atualizada" }
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

export async function updateDeliverySettingsAction(
  _prevState: DeliveryActionState,
  formData: FormData,
): Promise<DeliveryActionState> {
  const parsed = deliverySettingsSchema.safeParse({
    orderPrepMinutes: formData.get("orderPrepMinutes"),
    freeDeliveryThreshold: formData.get("freeDeliveryThreshold") ?? "",
    addressMapConfirmationEnabled:
      formData.get("addressMapConfirmationEnabled") === "on",
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" }
  }

  const supabase = await createClient()
  const store = await requireOwnedStore(supabase)

  if (!store) {
    return { error: "Loja não encontrada" }
  }

  const threshold = parsed.data.freeDeliveryThreshold.trim()

  const { error } = await updateStoreSettings(supabase, store.id, {
    order_prep_minutes: Number(parsed.data.orderPrepMinutes),
    free_delivery_threshold_cents: threshold ? reaisToCents(threshold) : null,
    address_map_confirmation_enabled: parsed.data.addressMapConfirmationEnabled,
  })

  if (error) {
    return { error: "Não foi possível salvar. Tente novamente." }
  }

  revalidatePath("/entrega")
  return { success: "Configurações de entrega atualizadas" }
}
