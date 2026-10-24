import { createClient } from "@/lib/supabase/server"
import { getStoreByOwnerId, getStoreSettings } from "@/lib/services/store"
import { firstNameFromEmail } from "@/lib/utils/user"
import { AvatarUploadForm } from "@/components/admin/settings/avatar-upload-form"
import { LogoUploadForm } from "@/components/admin/settings/logo-upload-form"
import { LoginPhotoForm } from "@/components/admin/settings/login-photo-form"
import { StoreInfoForm } from "@/components/admin/settings/store-info-form"
import { StoreLinksForm } from "@/components/admin/settings/store-links-form"
import { OpeningHoursForm } from "@/components/admin/settings/opening-hours-form"
import { OrderSettingsForm } from "@/components/admin/settings/order-settings-form"
import { AutoPrintCard } from "@/components/admin/settings/auto-print-card"
import { SeasonalThemeForm } from "@/components/admin/settings/seasonal-theme-form"
import { PageHeader } from "@/components/admin/page-header"
import { isSeasonalThemeSetting } from "@/lib/seasonal-themes"

export default async function ConfiguracoesPage() {
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
  const { data: latestOrder } = await supabase
    .from("orders")
    .select("id")
    .eq("store_id", store.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<{ id: string }>()
  const theme = settings?.seasonal_theme
  const avatarUrl =
    typeof user.user_metadata?.avatar_url === "string"
      ? user.user_metadata.avatar_url
      : null

  return (
    <main className="mx-auto max-w-3xl space-y-6 px-4 py-6 sm:px-8 sm:py-8">
      <PageHeader
        title="Configurações"
        description="Dados da loja, aparência do cardápio e regras de pedido."
      />
      <AvatarUploadForm
        avatarUrl={avatarUrl}
        initial={firstNameFromEmail(user.email ?? "").charAt(0)}
      />
      <LogoUploadForm logoUrl={store.logo_url} />
      <LoginPhotoForm loginPhotoUrl={store.login_photo_url} />
      <StoreInfoForm store={store} />
      <StoreLinksForm store={store} />
      <OpeningHoursForm openingHours={store.opening_hours} />
      {settings ? <OrderSettingsForm settings={settings} /> : null}
      <AutoPrintCard latestOrderId={latestOrder?.id ?? null} />
      <SeasonalThemeForm
        storeSlug={store.slug}
        available={settings?.seasonal_theme !== undefined}
        current={isSeasonalThemeSetting(theme) ? theme : "none"}
      />
    </main>
  )
}
