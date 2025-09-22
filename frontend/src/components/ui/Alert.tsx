// frontend/src/components/ui/Alert.tsx
import React from "react";
import { cn } from "@/lib/utils";

interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "destructive" | "success" | "warning";
  children?: React.ReactNode;
}

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ className, variant = "default", children, ...props }, ref) => {
    const variantStyles = {
      default:
        "bg-blue-50 text-blue-900 border-blue-200 dark:bg-blue-950 dark:text-blue-100 dark:border-blue-800",
      destructive:
        "bg-red-50 text-red-900 border-red-200 dark:bg-red-950 dark:text-red-100 dark:border-red-800",
      success:
        "bg-green-50 text-green-900 border-green-200 dark:bg-green-950 dark:text-green-100 dark:border-green-800",
      warning:
        "bg-yellow-50 text-yellow-900 border-yellow-200 dark:bg-yellow-950 dark:text-yellow-100 dark:border-yellow-800",
    };

    return (
      <div
        ref={ref}
        role="alert"
        className={cn(
          "relative w-full rounded-lg border p-4",
          variantStyles[variant],
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Alert.displayName = "Alert";

interface AlertDescriptionProps
  extends React.HTMLAttributes<HTMLParagraphElement> {
  children?: React.ReactNode;
}

const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  AlertDescriptionProps
>(({ className, children, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm [&_p]:leading-relaxed", className)}
    {...props}
  >
    {children}
  </p>
));

AlertDescription.displayName = "AlertDescription";

interface AlertTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  children?: React.ReactNode;
}

const AlertTitle = React.forwardRef<HTMLHeadingElement, AlertTitleProps>(
  ({ className, children, ...props }, ref) => (
    <h5
      ref={ref}
      className={cn("mb-1 font-medium leading-none tracking-tight", className)}
      {...props}
    >
      {children}
    </h5>
  )
);

AlertTitle.displayName = "AlertTitle";

export { Alert, AlertDescription, AlertTitle };
