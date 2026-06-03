export function stripHtml(html: string | null | undefined): string {
  if (!html) return ""
  return html
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/\u00a0/g, " ")
    .trim()
}

export function truncate(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text
  return text.slice(0, maxLen).replace(/\s+\S*$/, "") + "…"
}

export function cleanMetaDescription(metaDesc: string | null | undefined, description: string | null | undefined, fallbackName: string): string {
  const fromMeta = metaDesc?.trim()
  if (fromMeta) return truncate(stripHtml(fromMeta), 155)

  const fromDesc = description?.trim()
  if (fromDesc) return truncate(stripHtml(fromDesc), 155)

  return truncate(stripHtml(fallbackName), 155)
}

export function cleanMetaTitle(metaTitle: string | null | undefined, productName: string): string {
  const fromMeta = metaTitle?.trim()
  if (fromMeta) return stripHtml(fromMeta)
  return stripHtml(productName)
}

export function cleanSeoAlt(seoAlt: string | null | undefined, productName: string): string {
  const fromAlt = seoAlt?.trim()
  if (fromAlt) return stripHtml(fromAlt)
  return stripHtml(productName)
}
