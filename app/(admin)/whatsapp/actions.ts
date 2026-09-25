"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"
import { getStoreByOwnerId } from "@/lib/services/store"
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
