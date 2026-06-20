"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SingleImageUploader } from "@/components/catalog/single-image-uploader";
import { createCategory, updateCategory } from "@/app/actions/catalog";
import { toast } from "sonner";
import { useEffect, useTransition } from "react";

const formSchema = z.object({
  name: z.string().min(2, "Минимум 2 символа"),
  slug: z.string().optional(),
  parentId: z.string().optional(),
  description: z.string().optional(),
  imageUrl: z.string().optional(),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  seoAlt: z.string().optional(),
});

export function CategoryForm({ 
  category, 
  categories,
  onSuccess 
}: { 
  category: any; 
  categories: any[];
  onSuccess?: () => void;
}) {
  const [isPending, startTransition] = useTransition();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: category.name || "",
      slug: category.slug || "",
      parentId: category.parentId ? String(category.parentId) : "none",
      description: category.description || "",
      imageUrl: category.imageUrl || "",
      metaTitle: category.metaTitle || "",
      metaDescription: category.metaDescription || "",
      seoAlt: category.seoAlt || "",
    },
  });

  // Reset form when selected category changes
  useEffect(() => {
    form.reset({
      name: category.name || "",
      slug: category.slug || "",
      parentId: category.parentId ? String(category.parentId) : "none",
      description: category.description || "",
      imageUrl: category.imageUrl || "",
      metaTitle: category.metaTitle || "",
      metaDescription: category.metaDescription || "",
      seoAlt: category.seoAlt || "",
    });
  }, [category, form]);

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    startTransition(async () => {
      const data = {
        name: values.name,
        slug: values.slug || undefined,
        parentId: values.parentId === "none" ? null : Number(values.parentId),
        description: values.description,
        imageUrl: values.imageUrl,
        metaTitle: values.metaTitle || undefined,
        metaDescription: values.metaDescription || undefined,
        seoAlt: values.seoAlt || undefined,
      };

      const isNew = category.id === "new"

      const res = isNew
        ? await createCategory(data)
        : await updateCategory(Number(category.id), data)

      if (res.success) {
        toast.success("Сохранено!");
        onSuccess();
      } else {
        toast.error(res.error || "Помилка збереження");
      }
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">
            {category.id === "new" ? "Нова категорія" : "Редагування"}
          </h3>
        </div>

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Название *</FormLabel>
              <FormControl>
                <Input placeholder="Наприклад: Напувалки" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="parentId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Родительская категория</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Без родителя" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="none">-- Без родителя --</SelectItem>
                  {categories
                    .filter((c) => c.id !== category.id) // Prevent self-referencing
                    .map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>
                        {c.name}
                      </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="slug"
          render={({ field }) => (
            <FormItem>
              <FormLabel>SEO-URL (ЧПУ)</FormLabel>
              <FormControl>
                <Input placeholder="Згенерується автоматично, якщо залишити порожнім" {...field} />
              </FormControl>
              <FormDescription>Разрешены только латиница, цифры и дефис</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Описание</FormLabel>
              <FormControl>
                <Textarea placeholder="Краткое описание категории" className="resize-none" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="imageUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Изображение</FormLabel>
              <FormControl>
                <SingleImageUploader value={field.value} onChange={field.onChange} />
              </FormControl>
              <FormDescription>Загрузите фото категории с устройства</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="border-t pt-6">
          <h3 className="text-sm font-semibold mb-4">SEO</h3>
          <p className="text-xs text-muted-foreground mb-4">Залиште порожніми — заповниться автоматично з назви та опису</p>

          <FormField
            control={form.control}
            name="metaTitle"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Meta Title</FormLabel>
                <FormControl><Input placeholder="Автоматически: [Название] | OZO" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="metaDescription"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Meta Description</FormLabel>
                <FormControl>
                  <Textarea placeholder="Автоматически: первые 150 символов описания" className="resize-none" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="seoAlt"
            render={({ field }) => (
              <FormItem>
                <FormLabel>SEO Alt (для изображений)</FormLabel>
                <FormControl><Input placeholder="Автоматически: название категории" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Button type="submit" disabled={isPending} className="w-full">
          {isPending ? "Сохранение..." : "Сохранить"}
        </Button>
      </form>
    </Form>
  );
}
