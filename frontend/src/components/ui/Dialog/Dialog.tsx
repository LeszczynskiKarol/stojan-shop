// src/components/ui/Dialog/Dialog.tsx
import React, { Fragment } from 'react';
import { Transition } from '@headlessui/react';
import { cn } from '@/lib/utils';

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  className?: string;
}

export const Dialog = ({ open, onOpenChange, children, className }: DialogProps) => {
  return (
    <Transition show={open} as={Fragment}>
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="min-h-screen p-4 flex items-center justify-center">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div
              className="fixed inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => onOpenChange(false)}
            />
          </Transition.Child>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <div
              className={cn(
                'relative w-full max-w-[90vw] lg:max-w-[80vw] xl:max-w-[1100px] text-left align-middle transition-all transform bg-background rounded-lg shadow-xl',
                className
              )}
            >
              {children}
            </div>
          </Transition.Child>
        </div>
      </div>
    </Transition>
  );
};
