"use client";

import { useState, useRef } from "react";
import { Image as ImageIcon, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";

function imageSrc(value: string) {
  if (value.startsWith("/uploads/")) {
    return `/api/image/${value.replace("/uploads/", "")}?t=${Date.now()}`
  }
  return value
}

export function SingleImageUploader({ value, onChange, id }: { value?: string; onChange: (url: string) => void; id?: string }) {
  const [isUploading, setIsUploading] = useState(false);
  const [previewKey, setPreviewKey] = useState(Date.now());
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        onChange(data.url);
        setPreviewKey(Date.now());
      } else {
        alert("Ошибка загрузки: " + data.error);
      }
    } catch (error) {
      alert("Ошибка при загрузке файла");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-4">
      {value ? (
        <div className="relative w-full aspect-video border rounded-lg overflow-hidden bg-muted flex items-center justify-center">
          <img src={imageSrc(value)} alt="Category" key={previewKey} className="object-cover w-full h-full" />
          <Button 
            type="button" 
            variant="destructive" 
            size="icon" 
            className="absolute top-2 right-2"
            onClick={() => onChange("")}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      ) : (
        <div 
          className="w-full aspect-video border-2 border-dashed rounded-lg flex flex-col items-center justify-center bg-muted/50 cursor-pointer hover:bg-muted transition-colors"
          onClick={() => fileInputRef.current?.click()}
        >
          {isUploading ? (
            <div className="text-muted-foreground flex flex-col items-center">
              <Upload className="w-8 h-8 mb-2 animate-bounce" />
              <span>Загрузка...</span>
            </div>
          ) : (
            <div className="text-muted-foreground flex flex-col items-center">
              <ImageIcon className="w-8 h-8 mb-2" />
              <span>Нажмите для загрузки фото</span>
            </div>
          )}
        </div>
      )}
      <input 
        type="file" 
        accept="image/*" 
        className="hidden" 
        id={id}
        ref={fileInputRef}
        onChange={handleFileChange}
      />
    </div>
  );
}
