// frontend/src/components/ui/Dialog/DialogTrigger.tsx
import React from "react";
import { cn } from "@/lib/utils";

interface DialogTriggerProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
  className?: string;
  children: React.ReactNode;
}

export const DialogTrigger = React.forwardRef<
  HTMLButtonElement,
  DialogTriggerProps
>(({ className, asChild = false, children, ...props }, ref) => {
  const Comp = asChild ? "span" : "button";

  return (
    <Comp
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center",
        "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary",
        className
      )}
      {...props}
    >
      {children}
    </Comp>
  );
});

DialogTrigger.displayName = "DialogTrigger";
