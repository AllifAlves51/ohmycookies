"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"
import { getStoreByOwnerId, getStoreSettings } from "@/lib/services/store"
import {
  getConnectionState,
  isEvolutionConfigured,
  logout,
  startConnection,
  type ConnectionState,
} from "@/lib/services/evolution"
import { getSiteUrl } from "@/lib/site"
import { TEMPLATE_META, type WhatsappTemplates } from "@/lib/whatsapp-templates"

const templateSchema = z.object({
  enabled: z.boolean(),
  text: z
    .string()
    .trim()
    .min(1, "A mensagem não pode ficar vazia")
    .max(1500, "Mensagem muito longa (máx. 1500 caracteres)"),
})

const templatesSchema = z.object(
  Object.fromEntries(
    TEMPLATE_META.map((meta) => [meta.key, templateSchema]),
  ) as Record<keyof WhatsappTemplates, typeof templateSchema>,
)

export async function saveWhatsappTemplatesAction(
  templates: WhatsappTemplates,
): Promise<{ error?: string; success?: string }> {
  const parsed = templatesSchema.safeParse(templates)

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "Sessão expirada. Entre novamente." }
  }

  const { data: store } = await getStoreByOwnerId(supabase, user.id)

  if (!store) {
    return { error: "Loja não encontrada" }
  }

  const { error } = await supabase
    .from("store_settings")
    .update({ whatsapp_templates: parsed.data })
    .eq("store_id", store.id)

  if (error) {
    // 42703 = undefined_column: the migration hasn't been applied yet.
    return {
      error:
        error.code === "42703"
          ? "O banco ainda não tem a coluna de mensagens. Rode a migração 20260925120000_whatsapp_message_templates.sql no Supabase."
          : "Não foi possível salvar. Tente novamente.",
    }
  }

  revalidatePath("/whatsapp")
  revalidatePath("/pedidos")
  return { success: "Mensagens salvas" }
}

async function requireStore() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null
  const { data: store } = await getStoreByOwnerId(supabase, user.id)
  return store ? { supabase, store } : null
}

/** Which server-side settings are still missing for the bot to work. */
function missingBotConfig() {
  const missing: string[] = []
  if (!isEvolutionConfigured())
    missing.push("EVOLUTION_API_URL / EVOLUTION_API_KEY")
  if (!process.env.WHATSAPP_WEBHOOK_SECRET)
    missing.push("WHATSAPP_WEBHOOK_SECRET")
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY)
    missing.push("SUPABASE_SERVICE_ROLE_KEY")
  return missing
}

export type WhatsappStatus = {
  state: ConnectionState
  missingConfig: string[]
}

export async function getWhatsappStatusAction(): Promise<WhatsappStatus> {
  const missingConfig = missingBotConfig()
  const ctx = await requireStore()
  if (!ctx || missingConfig.length > 0) {
    return { state: "unconfigured", missingConfig }
  }

  const { data: settings } = await getStoreSettings(ctx.supabase, ctx.store.id)
  if (!settings?.whatsapp_instance) {
    return { state: "not_found", missingConfig }
  }
  return {
    state: await getConnectionState(settings.whatsapp_instance),
    missingConfig,
  }
}

export async function connectWhatsappAction(): Promise<
  | { connected: true }
  | { connected: false; qrBase64: string | null; pairingCode: string | null }
  | { error: string }
> {
  const secret = process.env.WHATSAPP_WEBHOOK_SECRET
  if (missingBotConfig().length > 0 || !secret) {
    return { error: "O servidor do WhatsApp ainda não foi configurado." }
  }

  const ctx = await requireStore()
  if (!ctx) return { error: "Loja não encontrada" }

  // One Evolution instance per store; the webhook maps it back to the store.
  const instance = `ohmycookies-${ctx.store.id.slice(0, 8)}`
  const { error } = await ctx.supabase
    .from("store_settings")
    .update({ whatsapp_instance: instance })
    .eq("store_id", ctx.store.id)

  if (error) {
    return {
      error:
        error.code === "42703"
          ? "Rode a migração 20260925130000_whatsapp_bot.sql no Supabase antes de conectar."
          : "Não foi possível salvar a conexão. Tente novamente.",
    }
  }

  return startConnection({
    instance,
    webhookUrl: `${getSiteUrl()}/api/whatsapp/webhook`,
    webhookSecret: secret,
  })
}

export async function disconnectWhatsappAction() {
  const ctx = await requireStore()
  if (!ctx) return { ok: false }

  const { data: settings } = await getStoreSettings(ctx.supabase, ctx.store.id)
  if (!settings?.whatsapp_instance) return { ok: true }

  return { ok: await logout(settings.whatsapp_instance) }
}

const botSettingsSchema = z.object({
  greetingIntervalMinutes: z.coerce
    .number()
    .int("Use minutos inteiros")
    .min(0, "O intervalo não pode ser negativo")
    .max(10080, "Máximo de 7 dias (10080 min)"),
  alertNumber: z
    .string()
    .trim()
    .transform((v) => v.replace(/\D/g, ""))
    .refine(
      (v) => v === "" || (v.length >= 10 && v.length <= 13),
      "Informe o WhatsApp com DDD, somente números",
    ),
  alertsEnabled: z.boolean(),
})

export async function saveBotSettingsAction(
  input: z.input<typeof botSettingsSchema>,
): Promise<{ error?: string; success?: string }> {
  const parsed = botSettingsSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" }
  }

  const ctx = await requireStore()
  if (!ctx) return { error: "Loja não encontrada" }

  const { error } = await ctx.supabase
    .from("store_settings")
    .update({
      whatsapp_greeting_interval_minutes: parsed.data.greetingIntervalMinutes,
      whatsapp_alert_number: parsed.data.alertNumber || null,
      whatsapp_alerts_enabled: parsed.data.alertsEnabled,
    })
    .eq("store_id", ctx.store.id)

  if (error) {
    return {
      error:
        error.code === "42703"
          ? "Rode a migração 20260925130000_whatsapp_bot.sql no Supabase."
          : "Não foi possível salvar. Tente novamente.",
    }
  }

  revalidatePath("/whatsapp")
  return { success: "Configurações do robô salvas" }
}
