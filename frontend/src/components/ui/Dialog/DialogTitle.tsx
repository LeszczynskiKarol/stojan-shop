// src/components/ui/Dialog/DialogTitle.tsx
import { cn } from '@/lib/utils';

interface DialogTitleProps {
  children: React.ReactNode;
  className?: string;
}

export const DialogTitle = ({ children, className }: DialogTitleProps) => {
  return <h3 className={cn('text-lg font-semibold leading-6', className)}>{children}</h3>;
};
