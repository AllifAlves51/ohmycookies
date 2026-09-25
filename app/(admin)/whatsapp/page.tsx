import { createClient } from "@/lib/supabase/server"
import { getStoreByOwnerId, getStoreSettings } from "@/lib/services/store"
import { resolveTemplates } from "@/lib/whatsapp-templates"
import { getSiteUrl } from "@/lib/site"
import { WhatsappMessagesEditor } from "@/components/admin/whatsapp/messages-editor"

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

  const { data: settings } = await getStoreSettings(supabase, store.id)

  return (
    <main className="mx-auto w-full max-w-5xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold">WhatsApp</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Personalize as mensagens enviadas aos seus clientes.
        </p>
      </div>
      <WhatsappMessagesEditor
        menuUrl={`${getSiteUrl()}/cardapio/${store.slug}`}
        storeName={store.name}
        initialTemplates={resolveTemplates(settings?.whatsapp_templates)}
      />
    </main>
  )
}
