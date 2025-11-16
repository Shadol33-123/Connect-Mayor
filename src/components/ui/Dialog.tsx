import { ReactNode } from 'react';

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
}

interface DialogContentProps {
  children: ReactNode;
  className?: string;
}

interface DialogTriggerProps {
  children: ReactNode;
  asChild?: boolean;
}

interface DialogHeaderProps {
  children: ReactNode;
}

interface DialogTitleProps {
  children: ReactNode;
}

export function Dialog({ open, onOpenChange, children }: DialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 dialog-backdrop">
      <div 
        className="fixed inset-0 bg-black/50 transition-opacity"
        onClick={() => onOpenChange(false)}
      />
      {children}
    </div>
  );
}

export function DialogContent({ children, className = '' }: DialogContentProps) {
  return (
    <div className={`relative bg-white rounded-2xl shadow-2xl p-6 w-full border profile-editor-enter-active ${className}`}>
      {children}
    </div>
  );
}

export function DialogTrigger({ children, asChild }: DialogTriggerProps) {
  return <>{children}</>;
}

export function DialogHeader({ children }: DialogHeaderProps) {
  return <div className="mb-4">{children}</div>;
}

export function DialogTitle({ children }: DialogTitleProps) {
  return <h2 className="text-lg font-semibold">{children}</h2>;
}
