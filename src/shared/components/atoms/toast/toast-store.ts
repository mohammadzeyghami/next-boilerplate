import type { ToastVariant } from "./toast";

export type ToastOptions = {
  title?: string;
  description?: string;
  variant?: ToastVariant;
};

export type InternalToast = ToastOptions & { id: number };

type Listener = (toast: InternalToast) => void;

let listeners: Listener[] = [];
let idCounter = 1;

export function toast(options: ToastOptions) {
  const payload: InternalToast = {
    id: idCounter++,
    ...options,
  };
  listeners.forEach((listener) => listener(payload));
}

export function subscribeToToasts(listener: Listener) {
  listeners.push(listener);
  return () => {
    listeners = listeners.filter((l) => l !== listener);
  };
}
