"use client";

import { useState, useTransition, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { Save, ArrowLeft, MoreVertical, Copy, Trash } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  useFormField,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { NativeMediaUploader } from "@/components/catalog/media-uploader"
import { createProduct, deleteProduct, duplicateProduct, updateProduct, generateSku } from "@/app/actions/catalog";

const RichTextEditor = dynamic(() => import("@/components/rich-text-editor"), {
  ssr: false,
  loading: () => <div className="h-[200px] animate-pulse bg-muted rounded-lg" />,
})

const productSchema = z.object({
  name: z.string().min(2, "Назва обов'язкова"),
  sku: z.string().min(2, "SKU обов'язковий"),
  description: z.string().optional(),
  slug: z.string().optional(),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  seoAlt: z.string().optional(),
  brandId: z.string().optional(),
  categoryId: z.string().optional(),
  price: z.coerce.number().min(0),
  stock: z.coerce.number().int().min(0).default(0),
  status: z.string().default("DRAFT"),
});

function DescriptionIdInput() {
  const { formItemId } = useFormField()
  return <input type="text" id={formItemId} className="sr-only" tabIndex={-1} readOnly aria-hidden="true" />
}

export function ProductForm({ categories, brands, initialData, allProductsProp }: { categories: any[]; brands: any[]; initialData?: any; allProductsProp?: { id: number; name: string }[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [media, setMedia] = useState<any[]>(initialData?.images || []);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [brandsList, setBrandsList] = useState(brands);
  const [isPopular, setIsPopular] = useState(initialData?.isPopular ?? false);
  const [isNew, setIsNew] = useState(initialData?.isNew ?? false);
  const [relatedIds, setRelatedIds] = useState<number[]>(initialData?.relatedIds ?? []);
  const [relatedProductIds, setRelatedProductIds] = useState<number[]>(initialData?.relatedProductIds ?? []);
  const [relatedLabels, setRelatedLabels] = useState<Record<number, string>>(initialData?.relatedLabels ?? {});
  const [relatedQ, setRelatedQ] = useState("");
  const [bundleProductId, setBundleProductId] = useState<number | null>(initialData?.bundleProductId ?? null);
  const [productType, setProductType] = useState<string>(initialData?.productType ?? "SINGLE");
  const [oldPrice, setOldPrice] = useState<number | null>(initialData?.oldPrice ?? null);
  const [variants, setVariants] = useState<{ size: string; price: number }[]>(
    initialData?.variants?.map((v: any) => ({ size: v.size || v.volume || "", price: v.priceRetail || 0 })) || []
  );
  const allProducts = allProductsProp || [];

  const form = useForm<z.infer<typeof productSchema>>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: initialData?.name || "",
      sku: initialData?.sku || "",
      description: initialData?.description || "",
      slug: initialData?.slug || "",
      metaTitle: initialData?.metaTitle || "",
      metaDescription: initialData?.metaDescription || "",
      seoAlt: initialData?.seoAlt || "",
      brandId: initialData?.brandId ? String(initialData.brandId) : "none",
      categoryId: initialData?.categories?.[0]?.categoryId ? String(initialData.categories[0].categoryId) : "",
      price: initialData?.price || 0,
      stock: initialData?.stock || 0,
      status: initialData?.status || "DRAFT",
    },
  });

  useEffect(() => {
    if (initialData) {
      form.reset({
        name: initialData.name || "",
        sku: initialData.sku || "",
        description: initialData.description || "",
        slug: initialData.slug || "",
        metaTitle: initialData.metaTitle || "",
        metaDescription: initialData.metaDescription || "",
        seoAlt: initialData.seoAlt || "",
        brandId: initialData.brandId ? String(initialData.brandId) : "none",
        categoryId: initialData.categories?.[0]?.categoryId ? String(initialData.categories[0].categoryId) : "",
        price: initialData.price || 0,
        stock: initialData.stock || 0,
        status: initialData.status || "DRAFT",
      })
    }
  }, [initialData, form])

  const onInvalid = () => {
    const errors = form.formState.errors
    const first = Object.values(errors).find(Boolean)
    if (first?.message) toast.error(String(first.message))
    else toast.error("Будь ласка, перевірте всі обов'язкові поля")
  }

  const onSubmit = (values: z.infer<typeof productSchema>, action: "DRAFT" | "PUBLISHED") => {
    startTransition(async () => {
      const dataToSubmit = {
        name: values.name,
        sku: values.sku,
        slug: values.slug,
        description: values.description,
        metaTitle: values.metaTitle,
        metaDescription: values.metaDescription,
        seoAlt: values.seoAlt,
        brandId: values.brandId === "none" ? undefined : Number(values.brandId),
        status: action,
        price: values.price,
        stock: values.stock,
        variants: variants.length > 0 ? variants : undefined,
        productType,
        isPopular: !!isPopular,
        isNew: !!isNew,
        relatedIds,
        relatedProductIds,
        relatedLabels,
        bundleProductId,
        oldPrice,
        categoryIds: values.categoryId ? [{ id: Number(values.categoryId), isMain: true }] : [],
        mediaFiles: media.map(m => ({ url: m.url, isMain: m.isMain, order: m.sort ?? m.order, alt: m.alt })),
      };

      console.log("Saving data:", dataToSubmit)

      const res = initialData?.id
        ? await updateProduct(initialData.id, dataToSubmit)
        : await createProduct(dataToSubmit);
      if (res.success) {
        toast.success(action === "PUBLISHED" ? "Опубліковано" : "Збережено як чернетку");
        router.push("..");
      } else {
        toast.error(res.error || "Помилка збереження");
      }
    });
  };

  const handleGenerateSKU = async () => {
    try {
      const sku = await generateSku()
      form.setValue("sku", sku)
    } catch {
      toast.error("Не вдалося згенерувати артикул")
    }
  };

  const handleDelete = async () => {
    if (deleteConfirmation !== "DELETE" && deleteConfirmation !== form.getValues("sku")) {
      toast.error("Невірний код підтвердження");
      return;
    }
    
    if (initialData?.id) {
      const res = await deleteProduct(initialData.id, deleteConfirmation);
      if (res.success) {
        toast.success("Товар видалено");
        router.push("..");
      } else {
        toast.error(res.error);
      }
    }
  };

  const handleDuplicate = async () => {
    if (initialData?.id) {
      const res = await duplicateProduct(initialData.id);
      if (res.success) {
        toast.success("Товар дубльовано");
        router.push(`../${res.data?.id}`);
      } else {
        toast.error(res.error);
      }
    }
  };

  const handleCreateBrand = async () => {
    const name = window.prompt("Введіть назву нового бренду:");
    if (!name || name.trim() === "") return;
    
    // Import dynamically or assume createBrand is imported
    const { createBrand } = await import("@/app/actions/catalog");
    const res = await createBrand(name.trim());
    if (res.success) {
      toast.success("Бренд додано");
      setBrandsList([...brandsList, res.data]);
      form.setValue("brandId", String(res.data?.id));
    } else {
      toast.error(res.error || "Помилка створення");
    }
  };

  return (
    <Form {...form}>
      <form className="space-y-6">
        {/* Sticky Header */}
        <div className="sticky top-0 z-50 flex items-center justify-between bg-background/95 backdrop-blur border-b p-4 -mx-4 md:-mx-8 px-4 md:px-8 shadow-sm mb-6">
          <div className="flex items-center gap-4">
            <Link href="..">
              <Button type="button" variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-bold">{initialData ? initialData.name : "Новий товар"}</h1>
              <div className="flex gap-2 text-sm mt-1">
                <span className={`px-2 py-0.5 rounded text-xs ${form.getValues("status") === 'PUBLISHED' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                  {form.getValues("status") === 'PUBLISHED' ? 'Опубліковано' : 'Чернетка'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={form.handleSubmit((v) => onSubmit(v, "DRAFT"), onInvalid)}
              disabled={isPending}
            >
              У чернетку
            </Button>
            <Button 
              type="button"
              className="bg-gradient-to-r from-[#0B53A4] to-[#00B5D1] text-white hover:from-[#0c5db8] hover:to-[#00c5e3]"
              onClick={form.handleSubmit((v) => onSubmit(v, "PUBLISHED"), onInvalid)}
              disabled={isPending}
            >
              <Save className="w-4 h-4 mr-2" /> Опублікувати
            </Button>
            
            {initialData && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button type="button" variant="ghost" size="icon">
                    <MoreVertical className="w-5 h-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleDuplicate}>
                    <Copy className="w-4 h-4 mr-2" /> Дублювати
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-red-600" onClick={() => setShowDeleteModal(true)}>
                    <Trash className="w-4 h-4 mr-2" /> Видалити
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Info */}
            <div className="border border-border rounded-xl shadow-sm bg-white p-5 space-y-4 focus:border-[#00B5D1] focus:ring-1 focus:ring-[#00B5D1]">
              <h2 className="text-lg font-semibold border-b pb-2">Основна інформація</h2>
              
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem>
                  <FormLabel>Назва товару *</FormLabel>
                  <FormControl><Input placeholder="Наприклад: Очищувач кузова..." {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="sku" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Артикул (SKU) *</FormLabel>
                    <div className="flex gap-2">
                      <FormControl><Input {...field} /></FormControl>
                      <Button type="button" variant="secondary" onClick={handleGenerateSKU}>Згенерувати</Button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="brandId" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Бренд</FormLabel>
                    <div className="flex gap-2">
                      <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                        <FormControl><SelectTrigger className="flex-1"><SelectValue placeholder="Оберіть бренд" /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="none">-- Без бренду --</SelectItem>
                          {brandsList.map((b: any) => <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <Button type="button" variant="outline" size="icon" onClick={handleCreateBrand} title="Додати бренд">
                        <span className="text-lg leading-none">+</span>
                      </Button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <FormField control={form.control} name="description" render={({ field }) => (
                <FormItem>
                  <FormLabel>Опис</FormLabel>
                  <DescriptionIdInput />
                  <RichTextEditor value={field.value || ""} onChange={field.onChange} />
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            {/* SEO */}
            <div className="border border-border rounded-xl shadow-sm bg-white p-5 space-y-4 focus:border-[#00B5D1] focus:ring-1 focus:ring-[#00B5D1]">
              <h2 className="text-lg font-semibold border-b pb-2">SEO</h2>
              <p className="text-xs text-muted-foreground">Заповніть або залиште порожніми — заповниться автоматично з назви та опису</p>

              <FormField control={form.control} name="slug" render={({ field }) => (
                <FormItem>
                  <FormLabel>URL (Slug)</FormLabel>
                  <FormControl><Input placeholder="наприклад: soft99-glaco-30ml (якщо залишити порожнім, спрацює автогенерація)" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="metaTitle" render={({ field }) => (
                <FormItem>
                  <FormLabel>Meta Title</FormLabel>
                  <FormControl><Input placeholder="Автоматично: [Назва] | OZO" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="metaDescription" render={({ field }) => (
                <FormItem>
                  <FormLabel>Meta Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Автоматично: перші 150 символів опису" className="resize-none" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="seoAlt" render={({ field }) => (
                <FormItem>
                  <FormLabel>SEO Alt (для зображень)</FormLabel>
                  <FormControl><Input placeholder="Автоматично: назва товару" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            {/* Media Gallery */}
            <div className="border border-border rounded-xl shadow-sm bg-white p-5 space-y-4 focus:border-[#00B5D1] focus:ring-1 focus:ring-[#00B5D1]">
              <h2 className="text-lg font-semibold border-b pb-2">Галерея фото</h2>
              <NativeMediaUploader value={media} onChange={setMedia} />
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Category */}
            <div className="border border-border rounded-xl shadow-sm bg-white p-5 space-y-4 focus:border-[#00B5D1] focus:ring-1 focus:ring-[#00B5D1]">
              <h2 className="text-lg font-semibold border-b pb-2">Категорія</h2>
              <FormField control={form.control} name="categoryId" render={({ field }) => (
                <FormItem>
                  <FormLabel>Основна категорія *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Оберіть категорію" /></SelectTrigger></FormControl>
                    <SelectContent>
                      {categories.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />

              <div className="pt-2 border-t">
                <label className="text-sm font-medium mb-2 block">Тип товару</label>
                <Select onValueChange={setProductType} value={productType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SINGLE">Одиночний</SelectItem>
                    <SelectItem value="BUNDLE">Набір</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  Одиночний — звичайний товар. Набір — комбо-набір із кількох товарів.
                </p>
              </div>
            </div>

            {/* Price and Stock */}
            <div className="border border-border rounded-xl shadow-sm bg-white p-5 space-y-4 focus:border-[#00B5D1] focus:ring-1 focus:ring-[#00B5D1]">
              <h2 className="text-lg font-semibold border-b pb-2">Ціна та залишок</h2>
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="price" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ціна (₴)</FormLabel>
                    <FormControl><Input type="number" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="stock" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Залишок (шт)</FormLabel>
                    <FormControl><Input type="number" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <div className="pt-2">
                <label className="text-sm font-medium block mb-1">Стара ціна (₴)</label>
                <Input
                  type="number"
                  value={oldPrice ?? ""}
                  onChange={(e) => {
                    const v = e.target.value
                    setOldPrice(v === "" ? null : parseFloat(v) || null)
                  }}
                  placeholder="Необов'язково"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Перекреслена ціна для знижки. Якщо менше роздрібної — ігнорується.
                </p>
              </div>

            </div>

            {/* Варіанти товару */}
            <div className="border border-border rounded-xl shadow-sm bg-white p-5 space-y-4 focus:border-[#00B5D1] focus:ring-1 focus:ring-[#00B5D1]">
              <div className="flex items-center justify-between border-b pb-2">
                <h2 className="text-lg font-semibold">Варіанти (Розмір + Ціна)</h2>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setVariants((prev) => [...prev, { size: "", price: 0 }])}
                >
                  + Додати розмір
                </Button>
              </div>

              {variants.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  Немає варіантів. Додайте розміри, щоб покупець міг обрати потрібний.
                  Якщо варіантів немає — використовується основна ціна товару.
                </p>
              ) : (
                <div className="space-y-3">
                  {variants.map((v, idx) => (
                    <div key={idx} className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-4 bg-muted/30 rounded-xl relative">
                      <div className="flex-1 w-full">
                        <FormLabel className="text-xs">Розмір</FormLabel>
                        <Input
                          placeholder="напр. 50×20 см"
                          value={v.size}
                          onChange={(e) => {
                            setVariants((prev) => {
                              const next = [...prev]
                              next[idx] = { ...next[idx], size: e.target.value }
                              return next
                            })
                          }}
                        />
                      </div>
                      <div className="w-full sm:w-32">
                        <FormLabel className="text-xs">Ціна (₴)</FormLabel>
                        <Input
                          type="number"
                          placeholder="300"
                          value={v.price || ""}
                          onChange={(e) => {
                            setVariants((prev) => {
                              const next = [...prev]
                              next[idx] = { ...next[idx], price: parseFloat(e.target.value) || 0 }
                              return next
                            })
                          }}
                        />
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute top-2 right-2 sm:static sm:mt-5 text-red-500 hover:text-red-700 hover:bg-red-50"
                        onClick={() => setVariants((prev) => prev.filter((_, i) => i !== idx))}
                      >
                        <Trash className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

            </div>

            {/* Popular & Related */}
            <div className="border border-border rounded-xl shadow-sm bg-white p-5 space-y-4 focus:border-[#00B5D1] focus:ring-1 focus:ring-[#00B5D1]">
              <h2 className="text-lg font-semibold border-b pb-2">Популярні товари та рекомендації</h2>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isPopular}
                  onChange={() => setIsPopular((v) => !v)}
                  className="h-4 w-4"
                />
                <span className="text-sm">Популярний товар (виводити першим на головній)</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isNew}
                  onChange={() => setIsNew((v) => !v)}
                  className="h-4 w-4"
                />
                <span className="text-sm">Новинка (плашка "Новинка")</span>
              </label>

              <div className="border-t pt-4 space-y-3">
                <div>
                  <div className="text-sm font-medium mb-1">Рекомендовані товари</div>
                  <div className="text-xs text-muted-foreground mb-3">
                    Виберіть супутні товари
                  </div>
                </div>
                <Input
                  value={relatedQ}
                  onChange={(e) => setRelatedQ(e.target.value)}
                  placeholder="Пошук за назвою..."
                />
                <div className="max-h-[180px] overflow-auto border rounded-md p-2 space-y-1">
                  {allProducts
                    .filter((p) => {
                      if (initialData?.id && p.id === initialData.id) return false
                      if (relatedQ.trim()) {
                        return p.name.toLowerCase().includes(relatedQ.trim().toLowerCase())
                      }
                      return true
                    })
                    .slice(0, 50)
                    .map((p) => (
                      <label key={p.id} className="flex items-center gap-2 text-xs cursor-pointer hover:bg-muted rounded px-1 py-0.5">
                        <input
                          type="checkbox"
                          checked={relatedIds.includes(p.id)}
                          onChange={() =>
                            setRelatedIds((prev) =>
                              prev.includes(p.id) ? prev.filter((x) => x !== p.id) : [...prev, p.id],
                            )
                          }
                        />
                        <span className="truncate">{p.name}</span>
                      </label>
                    ))}
                  {!allProducts.length && (
                    <div className="text-xs text-muted-foreground p-2">Немає даних про товари.</div>
                  )}
                </div>
                <div className="text-xs text-muted-foreground">Вибрано: {relatedIds.length}</div>
              </div>

              <div className="border-t pt-4 space-y-3">
                <div>
                  <div className="text-sm font-medium mb-1">Пов'язані товари (Версії)</div>
                  <div className="text-xs text-muted-foreground mb-3">
                    Зв'яжи версії товару (воскі для темних/світлих авто тощо)
                  </div>
                </div>
                <Input
                  value={relatedQ}
                  onChange={(e) => setRelatedQ(e.target.value)}
                  placeholder="Пошук за назвою..."
                />
                <div className="max-h-[180px] overflow-auto border rounded-md p-2 space-y-1">
                  {allProducts
                    .filter((p) => {
                      if (initialData?.id && p.id === initialData.id) return false
                      if (relatedQ.trim()) {
                        return p.name.toLowerCase().includes(relatedQ.trim().toLowerCase())
                      }
                      return true
                    })
                    .slice(0, 50)
                    .map((p) => (
                      <label key={`rpid-${p.id}`} className="flex items-center gap-2 text-xs cursor-pointer hover:bg-muted rounded px-1 py-0.5">
                        <input
                          type="checkbox"
                          checked={relatedProductIds.includes(p.id)}
                          onChange={() =>
                            setRelatedProductIds((prev) =>
                              prev.includes(p.id) ? prev.filter((x) => x !== p.id) : [...prev, p.id],
                            )
                          }
                        />
                        <span className="truncate">{p.name}</span>
                      </label>
                    ))}
                  {!allProducts.length && (
                    <div className="text-xs text-muted-foreground p-2">Немає даних про товари.</div>
                  )}
                </div>
                <div className="text-xs text-muted-foreground">Вибрано: {relatedProductIds.length}</div>

                {(initialData?.id || relatedProductIds.length > 0) && (
                  <div className="space-y-2">
                    <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      Текст на кнопці
                    </div>
                    {initialData?.id && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground w-24 truncate">
                          {initialData.name}
                        </span>
                        <Input
                          value={relatedLabels[initialData.id] ?? ""}
                          onChange={(e) =>
                            setRelatedLabels((prev) => ({
                              ...prev,
                              [initialData.id]: e.target.value,
                            }))
                          }
                          placeholder="Текст кнопки (не обов'язково)"
                          className="flex-1"
                        />
                      </div>
                    )}
                    {relatedProductIds.map((rid) => {
                      const item = allProducts.find((p: any) => p.id === rid)
                      return (
                        <div key={`lb-${rid}`} className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground w-24 truncate">
                            {item?.name ?? `ID ${rid}`}
                          </span>
                          <Input
                            value={relatedLabels[rid] ?? ""}
                            onChange={(e) =>
                              setRelatedLabels((prev) => ({
                                ...prev,
                                [rid]: e.target.value,
                              }))
                            }
                            placeholder="Текст кнопки (не обов'язково)"
                            className="flex-1"
                          />
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              <div className="border-t pt-4">
                <label className="text-sm font-medium mb-2 block">
                  Набір зі знижкою
                </label>
                <select
                  value={bundleProductId ?? ""}
                  onChange={(e) => setBundleProductId(e.target.value ? Number(e.target.value) : null)}
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="">— Не вибрано —</option>
                  {allProducts
                    .filter((p) => !initialData?.id || p.id !== initialData.id)
                    .map((p) => (
                      <option key={p.id} value={String(p.id)}>
                        {p.name}
                      </option>
                    ))}
                </select>
                <p className="text-xs text-muted-foreground mt-1">
                  Окремий товар-набір із каталогу зі своєю ціною. Якщо не вибрано — блок «Разом дешевше» не показується.
                </p>
              </div>
            </div>

          </div>
        </div>
      </form>

      {/* Delete Confirmation Modal */}
      <AlertDialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Видалити товар назавжди?</AlertDialogTitle>
            <AlertDialogDescription>
              Це дія незворотна. Щоб підтвердити видалення, введіть <b>DELETE</b> або артикул товару (<b>{form.getValues("sku")}</b>).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Input 
              value={deleteConfirmation} 
              onChange={(e) => setDeleteConfirmation(e.target.value)} 
              placeholder="DELETE" 
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteConfirmation("")}>Скасувати</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              disabled={deleteConfirmation !== "DELETE" && deleteConfirmation !== form.getValues("sku")}
              className="bg-red-600 hover:bg-red-700"
            >
              Підтвердити видалення
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Form>
  );
}
