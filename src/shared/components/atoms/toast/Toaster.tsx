import * as React from "react";
import {
  Toast,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "./toast";
import { subscribeToToasts, type InternalToast } from "./toast-store";

export function Toaster() {
  const [toasts, setToasts] = React.useState<InternalToast[]>([]);

  React.useEffect(() => {
    return subscribeToToasts((toast) => {
      setToasts((prev) => [...prev, toast]);
    });
  }, []);

  const dismiss = (id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastProvider>
      {toasts.map((t) => (
        <Toast
          key={t.id}
          variant={t.variant ?? "default"}
          defaultOpen
          onOpenChange={(open) => {
            if (!open) dismiss(t.id);
          }}
        >
          {t.title ? <ToastTitle>{t.title}</ToastTitle> : null}
          {t.description ? (
            <ToastDescription>{t.description}</ToastDescription>
          ) : null}
        </Toast>
      ))}
      <ToastViewport />
    </ToastProvider>
  );
}
