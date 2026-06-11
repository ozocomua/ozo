"use client"

import { useEffect } from "react"
import { useRecentlyViewed } from "@/lib/recently-viewed-context"

export default function TrackRecentlyViewed({
  product,
}: {
  product: { id: number; name: string; slug: string; image: string; price: number }
}) {
  const { addItem } = useRecentlyViewed()

  useEffect(() => {
    addItem(product)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return null
}
