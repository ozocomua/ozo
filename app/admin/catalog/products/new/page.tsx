import { ProductForm } from "./product-form";
import prisma from "@/lib/prisma";

export const metadata = {
  title: "Додати товар | Адмін панель",
};

export default async function NewProductPage() {
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
        allProductsProp={allProducts}
      />
    </div>
  );
}
