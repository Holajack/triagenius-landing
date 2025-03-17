
import { useState, useEffect, createContext, useContext } from "react";
import { toast as sonnerToast } from "sonner";

type ToastProps = {
  id: string;
  title?: string;
  description?: string;
  action?: React.ReactNode;
  variant?: "default" | "destructive";
};

type ToastContextType = {
  toasts: ToastProps[];
  addToast: (toast: Omit<ToastProps, "id">) => string;
  dismissToast: (id: string) => void;
};

const ToastContext = createContext<ToastContextType | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastProps[]>([]);

  const addToast = (toast: Omit<ToastProps, "id">) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prevToasts) => [...prevToasts, { id, ...toast }]);
    return id;
  };

  const dismissToast = (id: string) => {
    setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
  };

  return (
    <ToastContext.Provider value={{ toasts, addToast, dismissToast }}>
      {children}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  
  if (!context) {
    // Return a default implementation that uses sonner toast
    return {
      toasts: [],
      toast: sonnerToast,
      dismissToast: () => {}
    };
  }
  
  return {
    toasts: context.toasts,
    toast: (props: Omit<ToastProps, "id">) => {
      return context.addToast(props);
    },
    dismissToast: context.dismissToast
  };
}

// Re-export sonner toast for backward compatibility
export { sonnerToast as toast };
