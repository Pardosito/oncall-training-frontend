import { ToastNotification } from "@carbon/react";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { ToastContext, type ToastInput } from "./toast-context";
import styles from "./ToastProvider.module.scss";

export const TOAST_TIMEOUT_MS = 5000;

type Toast = ToastInput & { id: number };

/**
 * App-level toasts for action feedback: bottom-right, auto-dismissed after 5 s, announced
 * politely, never focused (CONVENTIONS §5.7, DECISIONS D-15).
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(0);
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>());

  const dismiss = useCallback((id: number) => {
    clearTimeout(timers.current.get(id));
    timers.current.delete(id);
    setToasts((current) => current.filter((t) => t.id !== id));
  }, []);

  const show = useCallback(
    (toast: ToastInput) => {
      nextId.current += 1;
      const id = nextId.current;
      setToasts((current) => [...current, { ...toast, id }]);
      timers.current.set(
        id,
        setTimeout(() => dismiss(id), TOAST_TIMEOUT_MS),
      );
    },
    [dismiss],
  );

  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach((timer) => clearTimeout(timer));
  }, []);

  return (
    <ToastContext value={show}>
      {children}
      <div className={styles.region} aria-live="polite">
        {toasts.map((toast) => (
          <ToastNotification
            key={toast.id}
            kind={toast.kind}
            title={toast.title}
            subtitle={toast.subtitle}
            lowContrast
            role="status"
            onClose={() => {
              dismiss(toast.id);
              return false;
            }}
          />
        ))}
      </div>
    </ToastContext>
  );
}
