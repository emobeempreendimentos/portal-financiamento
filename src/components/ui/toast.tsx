"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface Toast {
  id: string;
  title: string;
  description?: string;
  variant?: "default" | "success" | "error" | "warning";
}

interface ToastContextType {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, "id">) => void;
  removeToast: (id: string) => void;
}

const ToastContext = React.createContext<ToastContextType | undefined>(undefined);

const toastVariants = cva(
  "relative flex w-full items-start gap-3 rounded-2xl p-4 shadow-lg transition-all duration-300",
  {
    variants: {
      variant: {
        default: "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900",
        success: "bg-green-500 text-white",
        error: "bg-red-500 text-white",
        warning: "bg-amber-500 text-white",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([]);

  const addToast = React.useCallback((toast: Omit<Toast, "id">) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { ...toast, id }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 w-full max-w-sm">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={cn(toastVariants({ variant: toast.variant }), "animate-in slide-in-from-bottom-5")}
          >
            <div className="flex-1">
              <p className="font-semibold text-sm">{toast.title}</p>
              {toast.description && (
                <p className="text-xs opacity-80 mt-0.5">{toast.description}</p>
              )}
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="opacity-70 hover:opacity-100 transition-opacity mt-0.5"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = React.useContext(ToastContext);
  if (!context) throw new Error("useToast must be used within ToastProvider");
  return context;
}
