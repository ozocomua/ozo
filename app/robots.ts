import type { MetadataRoute } from "next"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/api/image/",
        disallow: ["/admin", "/api/", "/checkout/success"],
      },
    ],
    sitemap: `${process.env.NEXT_PUBLIC_SITE_URL?.trim() || "http://localhost:3002"}/sitemap.xml`,
  }
}
