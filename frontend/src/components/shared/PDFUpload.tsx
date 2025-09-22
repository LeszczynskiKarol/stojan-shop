// frontend/src/components/shared/PDFUpload.tsx
import React, { useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { X } from "lucide-react";

interface PDFUploadProps {
  onUpload: (file: FileList) => void;
  onRemove?: (url: string) => void;
  currentUrls?: string[]; // Zmieniamy na tablicę URLi
  disabled?: boolean;
  multiple?: boolean; // Dodajemy opcję wielu plików
}

export const PDFUpload: React.FC<PDFUploadProps> = ({
  onUpload,
  onRemove,
  currentUrls = [],
  disabled = false,
  multiple = false,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      setIsUploading(true);
      try {
        await onUpload(files);
      } finally {
        setIsUploading(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    }
  };

  return (
    <div className="space-y-2">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleChange}
        accept="application/pdf"
        className="hidden"
        disabled={isUploading || disabled}
        multiple={multiple}
      />

      {currentUrls.length > 0 ? (
        <div className="space-y-2">
          {currentUrls.map((url, index) => (
            <div key={index} className="flex items-center space-x-2">
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                Karta katalogowa {currentUrls.length > 1 ? `#${index + 1}` : ""}
              </a>
              {onRemove && (
                <Button
                  onClick={() => onRemove(url)}
                  variant="destructive"
                  size="icon"
                  type="button"
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          ))}

          {multiple && (
            <Button
              onClick={handleClick}
              disabled={isUploading || disabled}
              variant="outline"
              type="button"
              className="mt-2"
            >
              {isUploading
                ? "Przesyłanie..."
                : "Dodaj więcej kart katalogowych"}
            </Button>
          )}
        </div>
      ) : (
        <Button
          onClick={handleClick}
          disabled={isUploading || disabled}
          variant="outline"
          type="button"
        >
          {isUploading ? "Przesyłanie..." : "Dodaj kartę katalogową (PDF)"}
        </Button>
      )}
    </div>
  );
};
