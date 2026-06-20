"use client"

import { useState } from "react"
import { Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { regenerateAllSeo } from "@/app/actions/catalog"

export default function RegenerateSeoButton() {
  const [loading, setLoading] = useState(false)

  const handleClick = async () => {
    setLoading(true)
    try {
      const result = await regenerateAllSeo()
      if (result.success) {
        toast.success(`SEO оновлено для ${result.count} товарів`)
      } else {
        toast.error(result.error || "Помилка")
      }
    } catch {
      toast.error("Помилка мережі")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleClick}
      disabled={loading}
      className="gap-1.5 text-xs"
    >
      <Sparkles size={13} />
      {loading ? "Оновлення..." : "Оновити SEO всім товарам"}
    </Button>
  )
}
