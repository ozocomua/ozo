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

const STORE_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "OnlineStore",
  name: "Brosco Design",
  url: "https://brosco.com.ua",
  logo: "https://brosco.com.ua/logo.png",
  description:
    "Преміальна автохімія на розлив. Засоби для догляду за склом, кузовом та інтер'єром авто. Вигідні ціни та швидка доставка Новою Поштою по Україні 1-3 дні.",
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
