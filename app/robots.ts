import type { MetadataRoute } from "next"
import { getSiteUrl } from "@/lib/site"

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl()

  return {
    rules: {
      userAgent: "*",
      allow: "/cardapio/",
      // Admin panel, auth screens and per-order tracking pages are private.
      disallow: [
        "/dashboard",
        "/pedidos",
        "/produtos",
        "/clientes",
        "/cupons",
        "/entrega",
        "/relatorios",
        "/configuracoes",
        "/login",
        "/cadastro",
        "/esqueci-senha",
        "/redefinir-senha",
        "/auth/",
        "/cardapio/*/pedido/",
      ],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  }
}
