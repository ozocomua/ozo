"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { slugify } from "@/lib/slug";

export async function generateSku(): Promise<string> {
  const products = await prisma.product.findMany({
    select: { sku: true },
    orderBy: { id: "desc" },
    take: 50,
  })

  let maxNum = 0
  for (const p of products) {
    const m = p.sku.match(/^A(\d+)$/)
    if (m) {
      const n = parseInt(m[1], 10)
      if (n > maxNum) maxNum = n
    }
  }

  const count = await prisma.product.count()
  const nextNum = Math.max(count, maxNum) + 1
  return `A${String(nextNum).padStart(6, "0")}`
}

export async function createBrand(name: string) {
  if (!name?.trim()) return { success: false, error: "Название обязательно" }
  const slug = slugify(name)
  try {
    const brand = await prisma.brand.create({ data: { name: name.trim(), slug } })
    revalidatePath("/admin/catalog")
    return { success: true, data: brand }
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Ошибка"
    return { success: false, error: message }
  }
}

export async function createCategory(data: {
  name: string;
  slug?: string;
  description?: string;
  imageUrl?: string;
  parentId?: number | null;
  metaTitle?: string;
  metaDescription?: string;
  seoAlt?: string;
}) {
  if (!data.name?.trim()) return { success: false, error: "Название обязательно" }
  const slug = data.slug?.trim() || slugify(data.name)
  const metaTitle = data.metaTitle?.trim() || `${data.name.trim()} | OZO`
  const metaDescription = data.metaDescription?.trim() || (data.description || "").slice(0, 150)
  const seoAlt = data.seoAlt?.trim() || data.name.trim()
  try {
    const category = await prisma.category.create({
      data: {
        name: data.name.trim(),
        slug,
        description: data.description || "",
        imageUrl: data.imageUrl || "",
        parentId: data.parentId ?? null,
        metaTitle,
        metaDescription,
        seoAlt,
      },
    })
    revalidatePath("/admin/catalog")
    return { success: true, data: category }
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Ошибка"
    return { success: false, error: message }
  }
}

export async function updateCategory(
  categoryId: number,
  data: {
    name: string;
    slug?: string;
    description?: string;
    imageUrl?: string;
    parentId?: number | null;
    metaTitle?: string;
    metaDescription?: string;
    seoAlt?: string;
  }
) {
  if (!data.name?.trim()) return { success: false, error: "Название обязательно" }
  const slug = data.slug?.trim() || slugify(data.name)
  const metaTitle = data.metaTitle?.trim() || `${data.name.trim()} | OZO`
  const metaDescription = data.metaDescription?.trim() || (data.description || "").slice(0, 150)
  const seoAlt = data.seoAlt?.trim() || data.name.trim()
  try {
    const category = await prisma.category.update({
      where: { id: categoryId },
      data: {
        name: data.name.trim(),
        slug,
        description: data.description || "",
        imageUrl: data.imageUrl || "",
        parentId: data.parentId ?? null,
        metaTitle,
        metaDescription,
        seoAlt,
      },
    })
    revalidatePath("/admin/catalog")
    return { success: true, data: category }
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Ошибка"
    return { success: false, error: message }
  }
}

export async function deleteCategory(categoryId: number) {
  try {
    const childCount = await prisma.category.count({ where: { parentId: categoryId } })
    if (childCount > 0) {
      return { success: false, error: "Сначала удалите подкатегории" }
    }
    const productCount = await prisma.productCategory.count({ where: { categoryId } })
    if (productCount > 0) {
      return { success: false, error: "Сначала отвяжите товары от этой категории" }
    }
    await prisma.category.delete({ where: { id: categoryId } })
    revalidatePath("/admin/catalog")
    return { success: true }
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Ошибка"
    return { success: false, error: message }
  }
}

export async function createProduct(data: {
  name: string;
  sku: string;
  slug?: string;
  description?: string;
  fullDescription?: string;
  metaTitle?: string;
  metaDescription?: string;
  seoAlt?: string;
  brandId?: number;
  status: "DRAFT" | "PUBLISHED";
  price: number;
  stock: number;
  volume?: string;
  productType?: string;
  variants?: { size: string; price: number }[];
  oldPrice?: number | null;
  isPopular?: boolean;
  isNew?: boolean;
  relatedIds?: number[];
  relatedProductIds?: number[];
  relatedLabels?: Record<number, string>;
  bundleProductId?: number | null;
  categoryIds: { id: number; isMain: boolean }[];
  mediaFiles?: { url: string; isMain: boolean; order: number; alt?: string }[];
}) {
  try {
    const existingSku = await prisma.product.findUnique({
      where: { sku: data.sku },
    });
    if (existingSku) {
      return { success: false, error: "Такой SKU уже существует" };
    }

    const isPublished = data.status === "PUBLISHED";
    const slug = data.slug?.trim() || slugify(data.name)
    const metaTitle = data.metaTitle?.trim() || `${data.name.trim()} | OZO`
    const metaDescription = data.metaDescription?.trim() || (data.description || "").slice(0, 150)
    const seoAlt = data.seoAlt?.trim() || data.name.trim()

    const product = await prisma.product.create({
      data: {
        name: data.name,
        sku: data.sku,
        slug,
        description: data.description || "",
        fullDescription: data.fullDescription || data.description || "",
        metaTitle,
        metaDescription,
        seoAlt,
        brandId: data.brandId || null,
        isPublished,
        badge: data.isNew ? "Новинка" : null,
        price: data.price,
        stock: data.stock ?? 0,
        volume: data.volume,
        productType: data.productType ?? "SINGLE",
        oldPrice: data.oldPrice ?? null,
        isPopular: data.isPopular === true,
        isNew: data.isNew === true,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        relatedIds: (data.relatedIds ?? []) as any,
        relatedLabels: (data.relatedLabels ?? {}) as any,
        relatedProducts: data.relatedProductIds?.length
          ? { connect: data.relatedProductIds.map((id) => ({ id })) }
          : undefined,
        bundleProductId: data.bundleProductId ?? null,
        images: {
          create: (data.mediaFiles ?? []).map((m) => ({
            url: m.url,
            alt: m.alt || data.name,
            isMain: m.isMain,
            sort: m.order,
          })),
        },
        categories: {
          create: data.categoryIds.map((c) => ({
            categoryId: c.id,
            isMain: c.isMain,
          })),
        },
        variants: {
          create: (data.variants && data.variants.length > 0
            ? data.variants.map((v) => ({
                sku: `${data.sku}-${v.size.replace(/\s+/g, "-")}`,
                size: v.size,
                volume: v.size,
                packageType: "",
                priceRetail: v.price,
                stock: data.stock ?? 0,
              }))
            : [{
                sku: data.sku,
                volume: data.volume || "",
                packageType: "",
                size: null,
                priceRetail: data.price,
                stock: data.stock ?? 0,
              }]
          ),
        },
      },
    });

    revalidatePath("/admin/catalog");
    return { success: true, data: product };
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Ошибка";
    return { success: false, error: message };
  }
}

export async function duplicateProduct(productId: number) {
  try {
    const src = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        variants: true,
        categories: true,
        images: true,
      },
    });
    if (!src) return { success: false, error: "Товар не найден" };

    const dup = await prisma.product.create({
      data: {
        name: `${src.name} (копия)`,
        sku: `COPY-${Date.now()}`,
        slug: slugify(`${src.name}-copy-${Date.now()}`),
        description: src.description,
        fullDescription: src.fullDescription,
        metaTitle: src.metaTitle ? `${src.metaTitle} (копия)` : null,
        metaDescription: src.metaDescription,
        seoAlt: src.seoAlt ? `${src.seoAlt} (копия)` : null,
        isPublished: false,
        badge: null,
        price: src.price,
        stock: src.stock,
        volume: src.volume,
        productType: src.productType,
        oldPrice: src.oldPrice,
        isPopular: src.isPopular,
        isNew: src.isNew,
        relatedIds: src.relatedIds as any,
        bundleProductId: src.bundleProductId,
        brandId: src.brandId,
        images: {
          create: src.images.map((i) => ({
            url: i.url,
            alt: i.alt,
            isMain: i.isMain,
            sort: i.sort,
          })),
        },
        categories: {
          create: src.categories.map((c) => ({
            categoryId: c.categoryId,
            isMain: c.isMain,
          })),
        },
        variants: {
          create: src.variants.map((v) => ({
            sku: `COPY-${v.sku}`.slice(0, 191),
            volume: v.volume,
            packageType: v.packageType,
            priceRetail: v.priceRetail,
            stock: v.stock,
          })),
        },
      },
    });

    revalidatePath("/admin/catalog");
    return { success: true, data: dup };
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Ошибка";
    return { success: false, error: message };
  }
}

export async function deleteProduct(productId: number, confirmationSku: string) {
  try {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { sku: true },
    });
    if (!product) return { success: false, error: "Товар не найден" };
    if (product.sku !== confirmationSku) {
      return { success: false, error: "Неверный SKU подтверждения" };
    }
    await prisma.product.delete({ where: { id: productId } });
    revalidatePath("/admin/catalog");
    revalidatePath("/");
    revalidatePath("/catalog");
    return { success: true };
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Ошибка";
    return { success: false, error: message };
  }
}

export async function createReview(data: {
  productId?: number;
  rating: number;
  comment?: string;
  userName: string;
  isStoreReview?: boolean;
}) {
  try {
    if (data.rating !== undefined && data.rating !== null && (data.rating < 0 || data.rating > 5)) {
      return { success: false, error: "Рейтинг має бути від 0 до 5" };
    }
    if (!data.userName.trim()) {
      return { success: false, error: "Ім'я обов'язкове" };
    }
    const isStore = data.isStoreReview === true;
    if (!isStore && !data.productId) {
      return { success: false, error: "Не вказано товар" };
    }
    await prisma.review.create({
      data: {
        rating: data.rating,
        comment: data.comment || null,
        userName: data.userName.trim(),
        productId: isStore ? null : data.productId!,
        isStoreReview: isStore,
      },
    });
    revalidatePath("/product");
    revalidatePath("/reviews");
    return { success: true };
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Ошибка";
    return { success: false, error: message };
  }
}

export async function getProductRating(productId: number) {
  const result = await prisma.review.aggregate({
    where: { productId, isStoreReview: false, rating: { gt: 0 } },
    _avg: { rating: true },
    _count: { rating: true },
  });
  return {
    average: result._avg.rating ? Math.round(result._avg.rating * 10) / 10 : 0,
    count: result._count.rating,
  };
}

export async function publishReview(id: string) {
  try {
    await prisma.review.update({ where: { id }, data: { isPublished: true } })
    revalidatePath("/admin/reviews")
    revalidatePath("/product")
    revalidatePath("/reviews")
    return { success: true }
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Ошибка"
    return { success: false, error: message }
  }
}

export async function unpublishReview(id: string) {
  try {
    await prisma.review.update({ where: { id }, data: { isPublished: false } })
    revalidatePath("/admin/reviews")
    revalidatePath("/product")
    revalidatePath("/reviews")
    return { success: true }
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Ошибка"
    return { success: false, error: message }
  }
}

export async function deleteReview(id: string) {
  try {
    await prisma.review.delete({ where: { id } })
    revalidatePath("/admin/reviews")
    revalidatePath("/product")
    revalidatePath("/reviews")
    return { success: true }
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Ошибка"
    return { success: false, error: message }
  }
}

export async function updateProduct(
  productId: number,
  data: {
    name?: string;
    sku?: string;
    slug?: string;
    description?: string;
    fullDescription?: string;
    metaTitle?: string;
    metaDescription?: string;
    seoAlt?: string;
    badge?: string;
    isPublished?: boolean;
    brandId?: number;
    price?: number;
    stock?: number;
    volume?: string;
    productType?: string;
    variants?: { size: string; price: number }[];
    oldPrice?: number | null;
    isPopular?: boolean;
    isNew?: boolean;
    relatedIds?: number[];
    relatedProductIds?: number[];
    relatedLabels?: Record<number, string>;
    bundleProductId?: number | null;
    categoryIds?: { id: number; isMain: boolean }[];
    mediaFiles?: { url: string; isMain: boolean; order: number; alt?: string }[];
  }
) {
  try {
    const existing = await prisma.product.findUnique({
      where: { id: productId },
      select: { sku: true },
    });
    if (!existing) return { success: false, error: "Товар не найден" };

    if (data.sku && data.sku !== existing.sku) {
      const existingSku = await prisma.product.findUnique({
        where: { sku: data.sku },
      });
      if (existingSku) {
        return { success: false, error: "Такой SKU уже существует" };
      }
    }

    const updateData: Record<string, unknown> = {};
    if (data.name !== undefined) {
      updateData.name = data.name;
      updateData.slug = slugify(data.name);
    }
    if (data.slug !== undefined) {
      updateData.slug = data.slug.trim() || slugify(updateData.name as string || data.name || "");
    }
    if (data.sku !== undefined) updateData.sku = data.sku;
    if (data.description !== undefined) {
      updateData.description = data.description;
      if (data.fullDescription === undefined) updateData.fullDescription = data.description;
    }
    if (data.fullDescription !== undefined) updateData.fullDescription = data.fullDescription;
    if (data.metaTitle !== undefined) updateData.metaTitle = data.metaTitle;
    if (data.metaDescription !== undefined) updateData.metaDescription = data.metaDescription;
    if (data.seoAlt !== undefined) updateData.seoAlt = data.seoAlt;
    if (data.badge !== undefined) updateData.badge = data.badge;
    if (data.isPublished !== undefined) updateData.isPublished = data.isPublished;
    if (data.brandId !== undefined) updateData.brandId = data.brandId;
    if (data.price !== undefined) updateData.price = data.price;
    if (data.stock !== undefined) updateData.stock = data.stock;
    if (data.volume !== undefined) updateData.volume = data.volume;
    if (data.productType !== undefined) updateData.productType = data.productType;
    if (data.oldPrice !== undefined) updateData.oldPrice = data.oldPrice;
    if (data.isPopular !== undefined) updateData.isPopular = data.isPopular === true;
    if (data.isNew !== undefined) {
      updateData.isNew = data.isNew === true;
      updateData.badge = data.isNew === true ? "Новинка" : null;
    }
    if (data.relatedIds !== undefined) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      updateData.relatedIds = data.relatedIds as any;
    }
    if (data.relatedLabels !== undefined) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      updateData.relatedLabels = data.relatedLabels as any;
    }
    if (data.bundleProductId !== undefined) updateData.bundleProductId = data.bundleProductId;

    await prisma.$transaction(async (tx) => {
      await tx.product.update({
        where: { id: productId },
        data: updateData,
      });

      if (data.stock !== undefined) {
        await tx.productVariant.updateMany({
          where: { productId },
          data: { stock: data.stock },
        })
      }

      if (data.relatedProductIds !== undefined) {
        await tx.product.update({
          where: { id: productId },
          data: {
            relatedProducts: { set: data.relatedProductIds.map((id) => ({ id })) },
          },
        })
      }

      if (data.sku && data.sku !== existing.sku) {
        await tx.productVariant.updateMany({
          where: { productId },
          data: { sku: data.sku },
        });
      }

      if (data.categoryIds) {
        await tx.productCategory.deleteMany({ where: { productId } });
        if (data.categoryIds.length > 0) {
          await tx.productCategory.createMany({
            data: data.categoryIds.map((c) => ({
              productId,
              categoryId: c.id,
              isMain: c.isMain,
            })),
          });
        }
      }

      if (data.variants) {
        await tx.productVariant.deleteMany({ where: { productId } });
        if (data.variants.length > 0) {
          const sku = data.sku || existing.sku;
          await tx.productVariant.createMany({
            data: data.variants.map((v) => ({
              productId,
              sku: `${sku}-${v.size.replace(/\s+/g, "-")}`,
              size: v.size,
              volume: v.size,
              packageType: "",
              priceRetail: v.price,
              stock: data.stock ?? 0,
            })),
          });
        }
      }

      if (data.mediaFiles) {
        await tx.productImage.deleteMany({ where: { productId } });
        if (data.mediaFiles.length > 0) {
          await tx.productImage.createMany({
            data: data.mediaFiles.map((m) => ({
              productId,
              url: m.url,
              alt: m.alt || "",
              isMain: m.isMain,
              sort: m.order,
            })),
          });
        }
      }
    });
    
    revalidatePath("/admin/catalog");
    revalidatePath("/");
    revalidatePath("/catalog");
    return { success: true };
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Ошибка";
    return { success: false, error: message };
  }
}
