"use client";

import { createContext, useCallback, useContext, useState, ReactNode } from "react";
import { Icon } from "@iconify/react";

type ToastVariant = "success" | "error" | "info";

interface ToastItem {
  id: number;
  message: string;
  variant: ToastVariant;
}

interface ToastContextValue {
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

// Solid, saturated backgrounds (not the pale `bg-light*` tints used
// elsewhere for badges) — a toast needs to read at a glance, so it gets
// white text on a vibrant fill instead of low-contrast tinted-on-tinted.
const variantStyles: Record<ToastVariant, string> = {
  success: "bg-success text-white border-success",
  error: "bg-error text-white border-error",
  info: "bg-primary text-white border-primary",
};

const variantIcon: Record<ToastVariant, string> = {
  success: "tabler:circle-check-filled",
  error: "tabler:circle-x-filled",
  info: "tabler:info-circle-filled",
};

let idCounter = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const push = useCallback((message: string, variant: ToastVariant) => {
    const id = ++idCounter;
    setToasts((prev) => [...prev, { id, message, variant }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const value: ToastContextValue = {
    success: (message) => push(message, "success"),
    error: (message) => push(message, "error"),
    info: (message) => push(message, "info"),
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 w-full max-w-sm px-4 sm:px-0">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`flex items-start gap-2 rounded-xl border px-4 py-3 shadow-lg animate-in fade-in slide-in-from-top-2 ${variantStyles[t.variant]}`}
          >
            <Icon icon={variantIcon[t.variant]} width={20} height={20} className="mt-0.5 shrink-0" />
            <p className="text-sm font-medium">{t.message}</p>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
