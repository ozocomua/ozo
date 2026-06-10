import { Suspense } from "react";
import prisma from "@/lib/prisma";
import { CategoriesClient } from "./categories-client";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Категорії | Адмін панель",
};

export default async function CategoriesPage() {
  const categories = await prisma.category.findMany({
    include: {
      children: true,
    },
    orderBy: {
      name: "asc",
    },
  });

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Категорії</h2>
      </div>
      <CategoriesClient initialCategories={categories} />
    </div>
  );
}
