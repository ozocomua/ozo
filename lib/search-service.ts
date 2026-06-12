/**
 * Fuzzy Search Service
 *
 * 1. Try exact MySQL `contains` first (fast path)
 * 2. If < 3 results, run fuzzy matching in TypeScript
 * 3. Return results + optional "did you mean" suggestion
 *
 * Weights:  name ⨉ 3,  category ⨉ 2,  description ⨉ 1
 */

import { prisma } from "@/lib/prisma"
import {
  type NormalizedQuery,
  normalizeQuery,
  normalizeText,
  similarity,
} from "./search-utils"

/* ── Types ─────────────────────────────────────────────────── */

export interface SearchResult {
  id: number
  name: string
  slug: string
  price: number
  oldPrice: number | null
  image: string | null
}

export interface SearchResponse {
  products: SearchResult[]
  suggestion: string | null
  fuzzy: boolean
}

/* ── Weights ────────────────────────────────────────────────── */

const WEIGHT_NAME = 3
const WEIGHT_CATEGORY = 2
const WEIGHT_DESC = 1

/* ── Fuzzy Match Helper ─────────────────────────────────────── */

interface CandidateMatch {
  id: number
  name: string
  nameNorm: string
  descNorm: string
  catNorm: string
  slug: string
  price: number
  oldPrice: number | null
  image: string | null
  score: number
  matchedWord: string
}

/**
 * Compute fuzzy score for each candidate vs query words.
 * Higher score = better match.
 */
function scoreCandidates(
  query: NormalizedQuery,
  candidates: Array<{
    id: number
    name: string
    slug: string
    price: number
    oldPrice: number | null
    description: string | null
    categoryNames: string
    image: string | null
  }>,
  minScore: number = 0.4,
): CandidateMatch[] {
  const results: CandidateMatch[] = []

  for (const c of candidates) {
    const nameNorm = normalizeText(c.name)
    const descNorm = normalizeText(c.description)
    const catNorm = normalizeText(c.categoryNames)

    let bestScore = 0
    let matchedWord = ""

    for (const word of query.words) {
      if (word.length < 2) continue

      // Name match (highest weight)
      const nameSim = similarity(word, nameNorm)
      // Partial: does name contain the word exactly?
      const nameContains = nameNorm.includes(word) ? 1 : 0

      // Category match
      const catSim = similarity(word, catNorm)
      const catContains = catNorm.includes(word) ? 1 : 0

      // Description match
      const descSim = similarity(word, descNorm)
      const descContains = descNorm.includes(word) ? 1 : 0

      // Weighted score for this word against this candidate
      const wordScore =
        (Math.max(nameSim, nameContains) * WEIGHT_NAME +
          Math.max(catSim, catContains) * WEIGHT_CATEGORY +
          Math.max(descSim, descContains) * WEIGHT_DESC) /
        (WEIGHT_NAME + WEIGHT_CATEGORY + WEIGHT_DESC)

      if (wordScore > bestScore) {
        bestScore = wordScore
        matchedWord = word
      }
    }

    // Also try full normalized query against name (for multi-word queries)
    if (query.normalized.length >= 3) {
      const fullNameSim = similarity(query.normalized, nameNorm)
      const fullNameScore = fullNameSim * WEIGHT_NAME / WEIGHT_NAME
      if (fullNameScore > bestScore) {
        bestScore = fullNameScore
        matchedWord = query.normalized
      }
    }

    if (bestScore >= minScore) {
      results.push({
        id: c.id,
        name: c.name,
        nameNorm,
        descNorm,
        catNorm,
        slug: c.slug,
        price: c.price,
        oldPrice: c.oldPrice,
        image: c.image,
        score: bestScore,
        matchedWord,
      })
    }
  }

  // Sort by score descending
  results.sort((a, b) => b.score - a.score)
  return results
}

/* ── "Did you mean" Generator ───────────────────────────────── */

function findSuggestion(query: NormalizedQuery, matches: CandidateMatch[]): string | null {
  if (matches.length === 0) return null

  const queryWords = query.normalized.split(/\s+/).filter((w) => w.length >= 2)
  if (queryWords.length === 0) return null

  // For each query word, check if it's significantly different from the best matched name word
  const suggestions: string[] = []

  for (const qw of queryWords) {
    // Find the closest name word among top matches
    let bestWord = ""
    let bestSim = 0
    for (const m of matches.slice(0, 3)) {
      const nameWords = m.nameNorm.split(/\s+/)
      for (const nw of nameWords) {
        if (nw.length < 2) continue
        const sim = similarity(qw, nw)
        if (sim > bestSim) {
          bestSim = sim
          bestWord = nw
        }
      }
    }

    // Suggest if word is somewhat close but not very close (0.35 - 0.80 similarity)
    if (bestSim >= 0.35 && bestSim <= 0.80 && bestWord !== qw) {
      suggestions.push(bestWord)
    }
  }

  if (suggestions.length === 0) return null

  // Return the first meaningful suggestion
  return suggestions[0]
}

/* ── Main Search Function ───────────────────────────────────── */

export async function fuzzySearch(rawQuery: string): Promise<SearchResponse> {
  const query = normalizeQuery(rawQuery)

  if (query.normalized.length < 2) {
    return { products: [], suggestion: null, fuzzy: false }
  }

  // ── Phase 1: Exact MySQL contains ───────────────────────────
  const exactProducts = await prisma.product.findMany({
    where: {
      isPublished: true,
      OR: [
        { name: { contains: query.normalized } },
        { sku: { contains: query.normalized } },
        { description: { contains: query.normalized } },
        { categories: { some: { category: { name: { contains: query.normalized } } } } },
      ],
    },
    take: 8,
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      slug: true,
      price: true,
      oldPrice: true,
      images: { select: { url: true }, take: 1 },
    },
  })

  // If we got enough exact results, return them directly
  if (exactProducts.length >= 3) {
    return {
      products: exactProducts.map((p) => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        price: p.price,
        oldPrice: p.oldPrice,
        image: p.images[0]?.url ?? null,
      })),
      suggestion: null,
      fuzzy: false,
    }
  }

  // ── Phase 2: Fuzzy search ───────────────────────────────────
  // Fetch wider pool of published products
  const pool = await prisma.product.findMany({
    where: { isPublished: true },
    take: 50,
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      name: true,
      slug: true,
      price: true,
      oldPrice: true,
      description: true,
      images: { select: { url: true }, take: 1 },
      categories: {
        select: { category: { select: { name: true } } },
        take: 3,
      },
    },
  })

  const candidates = pool.map((p) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    price: p.price,
    oldPrice: p.oldPrice,
    description: p.description,
    categoryNames: p.categories.map((c) => c.category.name).join(" "),
    image: p.images[0]?.url ?? null,
  }))

  // Score with fuzzy matching
  const fuzzyResults = scoreCandidates(query, candidates)

  // Merge: keep exact matches on top, then fuzzy
  const exactIds = new Set(exactProducts.map((p) => p.id))
  const merged: SearchResult[] = [
    ...exactProducts.map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      price: p.price,
      oldPrice: p.oldPrice,
      image: p.images[0]?.url ?? null,
    })),
    ...fuzzyResults
      .filter((f) => !exactIds.has(f.id))
      .slice(0, 8)
      .map((f) => ({
        id: f.id,
        name: f.name,
        slug: f.slug,
        price: f.price,
        oldPrice: f.oldPrice,
        image: f.image,
      })),
  ].slice(0, 8)

  // Generate "did you mean" suggestion
  const suggestion = findSuggestion(query, fuzzyResults)

  return {
    products: merged,
    suggestion: query.layoutConverted || merged.length > 0 ? suggestion : null,
    fuzzy: exactProducts.length < 3,
  }
}
