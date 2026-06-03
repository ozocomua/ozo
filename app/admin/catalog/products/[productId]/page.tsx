import { ProductForm } from "../new/product-form";
import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";

export const metadata = {
  title: "Редактировать товар | Админ панель",
};

export default async function EditProductPage({ params }: { params: Promise<{ productId: string }> }) {
  const { productId } = await params;
  const id = parseInt(productId, 10);
  if (isNaN(id)) return notFound();

  const product = await prisma.product.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      sku: true,
      slug: true,
      description: true,
      fullDescription: true,
      metaTitle: true,
      metaDescription: true,
      seoAlt: true,
      brandId: true,
      status: true,
      price: true,
      wholesalePrice: true,
      hasWholesale: true,
      stock: true,
      volume: true,
      containerType: true,
      productType: true,
      oldPrice: true,
      isPopular: true,
      isNew: true,
      relatedIds: true,
      relatedLabels: true,
      relatedProducts: { select: { id: true } },
      bundleProductId: true,
      categories: { select: { categoryId: true } },
      images: { select: { id: true, url: true, sort: true, alt: true, isMain: true } },
    },
  });

  if (!product) return notFound();

  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
  });

  const brands = await prisma.brand.findMany({
    orderBy: { name: "asc" },
  });

  const allProducts = await prisma.product.findMany({
    where: { isPublished: true },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  })

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <ProductForm
        categories={categories}
        brands={brands}
        initialData={{
          ...product,
          relatedProductIds: product.relatedProducts.map((p) => p.id),
        }}
        allProductsProp={allProducts}
      />
    </div>
  );
}
