import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import prisma from "@/lib/prisma";
import ProductRowActions from "@/components/product-row-actions";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Товари | Адмін панель",
};

export default async function ProductsPage() {
  const products = await prisma.product.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      sku: true,
      name: true,
      price: true,
      stock: true,
      status: true,
      isPublished: true,
      brand: { select: { name: true } },
    },
  });

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Товари</h2>
        <a href="./new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Додати товар
          </Button>
        </a>
      </div>

      <div className="flex items-center py-4">
        <div className="relative max-w-sm w-full">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Пошук за SKU або назвою..."
            className="pl-8"
          />
        </div>
      </div>

      <div className="border rounded-lg bg-card">
        <table className="w-full text-sm text-left">
          <thead className="text-xs uppercase bg-muted">
            <tr>
              <th className="px-6 py-3">Артикул</th>
              <th className="px-6 py-3">Назва</th>
              <th className="px-6 py-3">Бренд</th>
              <th className="px-6 py-3">Ціна</th>
              <th className="px-6 py-3">Залишок</th>
              <th className="px-6 py-3">Статус</th>
              <th className="px-6 py-3 w-[140px]">Дії</th>
            </tr>
          </thead>
          <tbody>
            {products.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-4 text-center text-muted-foreground">
                  Немає доданих товарів
                </td>
              </tr>
            ) : (
              products.map((product) => (
                <tr key={product.id} className="border-b hover:bg-muted/50">
                  <td className="px-6 py-4 font-medium">{product.sku}</td>
                  <td className="px-6 py-4">{product.name}</td>
                  <td className="px-6 py-4">{product.brand?.name || "—"}</td>
                  <td className="px-6 py-4">{product.price} ₴</td>
                  <td className="px-6 py-4">{product.stock} шт</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs ${product.status === 'PUBLISHED' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                      {product.status === 'PUBLISHED' ? 'Опубліковано' : 'Чернетка'}
                    </span>
                  </td>
                  <td className="px-6 py-2">
                    <ProductRowActions productId={product.id} initialPublished={product.isPublished} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
