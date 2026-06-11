"use client";

import { useState } from "react";
import { Plus, ChevronRight, ChevronDown, Folder, MoreVertical, Trash, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CategoryForm } from "./category-form";
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
import { deleteCategory } from "@/app/actions/catalog";
import { toast } from "sonner";

export function CategoriesClient({ initialCategories }: { initialCategories: any[] }) {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<any>(null);
  const [expandedNodes, setExpandedNodes] = useState<Set<number>>(new Set());
  const [categoryToDelete, setCategoryToDelete] = useState<number | null>(null);

  // Build tree from flat list
  const rootCategories = initialCategories.filter((c) => !c.parentId);
  
  const toggleNode = (id: number) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedNodes(newExpanded);
  };

  const handleCreateNew = () => {
    setSelectedCategory({ id: "new", name: "", parentId: null, slug: "", description: "" });
  };

  const handleCreateSub = (parentId: number) => {
    setSelectedCategory({ id: "new", name: "", parentId, slug: "", description: "" });
    setExpandedNodes(new Set(expandedNodes).add(parentId));
  };

  const handleDelete = async () => {
    if (!categoryToDelete) return;
    
    const result = await deleteCategory(categoryToDelete);
    if (result.success) {
      toast.success("Категория удалена");
      if (selectedCategory?.id === categoryToDelete) setSelectedCategory(null);
    } else {
      toast.error(result.error || "Помилка видалення");
    }
    setCategoryToDelete(null);
  };

  const renderTree = (categories: any[], level = 0) => {
    return categories
      .filter((c) => c.name.toLowerCase().includes(search.toLowerCase()))
      .map((cat) => {
        const children = initialCategories.filter((c) => c.parentId === cat.id);
        const hasChildren = children.length > 0;
        const isExpanded = expandedNodes.has(cat.id);

        return (
          <div key={cat.id} className="w-full">
            <div 
              className={`flex items-center justify-between p-2 rounded-md hover:bg-muted/50 cursor-pointer ${selectedCategory?.id === cat.id ? "bg-muted" : ""}`}
              onClick={() => setSelectedCategory(cat)}
            >
              <div className="flex items-center gap-2" style={{ paddingLeft: `${level * 16}px` }}>
                {hasChildren ? (
                  <div onClick={(e) => { e.stopPropagation(); toggleNode(cat.id); }} className="w-4 h-4 cursor-pointer">
                    {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </div>
                ) : (
                  <div className="w-4 h-4" /> // Spacer
                )}
                <Folder className="w-4 h-4 text-blue-500" />
                <span className="text-sm font-medium">{cat.name}</span>
              </div>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                  <Button variant="ghost" size="icon" className="h-6 w-6">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setSelectedCategory(cat)}>
                    <Edit className="w-4 h-4 mr-2" /> Редактировать
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleCreateSub(cat.id)}>
                    <Plus className="w-4 h-4 mr-2" /> Добавить подкатегорию
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-red-600" onClick={() => setCategoryToDelete(cat.id)}>
                    <Trash className="w-4 h-4 mr-2" /> Удалить
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            
            {hasChildren && isExpanded && (
              <div className="mt-1">
                {renderTree(children, level + 1)}
              </div>
            )}
          </div>
        );
      });
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-[1fr_2fr] gap-6">
        {/* Left column - Tree */}
        <div className="border rounded-lg p-4 bg-card h-[calc(100vh-200px)] overflow-y-auto">
          <div className="flex items-center gap-2 mb-4">
            <Input 
              placeholder="Поиск категорий..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1"
            />
            <Button size="icon" variant="outline" onClick={handleCreateNew}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          <div className="space-y-1">
            {renderTree(rootCategories)}
            {rootCategories.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">Нет категорий</p>
            )}
          </div>
        </div>

        {/* Right column - Form */}
        <div className="border rounded-lg p-6 bg-card">
          {selectedCategory ? (
            <CategoryForm 
              category={selectedCategory} 
              categories={initialCategories} 
              onSuccess={() => setSelectedCategory(null)}
            />
          ) : (
            <div className="h-full flex items-center justify-center text-muted-foreground">
              Выберите категорию для редактирования или создайте новую
            </div>
          )}
        </div>
      </div>

      <AlertDialog open={!!categoryToDelete} onOpenChange={(open) => !open && setCategoryToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить категорию?</AlertDialogTitle>
            <AlertDialogDescription>
              Это действие необратимо. Убедитесь, что к категории не привязаны товары, иначе удаление будет заблокировано.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={handleDelete}>
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
