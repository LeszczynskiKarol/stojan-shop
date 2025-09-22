// frontend/src/components/shared/ImageUpload.tsx
import React, { useRef } from 'react';
import { Button } from '@/components/ui/Button';
import { ImageUploadProps } from '@/types/allegro.types';

export const ImageUpload: React.FC<ImageUploadProps> = ({
  onUpload,
  disabled = false,
  maxFiles = 8,
  accept = 'image/*',
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      if (files.length > maxFiles) {
        alert(`Możesz przesłać maksymalnie ${maxFiles} plików jednocześnie`);
        return;
      }
      onUpload(files);
    }
  };

  return (
    <div>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleChange}
        accept={accept}
        multiple
        className="hidden"
        disabled={disabled}
      />
      <Button onClick={handleClick} disabled={disabled} variant="outline" className="w-full">
        {disabled ? 'Przesyłanie...' : 'Dodaj zdjęcia'}
      </Button>
    </div>
  );
};
