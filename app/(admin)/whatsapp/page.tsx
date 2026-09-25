import { createClient } from "@/lib/supabase/server"
import { getStoreByOwnerId, getStoreSettings } from "@/lib/services/store"
import { resolveTemplates } from "@/lib/whatsapp-templates"
import { getSiteUrl } from "@/lib/site"
import { WhatsappMessagesEditor } from "@/components/admin/whatsapp/messages-editor"
import { WhatsappConnectionCard } from "@/components/admin/whatsapp/connection-card"
import { getWhatsappStatusAction } from "@/app/(admin)/whatsapp/actions"

export const metadata = { title: "WhatsApp" }

export default async function WhatsappPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  const { data: store } = await getStoreByOwnerId(supabase, user.id)

  if (!store) {
    return (
      <main className="p-6">
        <p className="text-muted-foreground text-sm">
          Não foi possível carregar os dados da loja. Tente recarregar a página.
        </p>
      </main>
    )
  }

  const [{ data: settings }, status] = await Promise.all([
    getStoreSettings(supabase, store.id),
    getWhatsappStatusAction(),
  ])

  return (
    <main className="mx-auto w-full max-w-5xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold">WhatsApp</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Personalize as mensagens enviadas aos seus clientes.
        </p>
      </div>
      <WhatsappConnectionCard
        initialStatus={status}
        storeWhatsapp={store.whatsapp_number}
        initialSettings={{
          greetingIntervalMinutes:
            settings?.whatsapp_greeting_interval_minutes ?? 90,
          alertNumber: settings?.whatsapp_alert_number ?? "",
          alertsEnabled: settings?.whatsapp_alerts_enabled ?? true,
        }}
      />
      <WhatsappMessagesEditor
        menuUrl={`${getSiteUrl()}/cardapio/${store.slug}`}
        storeName={store.name}
        initialTemplates={resolveTemplates(settings?.whatsapp_templates)}
      />
    </main>
  )
}
