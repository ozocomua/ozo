"use client"

import { usePathname } from "next/navigation"
import CallbackWidget from "@/components/ui/callbackwidget"

export default function CallbackWidgetWrapper() {
  const pathname = usePathname()

  // Hide on admin pages
  if (pathname.startsWith("/admin")) return null

  return <CallbackWidget />
}
