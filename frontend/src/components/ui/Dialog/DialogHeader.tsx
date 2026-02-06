// src/components/ui/Dialog/DialogHeader.tsx
import { cn } from '@/lib/utils';

interface DialogHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export const DialogHeader = ({ children, className }: DialogHeaderProps) => {
  return <div className={cn('mb-4', className)}>{children}</div>;
};
