"use client"

import { useEffect } from "react"

export default function JsonLd({ data }: { data: object }) {
  useEffect(() => {
    const script = document.createElement("script")
    script.type = "application/ld+json"
    script.textContent = JSON.stringify(data)
    document.head.appendChild(script)
    return () => {
      script.remove()
    }
  }, [data])

  return null
}

const STORE_BASE = process.env.NEXT_PUBLIC_SITE_URL?.trim() || ""

const STORE_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "OnlineStore",
  name: "OZO",
  url: STORE_BASE,
  logo: `${STORE_BASE}/logo.png`,
  description:
    "Товари ручної роботи, зроблено в Україні з турботою. Інфрачервоні нагрівальні килимки та вироби ручної роботи. Доставка Новою Поштою по Україні 1-3 дні.",
}

export function StoreSchema() {
  useEffect(() => {
    const script = document.createElement("script")
    script.type = "application/ld+json"
    script.textContent = JSON.stringify(STORE_SCHEMA)
    document.head.appendChild(script)
    return () => {
      script.remove()
    }
  }, [])
  return null
}
