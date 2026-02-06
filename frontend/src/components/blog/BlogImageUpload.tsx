// frontend/src/components/blog/BlogImageUpload.tsx
"use client";

import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/use-toast";
import { Image as ImageIcon, Upload, X } from "lucide-react";
import { useRef, useState } from "react";

interface BlogImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  disabled?: boolean;
}

export const BlogImageUpload: React.FC<BlogImageUploadProps> = ({
  value,
  onChange,
  disabled = false,
}) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];

    // Walidacja typu pliku
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Błąd",
        description: "Można przesłać tylko pliki obrazów",
        variant: "destructive",
      });
      return;
    }

    // Walidacja rozmiaru (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Błąd",
        description: "Plik jest za duży (max 5MB)",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("images", file);

      const response = await fetch("/api/upload/blog", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Błąd podczas uploadu");
      }

      const data = await response.json();

      if (data.success && data.data.urls && data.data.urls.length > 0) {
        onChange(data.data.urls[0]);
        toast({
          title: "Sukces",
          description: "Zdjęcie zostało przesłane",
        });
      } else {
        throw new Error("Nieprawidłowa odpowiedź z serwera");
      }
    } catch (error) {
      console.error("Błąd uploadu:", error);
      toast({
        title: "Błąd",
        description: "Nie udało się przesłać zdjęcia",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemove = () => {
    onChange("");
    toast({
      title: "Usunięto",
      description: "Zdjęcie wyróżniające zostało usunięte",
    });
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium mb-2">
        Zdjęcie wyróżniające
      </label>

      {value ? (
        <div className="relative inline-block">
          <img
            src={value}
            alt="Featured"
            className="w-full max-w-md h-48 object-cover rounded-lg border border-gray-700"
          />
          <button
            type="button"
            onClick={handleRemove}
            disabled={disabled || uploading}
            className="absolute -top-2 -right-2 p-1.5 bg-red-500 hover:bg-red-600 rounded-full text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <X size={16} />
          </button>
        </div>
      ) : (
        <div
          onClick={handleClick}
          className="border-2 border-dashed border-gray-700 rounded-lg p-8 text-center cursor-pointer hover:border-gray-600 transition-colors"
        >
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
            disabled={disabled || uploading}
          />
          <ImageIcon className="w-12 h-12 mx-auto mb-4 text-gray-500" />
          <p className="text-sm text-gray-400 mb-2">
            {uploading
              ? "Przesyłanie..."
              : "Kliknij aby wybrać zdjęcie wyróżniające"}
          </p>
          <p className="text-xs text-gray-500">PNG, JPG, GIF do 5MB</p>
        </div>
      )}

      {!value && (
        <Button
          type="button"
          variant="outline"
          onClick={handleClick}
          disabled={disabled || uploading}
          className="w-full"
        >
          <Upload className="w-4 h-4 mr-2" />
          {uploading ? "Przesyłanie..." : "Wybierz zdjęcie"}
        </Button>
      )}
    </div>
  );
};
