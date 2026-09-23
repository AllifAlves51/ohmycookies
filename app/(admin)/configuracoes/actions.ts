"use server"

import { revalidatePath } from "next/cache"
import type { SupabaseClient } from "@supabase/supabase-js"
import { createClient } from "@/lib/supabase/server"
import { reaisToCents } from "@/lib/utils/money"
import {
  storeInfoSchema,
  storeSettingsSchema,
  openingHoursSchema,
  storeLinksSchema,
} from "@/lib/validations/store"
import {
  getStoreByOwnerId,
  updateStore,
  updateStoreSettings,
  updateStoreLinks,
} from "@/lib/services/store"

export type SettingsActionState = {
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

export async function updateStoreInfoAction(
  _prevState: SettingsActionState,
  formData: FormData,
): Promise<SettingsActionState> {
  const parsed = storeInfoSchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug"),
    whatsappNumber: formData.get("whatsappNumber"),
    address: {
      street: formData.get("street"),
      number: formData.get("number"),
      neighborhood: formData.get("neighborhood"),
      complement: formData.get("complement") ?? "",
      city: formData.get("city"),
      state: formData.get("state"),
      zip: formData.get("zip"),
    },
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" }
  }

  const supabase = await createClient()
  const store = await requireOwnedStore(supabase)

  if (!store) {
    return { error: "Loja não encontrada" }
  }

  const { error } = await updateStore(supabase, store.id, {
    name: parsed.data.name,
    slug: parsed.data.slug,
    whatsapp_number: parsed.data.whatsappNumber,
    address: parsed.data.address,
  })

  if (error) {
    if (error.code === "23505") {
      return { error: "Esse link (slug) já está em uso por outra loja" }
    }
    return { error: "Não foi possível salvar. Tente novamente." }
  }

  revalidatePath("/configuracoes")
  revalidatePath("/dashboard")
  return { success: "Dados da loja atualizados" }
}

export async function updateOpeningHoursAction(
  _prevState: SettingsActionState,
  formData: FormData,
): Promise<SettingsActionState> {
  const days = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const
  const raw: Record<string, unknown> = {}

  for (const day of days) {
    raw[day] = {
      open: formData.get(`${day}.open`) === "on",
      from: formData.get(`${day}.from`),
      to: formData.get(`${day}.to`),
    }
  }

  const parsed = openingHoursSchema.safeParse(raw)

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Horário inválido" }
  }

  const supabase = await createClient()
  const store = await requireOwnedStore(supabase)

  if (!store) {
    return { error: "Loja não encontrada" }
  }

  const { error } = await updateStore(supabase, store.id, {
    opening_hours: parsed.data,
  })

  if (error) {
    return { error: "Não foi possível salvar. Tente novamente." }
  }

  revalidatePath("/configuracoes")
  return { success: "Horário de funcionamento atualizado" }
}

export async function updateStoreSettingsAction(
  _prevState: SettingsActionState,
  formData: FormData,
): Promise<SettingsActionState> {
  const parsed = storeSettingsSchema.safeParse({
    minOrder: formData.get("minOrder"),
    pickupEnabled: formData.get("pickupEnabled") === "on",
    deliveryEnabled: formData.get("deliveryEnabled") === "on",
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" }
  }

  const supabase = await createClient()
  const store = await requireOwnedStore(supabase)

  if (!store) {
    return { error: "Loja não encontrada" }
  }

  const { error } = await updateStoreSettings(supabase, store.id, {
    min_order_cents: reaisToCents(parsed.data.minOrder),
    pickup_enabled: parsed.data.pickupEnabled,
    delivery_enabled: parsed.data.deliveryEnabled,
  })

  if (error) {
    return { error: "Não foi possível salvar. Tente novamente." }
  }

  revalidatePath("/configuracoes")
  return { success: "Configurações de pedido atualizadas" }
}

export async function updateStoreLinksAction(
  _prevState: SettingsActionState,
  formData: FormData,
): Promise<SettingsActionState> {
  const parsed = storeLinksSchema.safeParse({
    instagramUrl: formData.get("instagramUrl") ?? "",
    facebookUrl: formData.get("facebookUrl") ?? "",
    websiteUrl: formData.get("websiteUrl") ?? "",
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" }
  }

  const supabase = await createClient()
  const store = await requireOwnedStore(supabase)

  if (!store) {
    return { error: "Loja não encontrada" }
  }

  const { error } = await updateStoreLinks(supabase, store.id, {
    instagram_url: parsed.data.instagramUrl,
    facebook_url: parsed.data.facebookUrl,
    website_url: parsed.data.websiteUrl,
  })

  if (error) {
    return { error: "Não foi possível salvar. Tente novamente." }
  }

  revalidatePath("/configuracoes")
  revalidatePath("/dashboard")
  return { success: "Links atualizados" }
}

export async function uploadLogoAction(
  _prevState: SettingsActionState,
  formData: FormData,
): Promise<SettingsActionState> {
  const file = formData.get("logo")

  if (!(file instanceof File) || file.size === 0) {
    return { error: "Selecione uma imagem" }
  }

  if (!file.type.startsWith("image/")) {
    return { error: "O arquivo precisa ser uma imagem" }
  }

  if (file.size > 2 * 1024 * 1024) {
    return { error: "A imagem deve ter no máximo 2MB" }
  }

  const supabase = await createClient()
  const store = await requireOwnedStore(supabase)

  if (!store) {
    return { error: "Loja não encontrada" }
  }

  const extension = file.name.split(".").pop() ?? "png"
  const path = `${store.id}/logo-${Date.now()}.${extension}`

  const { error: uploadError } = await supabase.storage
    .from("store-logos")
    .upload(path, file, { upsert: true })

  if (uploadError) {
    return { error: "Não foi possível enviar a imagem. Tente novamente." }
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from("store-logos").getPublicUrl(path)

  const { error } = await updateStore(supabase, store.id, {
    logo_url: publicUrl,
  })

  if (error) {
    return { error: "Não foi possível salvar a logo. Tente novamente." }
  }

  revalidatePath("/configuracoes")
  revalidatePath("/dashboard")
  return { success: "Logo atualizada" }
}
