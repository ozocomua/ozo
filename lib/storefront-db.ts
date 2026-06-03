import { prisma } from "@/lib/prisma"

export type StorefrontPost = {
  id: number
  title: string
  slug: string
  content: string
  excerpt: string | null
  image: string | null
  status: string
  metaTitle: string | null
  metaDescription: string | null
  productIds: number[]
  ctaText: string | null
  ctaUrl: string | null
  createdAt: Date
}

export type StorefrontBrand = {
  id: number
  name: string
  slug: string
}

export type StorefrontCategory = {
  id: number
  slug: string
  name: string
  description: string
  imageUrl: string
}

export type StorefrontVariant = {
  id: number
  sku: string
  volume: string
  packageType: string
  priceRetail: number
  stock: number
}

export type StorefrontReview = {
  id: string
  rating: number
  comment: string | null
  userName: string
  createdAt: Date
}

export type StorefrontProduct = {
  id: number
  slug: string
  name: string
  sku: string
  description: string | null
  fullDescription: string | null
  metaTitle: string | null
  metaDescription: string | null
  seoAlt: string | null
  badge: string | null
  isPopular: boolean
  isNew: boolean
  relatedIds: number[]
  relatedLabels: Record<number, string>
  bundleProductId: number | null
  relatedVersions: { id: number; slug: string; name: string }[]
  reviews: StorefrontReview[]
  avgRating: number
  reviewCount: number
  image: string
  price: number
  oldPrice: number | null
  volume: string
  stock: number
  variants: StorefrontVariant[]
  images: string[]
  categorySlug: string | null
  brandName: string | null
}

function pickMainImage(imgs: { url: string; isMain?: boolean; sort?: number }[]): string {
  if (imgs.length === 0) return "/placeholder.jpg"
  const main = imgs.find((i) => i.isMain === true)
  if (main) return main.url
  return imgs[0].url
}

function pickDefaultVariant(variants: StorefrontVariant[]): StorefrontVariant | null {
  if (!variants.length) return null
  return variants[0]
}

export async function getTopCategories(): Promise<StorefrontCategory[]> {
  const categories = await prisma.category.findMany({
    where: { parentId: null },
    orderBy: { name: "asc" },
    select: { id: true, slug: true, name: true, description: true, imageUrl: true },
  })

  return categories.map((c) => ({
    id: c.id,
    slug: c.slug,
    name: c.name,
    description: c.description,
    imageUrl: c.imageUrl || "/placeholder.jpg",
  }))
}

export async function getCategoryBySlug(slug: string): Promise<StorefrontCategory | null> {
  const c = await prisma.category.findUnique({
    where: { slug },
    select: { id: true, slug: true, name: true, description: true, imageUrl: true },
  })
  if (!c) return null
  return {
    id: c.id,
    slug: c.slug,
    name: c.name,
    description: c.description,
    imageUrl: c.imageUrl || "/placeholder.jpg",
  }
}

export async function getSubcategories(parentId: number): Promise<StorefrontCategory[]> {
  const children = await prisma.category.findMany({
    where: { parentId },
    orderBy: { name: "asc" },
    select: { id: true, slug: true, name: true, description: true, imageUrl: true },
  })
  return children.map((c) => ({
    id: c.id,
    slug: c.slug,
    name: c.name,
    description: c.description,
    imageUrl: c.imageUrl || "/placeholder.jpg",
  }))
}

export async function getAllProducts(opts?: { limit?: number; skip?: number }): Promise<StorefrontProduct[]> {
  const limit = opts?.limit ?? 12
  const skip = opts?.skip ?? 0
  const products = await prisma.product.findMany({
    where: { isPublished: true },
    skip,
    take: limit,
    select: {
      id: true,
      slug: true,
      name: true,
      description: true,
      fullDescription: true,
      metaTitle: true,
      metaDescription: true,
      seoAlt: true,
      badge: true,
      isPopular: true,
      isNew: true,
      relatedIds: true,
      relatedLabels: true,
      bundleProductId: true,
      oldPrice: true,
      sku: true,
      brand: { select: { name: true } },
      categories: { select: { category: { select: { slug: true } } }, orderBy: { categoryId: "asc" }, take: 1 },
      images: { select: { url: true, sort: true, isMain: true }, orderBy: { sort: "asc" } },
      variants: { select: { id: true, sku: true, volume: true, packageType: true, priceRetail: true, stock: true }, orderBy: { id: "asc" } },
      relatedProducts: { select: { id: true, slug: true, name: true } },
      reviews: { select: { id: true, rating: true, comment: true, userName: true, createdAt: true }, orderBy: { createdAt: "desc" } },
    },
  })

  return products
    .map((p) => {
      const variants = p.variants.map((v) => ({
        id: v.id,
        sku: v.sku,
        volume: v.volume,
        packageType: v.packageType,
        priceRetail: v.priceRetail,
        stock: v.stock,
      }))
      const def = pickDefaultVariant(variants)
      const images = p.images.map((i) => i.url)
      const mainImage = pickMainImage(p.images)
      return {
        id: p.id,
        slug: p.slug,
        name: p.name,
        sku: p.sku,
        description: p.description,
        fullDescription: p.fullDescription,
        metaTitle: p.metaTitle ?? null,
        metaDescription: p.metaDescription ?? null,
        seoAlt: p.seoAlt ?? null,
        badge: p.badge,
        isPopular: p.isPopular,
        isNew: p.isNew,
        relatedIds: (p.relatedIds as number[]) ?? [],
        relatedLabels: (p.relatedLabels as Record<number, string>) ?? {},
        bundleProductId: p.bundleProductId ?? null,
        relatedVersions: [],
        reviews: [],
        avgRating: 0,
        reviewCount: 0,
        image: mainImage,
        price: def ? def.priceRetail : 0,
        oldPrice: p.oldPrice ?? null,
        volume: def?.volume ?? "",
        stock: def?.stock ?? 0,
        variants,
        images,
        categorySlug: p.categories[0]?.category.slug ?? null,
        brandName: p.brand?.name ?? null,
      }
    })
    .filter((p) => p.variants.length)
    .sort((a, b) => {
      if (a.stock === 0 && b.stock > 0) return 1
      if (b.stock === 0 && a.stock > 0) return -1
      return (b.isPopular ? 1 : 0) - (a.isPopular ? 1 : 0)
    })
}

export async function getPublishedPosts(opts?: { limit?: number; skip?: number }): Promise<StorefrontPost[]> {
  const limit = opts?.limit ?? 12
  const skip = opts?.skip ?? 0
  return prisma.post.findMany({
    where: { status: "PUBLISHED" },
    skip,
    take: limit,
    orderBy: { createdAt: "desc" },
  }) as Promise<StorefrontPost[]>
}

export async function countPublishedPosts(): Promise<number> {
  return prisma.post.count({ where: { status: "PUBLISHED" } })
}

export async function getPostBySlug(slug: string): Promise<StorefrontPost | null> {
  return prisma.post.findFirst({
    where: { slug, status: "PUBLISHED" },
  }) as Promise<StorefrontPost | null>
}

export async function getPostsByIds(ids: number[]): Promise<StorefrontPost[]> {
  if (!ids.length) return []
  return prisma.post.findMany({
    where: { id: { in: ids }, status: "PUBLISHED" },
  }) as Promise<StorefrontPost[]>
}

export async function countAllProducts(): Promise<number> {
  return prisma.product.count({ where: { isPublished: true, variants: { some: { id: { gt: 0 } } } } })
}

export async function countProductsByCategoryId(categoryId: number | number[]): Promise<number> {
  const ids = Array.isArray(categoryId) ? categoryId : [categoryId]
  return prisma.product.count({
    where: { isPublished: true, categories: { some: { categoryId: { in: ids } } }, variants: { some: { id: { gt: 0 } } } },
  })
}

export async function countProductsByBrandSlug(brandSlug: string): Promise<number> {
  return prisma.product.count({
    where: { isPublished: true, brand: { slug: brandSlug }, variants: { some: { id: { gt: 0 } } } },
  })
}

export async function getProductsByCategoryId(categoryId: number | number[], opts?: { limit?: number; skip?: number }): Promise<StorefrontProduct[]> {
  const limit = opts?.limit ?? 24
  const skip = opts?.skip ?? 0
  const categoryIds = Array.isArray(categoryId) ? categoryId : [categoryId]
  const products = await prisma.product.findMany({
    where: { isPublished: true, categories: { some: { categoryId: { in: categoryIds } } } },
    skip,
    take: limit,
    select: {
      id: true,
      slug: true,
      name: true,
      description: true,
      fullDescription: true,
      metaTitle: true,
      metaDescription: true,
      seoAlt: true,
      badge: true,
      isPopular: true,
      isNew: true,
      relatedIds: true,
      relatedLabels: true,
      bundleProductId: true,
      oldPrice: true,
      sku: true,
      brand: { select: { name: true } },
      categories: { select: { category: { select: { slug: true } } }, orderBy: { categoryId: "asc" }, take: 1 },
      images: { select: { url: true, sort: true, isMain: true }, orderBy: { sort: "asc" } },
      variants: { select: { id: true, sku: true, volume: true, packageType: true, priceRetail: true, stock: true }, orderBy: { id: "asc" } },
    },
  })

  return products
    .map((p) => {
      const variants = p.variants.map((v) => ({
        id: v.id,
        sku: v.sku,
        volume: v.volume,
        packageType: v.packageType,
        priceRetail: v.priceRetail,
        stock: v.stock,
      }))
      const def = pickDefaultVariant(variants)
      const images = p.images.map((i) => i.url)
      const mainImage = pickMainImage(p.images)
      return {
        id: p.id,
        slug: p.slug,
        name: p.name,
        sku: p.sku,
        description: p.description,
        fullDescription: p.fullDescription,
        metaTitle: null as string | null,
        metaDescription: null as string | null,
        seoAlt: null as string | null,
        badge: p.badge,
        isPopular: p.isPopular,
        isNew: p.isNew,
        relatedIds: (p.relatedIds as number[]) ?? [],
        relatedLabels: (p.relatedLabels as Record<number, string>) ?? {},
        bundleProductId: p.bundleProductId ?? null,
        relatedVersions: [],
        reviews: [],
        avgRating: 0,
        reviewCount: 0,
        image: mainImage,
        price: def ? def.priceRetail : 0,
        oldPrice: p.oldPrice ?? null,
        volume: def?.volume ?? "",
        stock: def?.stock ?? 0,
        variants,
        images,
        categorySlug: p.categories[0]?.category.slug ?? null,
        brandName: p.brand?.name ?? null,
      }
    })
    .filter((p) => p.variants.length)
    .sort((a, b) => {
      if (a.stock === 0 && b.stock > 0) return 1
      if (b.stock === 0 && a.stock > 0) return -1
      return (b.isPopular ? 1 : 0) - (a.isPopular ? 1 : 0)
    })
}

export async function getProductBySlug(slug: string): Promise<StorefrontProduct | null> {
  const p = await prisma.product.findUnique({
    where: { slug },
    select: {
      id: true,
      slug: true,
      name: true,
      description: true,
      fullDescription: true,
      metaTitle: true,
      metaDescription: true,
      seoAlt: true,
      badge: true,
      isPopular: true,
      isNew: true,
      relatedIds: true,
      relatedLabels: true,
      bundleProductId: true,
      isPublished: true,
      oldPrice: true,
      sku: true,
      brand: { select: { name: true } },
      categories: { select: { category: { select: { slug: true } } }, orderBy: { categoryId: "asc" }, take: 1 },
      images: { select: { url: true, sort: true, isMain: true }, orderBy: { sort: "asc" } },
      variants: { select: { id: true, sku: true, volume: true, packageType: true, priceRetail: true, stock: true }, orderBy: { id: "asc" } },
      relatedProducts: { select: { id: true, slug: true, name: true } },
      reviews: { select: { id: true, rating: true, comment: true, userName: true, createdAt: true }, orderBy: { createdAt: "desc" }, where: { isStoreReview: false, isPublished: true } },
    },
  })
  if (!p || !p.isPublished) return null

  const variants = p.variants.map((v) => ({
    id: v.id,
    sku: v.sku,
    volume: v.volume,
    packageType: v.packageType,
    priceRetail: v.priceRetail,
    stock: v.stock,
  }))
  const def = pickDefaultVariant(variants)
  const images = p.images.map((i) => i.url)
  const mainImage = pickMainImage(p.images)

  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    sku: p.sku,
    description: p.description,
    fullDescription: p.fullDescription,
    metaTitle: p.metaTitle ?? null,
    metaDescription: p.metaDescription ?? null,
    seoAlt: p.seoAlt ?? null,
    badge: p.badge,
    isPopular: p.isPopular,
    isNew: p.isNew,
    relatedIds: (p.relatedIds as number[]) ?? [],
    relatedLabels: (p.relatedLabels as Record<number, string>) ?? {},
    bundleProductId: p.bundleProductId ?? null,
    relatedVersions: p.relatedProducts ?? [],
    reviews: p.reviews ?? [],
    avgRating: (() => {
      const revs = (p.reviews ?? []).filter((r) => r.rating > 0)
      if (!revs.length) return 0
      const sum = revs.reduce((acc, r) => acc + r.rating, 0)
      return Math.round((sum / revs.length) * 10) / 10
    })(),
    reviewCount: (p.reviews ?? []).length,
    image: mainImage,
    price: def ? def.priceRetail : 0,
    oldPrice: p.oldPrice ?? null,
    volume: def?.volume ?? "",
    stock: def?.stock ?? 0,
    variants,
    images,
    categorySlug: p.categories[0]?.category.slug ?? null,
    brandName: p.brand?.name ?? null,
  }
}

export async function getProductsByIds(ids: number[]): Promise<StorefrontProduct[]> {
  if (!ids.length) return []
  const products = await prisma.product.findMany({
    where: { id: { in: ids }, isPublished: true },
    select: {
      id: true,
      slug: true,
      name: true,
      description: true,
      fullDescription: true,
      badge: true,
      isPopular: true,
      isNew: true,
      relatedIds: true,
      relatedLabels: true,
      bundleProductId: true,
      oldPrice: true,
      sku: true,
      brand: { select: { name: true } },
      categories: { select: { category: { select: { slug: true } } }, orderBy: { categoryId: "asc" }, take: 1 },
      images: { select: { url: true, sort: true, isMain: true }, orderBy: { sort: "asc" } },
      variants: { select: { id: true, sku: true, volume: true, packageType: true, priceRetail: true, stock: true }, orderBy: { id: "asc" } },
    },
  })

  return products
    .map((p) => {
      const variants = p.variants.map((v) => ({
        id: v.id,
        sku: v.sku,
        volume: v.volume,
        packageType: v.packageType,
        priceRetail: v.priceRetail,
        stock: v.stock,
      }))
      const def = pickDefaultVariant(variants)
      const images = p.images.map((i) => i.url)
      const mainImage = pickMainImage(p.images)
      return {
        id: p.id,
        slug: p.slug,
        name: p.name,
        sku: p.sku,
        description: p.description,
        fullDescription: p.fullDescription,
        badge: p.badge,
        isPopular: p.isPopular,
        isNew: p.isNew,
        relatedIds: (p.relatedIds as number[]) ?? [],
        relatedLabels: (p.relatedLabels as Record<number, string>) ?? {},
        bundleProductId: p.bundleProductId ?? null,
        relatedVersions: [],
        image: mainImage,
        price: def ? def.priceRetail : 0,
        oldPrice: p.oldPrice ?? null,
        volume: def?.volume ?? "",
        stock: def?.stock ?? 0,
        variants,
        images,
        categorySlug: p.categories[0]?.category.slug ?? null,
        brandName: p.brand?.name ?? null,
      }
    })
    .filter((p) => p.variants.length)
}

export async function getAllBrands(): Promise<StorefrontBrand[]> {
  const brands = await prisma.brand.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, slug: true },
  })
  return brands
}

export async function getBrandBySlug(slug: string): Promise<StorefrontBrand | null> {
  const b = await prisma.brand.findUnique({
    where: { slug },
    select: { id: true, name: true, slug: true },
  })
  return b ?? null
}

export async function getProductsByBrandSlug(brandSlug: string, opts?: { limit?: number; skip?: number }): Promise<StorefrontProduct[]> {
  const limit = opts?.limit ?? 24
  const skip = opts?.skip ?? 0
  const products = await prisma.product.findMany({
    where: { isPublished: true, brand: { slug: brandSlug } },
    skip,
    take: limit,
    select: {
      id: true,
      slug: true,
      name: true,
      description: true,
      fullDescription: true,
      badge: true,
      isPopular: true,
      isNew: true,
      relatedIds: true,
      relatedLabels: true,
      bundleProductId: true,
      oldPrice: true,
      sku: true,
      brand: { select: { name: true } },
      categories: { select: { category: { select: { slug: true } } }, orderBy: { categoryId: "asc" }, take: 1 },
      images: { select: { url: true, sort: true, isMain: true }, orderBy: { sort: "asc" } },
      variants: { select: { id: true, sku: true, volume: true, packageType: true, priceRetail: true, stock: true }, orderBy: { id: "asc" } },
    },
  })

  return products
    .map((p) => {
      const variants = p.variants.map((v) => ({
        id: v.id,
        sku: v.sku,
        volume: v.volume,
        packageType: v.packageType,
        priceRetail: v.priceRetail,
        stock: v.stock,
      }))
      const def = pickDefaultVariant(variants)
      const images = p.images.map((i) => i.url)
      const mainImage = pickMainImage(p.images)
      return {
        id: p.id,
        slug: p.slug,
        name: p.name,
        sku: p.sku,
        description: p.description,
        fullDescription: p.fullDescription,
        badge: p.badge,
        isPopular: p.isPopular,
        isNew: p.isNew,
        relatedIds: (p.relatedIds as number[]) ?? [],
        relatedLabels: (p.relatedLabels as Record<number, string>) ?? {},
        bundleProductId: p.bundleProductId ?? null,
        relatedVersions: [],
        image: mainImage,
        price: def ? def.priceRetail : 0,
        oldPrice: p.oldPrice ?? null,
        volume: def?.volume ?? "",
        stock: def?.stock ?? 0,
        variants,
        images,
        categorySlug: p.categories[0]?.category.slug ?? null,
        brandName: p.brand?.name ?? null,
      }
    })
    .filter((p) => p.variants.length)
    .sort((a, b) => {
      if (a.stock === 0 && b.stock > 0) return 1
      if (b.stock === 0 && a.stock > 0) return -1
      return (b.isPopular ? 1 : 0) - (a.isPopular ? 1 : 0)
    })
}

