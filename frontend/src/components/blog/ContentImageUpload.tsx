// frontend/src/components/blog/ContentImageUpload.tsx
"use client";

import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/use-toast";
import { ImagePlus, Upload, X } from "lucide-react";
import { useRef, useState } from "react";

interface ContentImageUploadProps {
  onImageInsert: (imageUrl: string) => void;
  disabled?: boolean;
}

export const ContentImageUpload: React.FC<ContentImageUploadProps> = ({
  onImageInsert,
  disabled = false,
}) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    // Walidacja
    const validFiles: File[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      if (!file.type.startsWith("image/")) {
        toast({
          title: "Błąd",
          description: `${file.name} nie jest obrazem`,
          variant: "destructive",
        });
        continue;
      }

      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Błąd",
          description: `${file.name} jest za duży (max 5MB)`,
          variant: "destructive",
        });
        continue;
      }

      validFiles.push(file);
    }

    if (validFiles.length === 0) return;

    setUploading(true);

    try {
      const formData = new FormData();
      validFiles.forEach((file) => {
        formData.append("images", file);
      });

      const response = await fetch("/api/upload/blog", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Błąd podczas uploadu");
      }

      const data = await response.json();

      if (data.success && data.data.urls && data.data.urls.length > 0) {
        setUploadedImages((prev) => [...prev, ...data.data.urls]);
        toast({
          title: "Sukces",
          description: `Przesłano ${data.data.urls.length} ${
            data.data.urls.length === 1 ? "obraz" : "obrazów"
          }`,
        });
      } else {
        throw new Error("Nieprawidłowa odpowiedź z serwera");
      }
    } catch (error) {
      console.error("Błąd uploadu:", error);
      toast({
        title: "Błąd",
        description: "Nie udało się przesłać obrazów",
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

  const handleInsert = (imageUrl: string) => {
    onImageInsert(imageUrl);
  };

  const handleRemove = (index: number) => {
    setUploadedImages((prev) => prev.filter((_, i) => i !== index));
    toast({
      title: "Usunięto",
      description: "Obraz został usunięty z listy",
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium">Obrazy do treści</label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleClick}
          disabled={disabled || uploading}
        >
          <Upload className="w-4 h-4 mr-2" />
          {uploading ? "Przesyłanie..." : "Dodaj obrazy"}
        </Button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileChange}
        accept="image/*"
        multiple
        className="hidden"
        disabled={disabled || uploading}
      />

      {uploadedImages.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {uploadedImages.map((url, index) => (
            <div key={index} className="relative group">
              <img
                src={url}
                alt={`Uploaded ${index + 1}`}
                className="w-full h-32 object-cover rounded-lg border border-gray-700"
              />
              <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => handleInsert(url)}
                  disabled={disabled}
                  className="p-2 bg-blue-500 hover:bg-blue-600 rounded-lg text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Wstaw do treści"
                >
                  <ImagePlus size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => handleRemove(index)}
                  disabled={disabled}
                  className="p-2 bg-red-500 hover:bg-red-600 rounded-lg text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Usuń"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div
          onClick={handleClick}
          className="border-2 border-dashed border-gray-700 rounded-lg p-6 text-center cursor-pointer hover:border-gray-600 transition-colors"
        >
          <ImagePlus className="w-10 h-10 mx-auto mb-3 text-gray-500" />
          <p className="text-sm text-gray-400 mb-1">
            {uploading
              ? "Przesyłanie..."
              : "Kliknij aby dodać obrazy do treści"}
          </p>
          <p className="text-xs text-gray-500">
            Możesz wybrać wiele plików naraz (PNG, JPG, GIF do 5MB każdy)
          </p>
        </div>
      )}

      {uploadedImages.length > 0 && (
        <p className="text-xs text-gray-400">
          💡 Najedź na obraz i kliknij <ImagePlus className="inline w-3 h-3" />{" "}
          aby wstawić do treści
        </p>
      )}
    </div>
  );
};
