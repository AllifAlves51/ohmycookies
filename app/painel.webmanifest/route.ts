import { BRAND_COLOR, SITE_NAME } from "@/lib/site"

/** Separate installable app for the admin panel (the root manifest is the
 * customer-facing one). Installing matters beyond convenience: Chrome/Edge
 * let an installed app play sound without a click, so the new-order alarm
 * works as soon as the panel opens. */
export function GET() {
  return Response.json(
    {
      id: "/painel",
      name: `${SITE_NAME} · Painel`,
      short_name: "OMC Painel",
      description: "Painel de pedidos da Oh My Cookies",
      start_url: "/pedidos",
      scope: "/",
      display: "standalone",
      background_color: "#ffffff",
      theme_color: BRAND_COLOR,
      lang: "pt-BR",
      icons: [
        { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
        { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
        {
          src: "/icon-maskable-512.png",
          sizes: "512x512",
          type: "image/png",
          purpose: "maskable",
        },
      ],
    },
    { headers: { "Content-Type": "application/manifest+json" } },
  )
}
