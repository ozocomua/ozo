"use client";

import React, { useState, useRef } from "react";
import { X, GripVertical, Image as ImageIcon, Loader2 } from "lucide-react";

interface MediaItem {
  id: string;
  url: string;
  isMain: boolean;
  order: number;
}

interface NativeMediaUploaderProps {
  value: MediaItem[];
  onChange: (items: MediaItem[]) => void;
}

export function NativeMediaUploader({ value, onChange }: NativeMediaUploaderProps) {
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const uploadFile = async (file: File): Promise<{ url: string }> => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: formData });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || "Upload failed");
    return { url: data.url };
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await handleFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFiles = async (files: File[]) => {
    setUploading(true);
    const tempIdPrefix = `pending-${Date.now()}-`;
    const tempItems: MediaItem[] = files.map((file, idx) => ({
      id: `${tempIdPrefix}${idx}`,
      url: "",
      isMain: value.length === 0 && idx === 0,
      order: value.length + idx,
    }));
    onChange([...value, ...tempItems]);

    for (let i = 0; i < files.length; i++) {
      try {
        const { url } = await uploadFile(files[i]);
        onChange((prev) =>
          prev.map((item, idx) =>
            item.id === `${tempIdPrefix}${i}` ? { ...item, url } : item
          )
        );
      } catch {
        onChange((prev) => prev.filter((item) => item.id !== `${tempIdPrefix}${i}`));
      }
    }
    setUploading(false);
  };

  const removeMedia = (id: string) => {
    const updated = value.filter((item) => item.id !== id);
    if (updated.length > 0 && !updated.some((i) => i.isMain)) {
      updated[0].isMain = true;
    }
    onChange(updated);
  };

  const setMain = (id: string) => {
    onChange(value.map((item) => ({ ...item, isMain: item.id === id })));
  };

  const onDragStartSort = (e: React.DragEvent, index: number) => {
    setDraggedIdx(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const onDropSort = (e: React.DragEvent, dropIdx: number) => {
    e.preventDefault();
    if (draggedIdx === null || draggedIdx === dropIdx) return;

    const newItems = [...value];
    const [draggedItem] = newItems.splice(draggedIdx, 1);
    newItems.splice(dropIdx, 0, draggedItem);

    const updatedWithOrder = newItems.map((item, idx) => ({ ...item, order: idx }));
    onChange(updatedWithOrder);
    setDraggedIdx(null);
  };

  return (
    <div className="space-y-4">
      <div
        className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-10 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-muted/50 transition-colors"
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        {uploading ? (
          <>
            <Loader2 className="w-10 h-10 text-muted-foreground mb-4 animate-spin" />
            <h3 className="font-semibold text-lg">Загрузка...</h3>
            <p className="text-sm text-muted-foreground mt-1">Пожалуйста, подождите</p>
          </>
        ) : (
          <>
            <ImageIcon className="w-10 h-10 text-muted-foreground mb-4" />
            <h3 className="font-semibold text-lg">Перетащите изображения сюда</h3>
            <p className="text-sm text-muted-foreground mt-1">или кликните для выбора файлов</p>
          </>
        )}
        <input
          type="file"
          multiple
          accept="image/*"
          className="hidden"
          ref={fileInputRef}
          onChange={(e) => {
            if (e.target.files) {
              void handleFiles(Array.from(e.target.files));
              e.target.value = "";
            }
          }}
        />
      </div>

      {value.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {value.map((item, index) => (
            <div
              key={item.id}
              className={`relative group border rounded-lg overflow-hidden bg-muted flex flex-col aspect-square ${
                draggedIdx === index ? "opacity-50" : "opacity-100"
              }`}
              draggable
              onDragStart={(e) => onDragStartSort(e, index)}
              onDragOver={handleDragOver}
              onDrop={(e) => onDropSort(e, index)}
            >
              <div className="absolute top-2 left-2 z-10 cursor-grab active:cursor-grabbing bg-background/80 p-1 rounded">
                <GripVertical className="w-4 h-4" />
              </div>
              <button
                type="button"
                onClick={() => removeMedia(item.id)}
                className="absolute top-2 right-2 z-10 bg-background/80 hover:bg-red-500 hover:text-white p-1 rounded transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              {item.url ? (
                <img src={item.url.startsWith("/api/image/") ? item.url : `${item.url}`} alt="preview" className="object-cover w-full h-full" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Loader2 className="w-8 h-8 text-muted-foreground animate-spin" />
                </div>
              )}

              <div className="absolute bottom-0 left-0 right-0 p-2 bg-background/90 text-xs flex items-center justify-between">
                <label className="flex items-center gap-1 cursor-pointer">
                  <input
                    type="radio"
                    checked={item.isMain}
                    onChange={() => setMain(item.id)}
                    className="cursor-pointer"
                  />
                  <span>Главное</span>
                </label>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
