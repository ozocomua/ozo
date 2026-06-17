/**
 * Strip formatting: "+38 (097) 233-63-21" → "380972336321"
 */
export function stripPhoneFormatting(raw: string): string {
  return raw.replace(/\D/g, "")
}

/**
 * Check if phone is a valid Ukrainian number (12 digits starting with 38).
 */
export function isValidPhone(raw: string): boolean {
  const digits = stripPhoneFormatting(raw)
  return digits.length === 12 && digits.startsWith("38")
}
export function formatPhone(raw: string | null | undefined): string {
  if (!raw) return ""
  const digits = raw.replace(/\D/g, "")

  // Normalize to 12-digit format (38XXXXXXXXXX)
  let normalized = digits
  if (digits.length === 10 && digits.startsWith("0")) {
    normalized = "38" + digits
  } else if (digits.length === 9 && digits.startsWith("0")) {
    normalized = "380" + digits.slice(1)
  } else if (digits.length === 11 && digits.startsWith("8")) {
    normalized = "3" + digits
  } else if (digits.length < 10) {
    return "+" + digits // too short, return as-is
  }

  if (normalized.length < 12) return "+" + normalized

  const code = normalized.slice(2, 5)  // 097
  const p1 = normalized.slice(5, 8)    // 233
  const p2 = normalized.slice(8, 10)   // 63
  const p3 = normalized.slice(10, 12)  // 21

  return `+38 (${code}) ${p1}-${p2}-${p3}`
}

/**
 * Format phone for display in Telegram (no Markdown escaping needed for numbers).
 */
export function formatPhoneTelegram(raw: string | null | undefined): string {
  return formatPhone(raw)
}

/**
 * Apply input mask while typing.
 * Keeps cursor at correct position.
 *
 * Usage in onChange:
 *   handlePhoneChange(e, setValue)
 */
export function maskPhoneInput(value: string): { masked: string; cursor: number } {
  const digits = value.replace(/\D/g, "")

  // Ensure it starts with 380
  let d = digits
  if (d.startsWith("0")) d = "38" + d
  if (!d.startsWith("38")) d = "38" + d
  d = d.slice(0, 12)

  if (d.length <= 2) return { masked: "+38", cursor: 4 }
  if (d.length <= 5) return { masked: `+38 (${d.slice(2)}`, cursor: 6 + (d.length - 2) }

  const code = d.slice(2, 5)
  const rest = d.slice(5)
  let masked = `+38 (${code}) `

  if (rest.length <= 3) {
    masked += rest
    return { masked, cursor: 9 + rest.length }
  }
  if (rest.length <= 5) {
    masked += `${rest.slice(0, 3)}-${rest.slice(3)}`
    return { masked, cursor: 10 + rest.length }
  }
  // Full number
  masked += `${rest.slice(0, 3)}-${rest.slice(3, 5)}-${rest.slice(5)}`
  return { masked, cursor: masked.length }
}
