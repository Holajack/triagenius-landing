
import { useState, createContext, useContext } from "react";
import { toast as sonnerToast } from "sonner";

type ToastProps = {
  id: string;
  title?: string;
  description?: string;
  action?: React.ReactNode;
  variant?: "default" | "destructive";
  duration?: number; // Add duration property
};

type ToastContextType = {
  toasts: ToastProps[];
  addToast: (toast: Omit<ToastProps, "id">) => string;
  dismissToast: (id: string) => void;
};

const ToastContext = createContext<ToastContextType | null>(null);

// Create provider component as a regular function component
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

  return {
    Provider: ToastContext.Provider,
    providerProps: {
      value: { toasts, addToast, dismissToast },
      children
    }
  };
}

export function useToast() {
  const context = useContext(ToastContext);
  
  if (!context) {
    // Return a default implementation that uses sonner toast
    return {
      toasts: [],
      toast: (props: Omit<ToastProps, "id">) => {
        // Pass through to sonner toast
        sonnerToast(props.title || "", {
          description: props.description,
          duration: props.duration
        });
        return "";
      },
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
