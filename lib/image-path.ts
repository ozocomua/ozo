export function normalizeImageUrl(src: string): string {
  if (!src) return "/placeholder.jpg"
  if (src.startsWith("/uploads/")) {
    return `/api/image/${src.replace("/uploads/", "")}`
  }
  return src
}
