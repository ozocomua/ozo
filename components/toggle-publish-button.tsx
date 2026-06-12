"use client"

import { useState } from "react"
import { Eye, EyeOff } from "lucide-react"

export default function TogglePublishButton({
  productId,
  initialPublished,
}: {
  productId: number
  initialPublished: boolean
}) {
  const [published, setPublished] = useState(initialPublished)
  const [loading, setLoading] = useState(false)

  const toggle = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/catalog/products/${productId}/toggle-visibility`, {
        method: "POST",
      })
      if (res.ok) {
        const data = await res.json()
        setPublished(data.isPublished)
      }
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`p-1.5 rounded-lg transition-colors ${
        published
          ? "text-green-600 bg-green-50 hover:bg-green-100"
          : "text-muted-foreground bg-muted hover:bg-border"
      }`}
      title={published ? "Приховати товар" : "Показати товар"}
    >
      {published ? <Eye size={16} /> : <EyeOff size={16} />}
    </button>
  )
}
