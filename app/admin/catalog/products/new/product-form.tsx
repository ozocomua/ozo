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
  name: z.string().min(2, "Название обязательно"),
  sku: z.string().min(2, "SKU обязателен"),
  description: z.string().optional(),
  slug: z.string().optional(),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  seoAlt: z.string().optional(),
  brandId: z.string().optional(),
  categoryId: z.string().optional(),
  price: z.coerce.number().min(0),
  hasWholesale: z.boolean().default(false),
  wholesalePrice: z.coerce.number().optional(),
  stock: z.coerce.number().int().min(0).default(0),
  volume: z.string().optional(),
  containerType: z.string().optional(),
  dimensions: z.string().optional(),
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
      hasWholesale: initialData?.hasWholesale || false,
      wholesalePrice: initialData?.wholesalePrice || 0,
      stock: initialData?.stock || 0,
      volume: initialData?.volume || "",
      containerType: initialData?.containerType || "",
      dimensions: initialData?.dimensions || "",
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
        hasWholesale: initialData.hasWholesale || false,
        wholesalePrice: initialData.wholesalePrice || 0,
        stock: initialData.stock || 0,
        volume: initialData.volume || "",
        containerType: initialData.containerType || "",
        dimensions: initialData.dimensions || "",
        status: initialData.status || "DRAFT",
      })
    }
  }, [initialData, form])

  const hasWholesale = form.watch("hasWholesale");

  const onInvalid = () => {
    const errors = form.formState.errors
    const first = Object.values(errors).find(Boolean)
    if (first?.message) toast.error(String(first.message))
    else toast.error("Пожалуйста, проверьте все обязательные поля")
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
        hasWholesale: values.hasWholesale,
        wholesalePrice: values.hasWholesale ? values.wholesalePrice : undefined,
        stock: values.stock,
        volume: values.volume,
        containerType: values.containerType,
        dimensions: values.dimensions,
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
        toast.success(action === "PUBLISHED" ? "Опубликовано" : "Сохранено как черновик");
        router.push("..");
      } else {
        toast.error(res.error || "Ошибка сохранения");
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
      toast.error("Неверный код подтверждения");
      return;
    }
    
    if (initialData?.id) {
      const res = await deleteProduct(initialData.id, deleteConfirmation);
      if (res.success) {
        toast.success("Товар удален");
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
        toast.success("Товар дублирован");
        router.push(`../${res.data.id}`);
      } else {
        toast.error(res.error);
      }
    }
  };

  const handleCreateBrand = async () => {
    const name = window.prompt("Введите название нового бренда:");
    if (!name || name.trim() === "") return;
    
    // Import dynamically or assume createBrand is imported
    const { createBrand } = await import("@/app/actions/catalog");
    const res = await createBrand(name.trim());
    if (res.success) {
      toast.success("Бренд добавлен");
      setBrandsList([...brandsList, res.data]);
      form.setValue("brandId", String(res.data.id));
    } else {
      toast.error(res.error);
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
              <h1 className="text-xl font-bold">{initialData ? initialData.name : "Добавление товара"}</h1>
              <div className="flex gap-2 text-sm mt-1">
                <span className={`px-2 py-0.5 rounded text-xs ${form.getValues("status") === 'PUBLISHED' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                  {form.getValues("status") === 'PUBLISHED' ? 'Опубликован' : 'Черновик'}
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
              В черновик
            </Button>
            <Button 
              type="button" 
              onClick={form.handleSubmit((v) => onSubmit(v, "PUBLISHED"), onInvalid)}
              disabled={isPending}
            >
              <Save className="w-4 h-4 mr-2" /> Опубликовать
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
                    <Copy className="w-4 h-4 mr-2" /> Дублировать
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-red-600" onClick={() => setShowDeleteModal(true)}>
                    <Trash className="w-4 h-4 mr-2" /> Удалить
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
            <div className="border rounded-lg p-6 bg-card space-y-4">
              <h2 className="text-lg font-semibold border-b pb-2">Основная информация</h2>
              
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem>
                  <FormLabel>Название товара *</FormLabel>
                  <FormControl><Input placeholder="Например: Очиститель кузова..." {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="sku" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Артикул (SKU) *</FormLabel>
                    <div className="flex gap-2">
                      <FormControl><Input {...field} /></FormControl>
                      <Button type="button" variant="secondary" onClick={handleGenerateSKU}>Генерировать</Button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="brandId" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Бренд</FormLabel>
                    <div className="flex gap-2">
                      <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                        <FormControl><SelectTrigger className="flex-1"><SelectValue placeholder="Выберите бренд" /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="none">-- Без бренда --</SelectItem>
                          {brandsList.map((b: any) => <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <Button type="button" variant="outline" size="icon" onClick={handleCreateBrand} title="Добавить бренд">
                        <span className="text-lg leading-none">+</span>
                      </Button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <FormField control={form.control} name="description" render={({ field }) => (
                <FormItem>
                  <FormLabel>Описание</FormLabel>
                  <DescriptionIdInput />
                  <RichTextEditor value={field.value || ""} onChange={field.onChange} />
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            {/* SEO */}
            <div className="border rounded-lg p-6 bg-card space-y-4">
              <h2 className="text-lg font-semibold border-b pb-2">SEO</h2>
              <p className="text-xs text-muted-foreground">Заполните или оставьте пустыми — заполнится автоматически из названия и описания</p>

              <FormField control={form.control} name="slug" render={({ field }) => (
                <FormItem>
                  <FormLabel>Кастомный URL (Slug)</FormLabel>
                  <FormControl><Input placeholder="например: soft99-glaco-30ml (если оставить пустым, сработает автогенерация)" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="metaTitle" render={({ field }) => (
                <FormItem>
                  <FormLabel>Meta Title</FormLabel>
                  <FormControl><Input placeholder="Автоматически: [Название] | OZO" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="metaDescription" render={({ field }) => (
                <FormItem>
                  <FormLabel>Meta Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Автоматически: первые 150 символов описания" className="resize-none" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="seoAlt" render={({ field }) => (
                <FormItem>
                  <FormLabel>SEO Alt (для изображений)</FormLabel>
                  <FormControl><Input placeholder="Автоматически: название товара" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            {/* Media Gallery */}
            <div className="border rounded-lg p-6 bg-card space-y-4">
              <h2 className="text-lg font-semibold border-b pb-2">Галерея медиа</h2>
              <NativeMediaUploader value={media} onChange={setMedia} />
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Category */}
            <div className="border rounded-lg p-6 bg-card space-y-4">
              <h2 className="text-lg font-semibold border-b pb-2">Категория и тип</h2>
              <FormField control={form.control} name="categoryId" render={({ field }) => (
                <FormItem>
                  <FormLabel>Основная категория *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Выберите категорию" /></SelectTrigger></FormControl>
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
            <div className="border rounded-lg p-6 bg-card space-y-4">
              <h2 className="text-lg font-semibold border-b pb-2">Цена и склад</h2>
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="price" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Розничная цена (₴)</FormLabel>
                    <FormControl><Input type="number" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="stock" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Остаток (шт)</FormLabel>
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
                  Перекреслена ціна для скидки. Якщо менше рознічної — ігнорується.
                </p>
              </div>

              <FormField control={form.control} name="hasWholesale" render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 mt-4">
                  <div className="space-y-0.5">
                    <FormLabel>Есть опт</FormLabel>
                    <FormDescription>Включить оптовую цену</FormDescription>
                  </div>
                  <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                </FormItem>
              )} />

              {hasWholesale && (
                <FormField control={form.control} name="wholesalePrice" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Оптовая цена (₴)</FormLabel>
                    <FormControl><Input type="number" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              )}
            </div>

            {/* Характеристики товара */}
            <div className="border rounded-lg p-6 bg-card space-y-4">
              <h2 className="text-lg font-semibold border-b pb-2">Характеристики товару</h2>
              
              <FormField control={form.control} name="volume" render={({ field }) => (
                <FormItem>
                  <FormLabel>Объём / Вес</FormLabel>
                  <Tabs value={field.value} onValueChange={field.onChange} className="w-full">
                    <TabsList className="flex flex-wrap h-auto">
                      <TabsTrigger value="100 мл">100 мл</TabsTrigger>
                      <TabsTrigger value="250 мл">250 мл</TabsTrigger>
                      <TabsTrigger value="500 мл">500 мл</TabsTrigger>
                      <TabsTrigger value="1 л">1 л</TabsTrigger>
                      <TabsTrigger value="5 л">5 л</TabsTrigger>
                    </TabsList>
                  </Tabs>
                  <div className="mt-2">
                    <FormControl><Input placeholder="Или введите свой вариант..." {...field} /></FormControl>
                  </div>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="containerType" render={({ field }) => (
                <FormItem>
                  <FormLabel>Тип тары</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Выберите тару" /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="триггер">Триггер (спрей)</SelectItem>
                      <SelectItem value="флакон">Флакон</SelectItem>
                      <SelectItem value="канистра">Канистра</SelectItem>
                      <SelectItem value="бочка">Бочка</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="dimensions" render={({ field }) => (
                <FormItem>
                  <FormLabel>Размеры (Д × Ш × В)</FormLabel>
                  <FormControl>
                    <Input placeholder="Например: 30 × 20 × 15 см" {...field} />
                  </FormControl>
                  <FormDescription>Габариты товара в упаковке</FormDescription>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            {/* Popular & Related */}
            <div className="border rounded-lg p-6 bg-card space-y-4">
              <div className="bg-red-500 text-white p-2 rounded text-xs font-bold">ТЕСТ ФОРМЫ С ПОПУЛЯРНЫМИ ТОВАРАМИ</div>
              <h2 className="text-lg font-semibold border-b pb-2">Популярность и рекомендации</h2>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isPopular}
                  onChange={() => setIsPopular((v) => !v)}
                  className="h-4 w-4"
                />
                <span className="text-sm">Популярный товар (выводить первым на главной)</span>
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
                  <div className="text-sm font-medium mb-1">Рекомендуемые товары (Берут вместе)</div>
                  <div className="text-xs text-muted-foreground mb-3">
                    Выбери сопутствующие товары
                  </div>
                </div>
                <Input
                  value={relatedQ}
                  onChange={(e) => setRelatedQ(e.target.value)}
                  placeholder="Поиск по названию..."
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
                    <div className="text-xs text-muted-foreground p-2">Нет данных о товарах.</div>
                  )}
                </div>
                <div className="text-xs text-muted-foreground">Выбрано: {relatedIds.length}</div>
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
                  placeholder="Поиск по названию..."
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
                    <div className="text-xs text-muted-foreground p-2">Нет данных о товарах.</div>
                  )}
                </div>
                <div className="text-xs text-muted-foreground">Вибрано: {relatedProductIds.length}</div>

                {(initialData?.id || relatedProductIds.length > 0) && (
                  <div className="space-y-2">
                    <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      Короткий текст кнопки
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
                  Готовый товар-комплект со скидкой
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
                  Отдельный товар-набор из каталога со своей ценой. Если не выбран — блок «Разом дешевше» не показывается.
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
            <AlertDialogTitle>Удалить товар навсегда?</AlertDialogTitle>
            <AlertDialogDescription>
              Это действие необратимо. Чтобы подтвердить удаление, введите <b>DELETE</b> или артикул товара (<b>{form.getValues("sku")}</b>).
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
            <AlertDialogCancel onClick={() => setDeleteConfirmation("")}>Отмена</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              disabled={deleteConfirmation !== "DELETE" && deleteConfirmation !== form.getValues("sku")}
              className="bg-red-600 hover:bg-red-700"
            >
              Подтвердить удаление
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Form>
  );
}
