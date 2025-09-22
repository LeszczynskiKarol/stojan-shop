// frontend/src/components/ui/FileUploader.tsx
import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { X } from 'lucide-react';

interface FileUploaderProps {
  multiple?: boolean;
  maxFiles?: number;
  accept?: string;
  onUpload: (files: File[]) => Promise<string[]>;
  onRemove?: (index: number) => void;
  value?: string[];
}

export const FileUploader: React.FC<FileUploaderProps> = ({
  multiple = false,
  maxFiles = 10,
  accept,
  onUpload,
  onRemove,
  value = [],
}) => {
  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      try {
        await onUpload(acceptedFiles);
      } catch (error) {
        console.error('Błąd podczas uploadu:', error);
      }
    },
    [onUpload]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple,
    maxFiles,
    accept: accept ? { [accept]: [] } : undefined,
  });

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-6 text-center cursor-pointer
          ${isDragActive ? 'border-primary' : 'border-gray-300'}
        `}
      >
        <input {...getInputProps()} />
        <p>Przeciągnij i upuść pliki lub kliknij aby wybrać</p>
      </div>

      {value.length > 0 && (
        <div className="grid grid-cols-4 gap-4">
          {value.map((url, index) => (
            <div key={url} className="relative">
              <img
                src={url}
                alt={`Zdjęcie ${index + 1}`}
                className="rounded-lg object-cover w-full h-32"
              />
              {onRemove && (
                <button
                  onClick={() => onRemove(index)}
                  className="absolute -top-2 -right-2 p-1 bg-red-500 rounded-full text-white"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
