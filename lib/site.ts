export const SITE_NAME = "Oh My Cookies"

export const SITE_DESCRIPTION =
  "Cookies artesanais feitos com carinho. Veja o cardápio, monte seu pedido e receba em casa ou retire na loja."

export const BRAND_COLOR = "#E10619"

/** Canonical origin used for absolute URLs (Open Graph, sitemap, robots).
 * Set NEXT_PUBLIC_SITE_URL once a custom domain is live; until then the
 * Vercel production domain is used. */
export function getSiteUrl() {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "")
  }
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  }
  return "http://localhost:3000"
}
