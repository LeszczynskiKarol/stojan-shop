// src/components/ui/Dialog/DialogDescription.tsx
import { cn } from '@/lib/utils';

interface DialogDescriptionProps {
  children: React.ReactNode;
  className?: string;
}

export const DialogDescription = ({ children, className }: DialogDescriptionProps) => {
  return <p className={cn('mt-2 text-sm', className)}>{children}</p>;
};
