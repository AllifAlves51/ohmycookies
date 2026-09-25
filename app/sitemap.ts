import type { MetadataRoute } from "next"
import { createClient } from "@supabase/supabase-js"
import { getSiteUrl } from "@/lib/site"

// Regenerate hourly so new/renamed stores show up without a redeploy.
export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl()
  // Cookie-less client: the sitemap is public and stores are publicly readable.
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  const { data: stores } = await supabase
    .from("stores")
    .select("slug, updated_at")

  return (stores ?? []).map((store) => ({
    url: `${siteUrl}/cardapio/${store.slug}`,
    lastModified: store.updated_at,
    changeFrequency: "daily",
    priority: 1,
  }))
}
