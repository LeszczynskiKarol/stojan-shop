// src/components/ui/Dialog/DialogContent.tsx
export const DialogContent = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return <div className={`mt-2 ${className || ''}`}>{children}</div>;
};
