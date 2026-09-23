import { createClient } from "@/lib/supabase/server"
import { getLoginPhoto } from "@/lib/services/store"
import { CadastroClient } from "./cadastro-client"

export default async function CadastroPage() {
  const supabase = await createClient()
  const { data } = await getLoginPhoto(supabase)

  return <CadastroClient loginPhotoUrl={data?.login_photo_url ?? null} />
}
