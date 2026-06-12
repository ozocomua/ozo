/**
 * Fuzzy Search Utilities
 *
 * - Levenshtein distance (normalized 0..1)
 * - EN↔UA keyboard layout converter
 * - Query normalization pipeline
 */

/* ── EN ↔ UA Keyboard Mapping ─────────────────────────────── */

const EN_TO_UA: Record<string, string> = {
  "`": "'", "~": "ʼ",
  q: "й", w: "ц", e: "у", r: "к", t: "е", y: "н", u: "г", i: "ш", o: "щ", p: "з", "[": "х", "]": "ї",
  a: "ф", s: "і", d: "в", f: "а", g: "п", h: "р", j: "о", k: "л", l: "д", ";": "ж", "'": "є",
  z: "я", x: "ч", c: "с", v: "м", b: "и", n: "т", m: "ь", ",": "б", ".": "ю", "/": ".",
  Q: "Й", W: "Ц", E: "У", R: "К", T: "Е", Y: "Н", U: "Г", I: "Ш", O: "Щ", P: "З", "{": "Х", "}": "Ї",
  A: "Ф", S: "І", D: "В", F: "А", G: "П", H: "Р", J: "О", K: "Л", L: "Д", ":": "Ж", '"': "Є",
  Z: "Я", X: "Ч", C: "С", V: "М", B: "И", N: "Т", M: "Ь", "<": "Б", ">": "Ю", "?": ".",
}

const UA_TO_EN: Record<string, string> = Object.fromEntries(
  Object.entries(EN_TO_UA).map(([en, ua]) => [ua, en])
)

/**
 * Convert text typed in wrong keyboard layout.
 * "yfghedfkmybq" (EN layout) → "нагрівальний" (UA)
 * "руддщ" (EN layout for "hello") → "hello"
 */
export function convertLayout(text: string): string {
  let result = ""
  let enCount = 0
  let uaCount = 0

  for (const ch of text) {
    if (EN_TO_UA[ch]) enCount++
    if (UA_TO_EN[ch]) uaCount++
  }

  // If most chars match EN→UA mapping, user typed in EN layout
  const direction = enCount >= uaCount ? EN_TO_UA : UA_TO_EN

  for (const ch of text) {
    result += direction[ch] ?? ch
  }
  return result
}

/* ── Levenshtein Distance ──────────────────────────────────── */

/**
 * Damerau-Levenshtein distance (allows transpositions).
 * Returns raw edit count.
 */
export function levenshteinDistance(a: string, b: string): number {
  const m = a.length
  const n = b.length

  // Shortcut: if one is empty, distance = length of other
  if (m === 0) return n
  if (n === 0) return m

  // Use two rows for O(min(m,n)) space
  let prev = Array.from({ length: n + 1 }, (_, i) => i)
  let curr = new Array<number>(n + 1)

  for (let i = 1; i <= m; i++) {
    curr[0] = i
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      curr[j] = Math.min(
        prev[j] + 1,       // deletion
        curr[j - 1] + 1,   // insertion
        prev[j - 1] + cost, // substitution
      )
      // transposition (Damerau)
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        curr[j] = Math.min(curr[j], prev[j - 2] !== undefined ? (prev[j - 2] ?? 0) + cost : curr[j])
      }
    }
    ;[prev, curr] = [curr, prev]
  }

  return prev[n]
}

/**
 * Normalized similarity 0..1.
 * 1.0 = identical, > 0.7 = very similar
 */
export function similarity(a: string, b: string): number {
  const maxLen = Math.max(a.length, b.length)
  if (maxLen === 0) return 1
  return 1 - levenshteinDistance(a, b) / maxLen
}

/* ── Query Normalization ───────────────────────────────────── */

export interface NormalizedQuery {
  /** Original user input */
  raw: string
  /** Lowercase, trimmed, layout-converted */
  normalized: string
  /** Words split by whitespace */
  words: string[]
  /** Did layout conversion happen? */
  layoutConverted: boolean
}

export function normalizeQuery(raw: string): NormalizedQuery {
  const trimmed = raw.trim().toLowerCase()
  const converted = convertLayout(trimmed)
  const layoutConverted = converted !== trimmed

  // Remove repeated spaces and special chars except Ukrainian letters
  const cleaned = converted
    .replace(/[ʼ']/g, "") // remove apostrophe variants
    .replace(/[^\wа-яіїєґ\s]/gi, " ") // keep only word chars
    .replace(/\s+/g, " ")
    .trim()

  const words = cleaned.split(/\s+/).filter(Boolean)

  return { raw: trimmed, normalized: cleaned, words, layoutConverted }
}

/* ── Text Normalization for Matching ───────────────────────── */

/**
 * Strip text for comparison: lowercase, no punctuation, no extra spaces
 */
export function normalizeText(text: string | null | undefined): string {
  if (!text) return ""
  return text
    .toLowerCase()
    .replace(/[ʼ']/g, "")
    .replace(/[^\wа-яіїєґ\s]/gi, " ")
    .replace(/\s+/g, " ")
    .trim()
}
