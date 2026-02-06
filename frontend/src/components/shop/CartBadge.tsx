'use client';
import * as React from 'react';
import { motion, AnimatePresence, HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';

interface CartBadgeProps
  extends Omit<HTMLMotionProps<'div'>, keyof React.HTMLAttributes<HTMLDivElement>> {
  count: number;
  className?: string;
}

export const CartBadge = ({ count, className, ...props }: CartBadgeProps) => {
  if (count === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0 }}
        className={cn(
          'absolute -top-2 -right-2 h-5 w-5 rounded-full bg-df0024 dark:bg-df0024 text-xs flex items-center justify-center font-medium shadow-sm',
          className
        )}
        {...props}
      >
        <motion.span key={count} initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
          {count}
        </motion.span>
      </motion.div>
    </AnimatePresence>
  );
};
