import { createContext, use } from "react";

export type ToastInput = {
  kind: "success" | "info" | "warning" | "error";
  title: string;
  subtitle?: string;
};

export type ShowToast = (toast: ToastInput) => void;

export const ToastContext = createContext<ShowToast | null>(null);

export function useToast(): ShowToast {
  const show = use(ToastContext);
  if (!show) throw new Error("useToast must be used inside <ToastProvider>");
  return show;
}
