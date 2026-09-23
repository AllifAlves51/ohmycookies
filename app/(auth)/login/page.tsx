import { createClient } from "@/lib/supabase/server"
import { getLoginPhoto } from "@/lib/services/store"
import { LoginClient } from "./login-client"

export default async function LoginPage() {
  const supabase = await createClient()
  const { data } = await getLoginPhoto(supabase)

  return <LoginClient loginPhotoUrl={data?.login_photo_url ?? null} />
}
