"use client";

import * as React from "react";
import { cn } from "cn";
import { X, CheckCircle2, AlertCircle, Info } from "lucide-react";

export type ToastVariant = "default" | "destructive" | "success";

export interface ToastMessage {
  id: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  variant?: ToastVariant;
  duration?: number;
}

type ToastActionType =
  | { type: "ADD_TOAST"; toast: ToastMessage }
  | { type: "DISMISS_TOAST"; toastId: string }
  | { type: "REMOVE_TOAST"; toastId: string };

interface State {
  toasts: ToastMessage[];
}

const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>();

const toastListeners: Array<(state: State) => void> = [];
let memoryState: State = { toasts: [] };

function dispatch(action: ToastActionType) {
  memoryState = reducer(memoryState, action);
  toastListeners.forEach((listener) => {
    listener(memoryState);
  });
}

function reducer(state: State, action: ToastActionType): State {
  switch (action.type) {
    case "ADD_TOAST":
      return {
        ...state,
        toasts: [action.toast, ...state.toasts].slice(0, 5),
      };
    case "DISMISS_TOAST": {
      const { toastId } = action;
      if (toastTimeouts.has(toastId)) {
        clearTimeout(toastTimeouts.get(toastId)!);
        toastTimeouts.delete(toastId);
      }
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== toastId),
      };
    }
    case "REMOVE_TOAST":
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.toastId),
      };
  }
}

export function toast({
  title,
  description,
  variant = "default",
  action,
  duration = 5000,
}: Omit<ToastMessage, "id">) {
  const id = Math.random().toString(36).substring(2, 9);

  const newToast: ToastMessage = {
    id,
    title,
    description,
    variant,
    action,
    duration,
  };

  dispatch({ type: "ADD_TOAST", toast: newToast });

  if (duration > 0) {
    const timeout = setTimeout(() => {
      dispatch({ type: "DISMISS_TOAST", toastId: id });
    }, duration);
    toastTimeouts.set(id, timeout);
  }

  return {
    id,
    dismiss: () => dispatch({ type: "DISMISS_TOAST", toastId: id }),
  };
}

export function useToast() {
  const [state, setState] = React.useState<State>(memoryState);

  React.useEffect(() => {
    toastListeners.push(setState);
    return () => {
      const index = toastListeners.indexOf(setState);
      if (index > -1) {
        toastListeners.splice(index, 1);
      }
    };
  }, []);

  return {
    ...state,
    toast,
    dismiss: (toastId: string) => dispatch({ type: "DISMISS_TOAST", toastId }),
  };
}

export function Toaster() {
  const { toasts, dismiss } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      className="fixed bottom-0 right-0 z-50 flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px] gap-2 pointer-events-none"
    >
      {toasts.map((item) => (
        <div
          key={item.id}
          className={cn(
            "pointer-events-auto relative flex w-full items-center justify-between space-x-3 overflow-hidden rounded-lg border p-4 shadow-lg transition-all animate-in slide-in-from-bottom-5",
            item.variant === "destructive"
              ? "border-destructive/40 bg-destructive/90 text-destructive-foreground"
              : item.variant === "success"
              ? "border-emerald-500/40 bg-card text-card-foreground ring-1 ring-emerald-500/30"
              : "border-border bg-card text-card-foreground"
          )}
        >
          <div className="flex items-start gap-3">
            {item.variant === "destructive" && (
              <AlertCircle className="size-5 shrink-0 text-white mt-0.5" />
            )}
            {item.variant === "success" && (
              <CheckCircle2 className="size-5 shrink-0 text-emerald-400 mt-0.5" />
            )}
            {item.variant === "default" && (
              <Info className="size-5 shrink-0 text-primary mt-0.5" />
            )}
            <div className="grid gap-1">
              {item.title && (
                <div className="text-sm font-semibold">{item.title}</div>
              )}
              {item.description && (
                <div className="text-xs opacity-90 leading-relaxed">{item.description}</div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {item.action}
            <button
              type="button"
              onClick={() => dismiss(item.id)}
              className="rounded-md p-1 opacity-70 transition-opacity hover:opacity-100 focus:outline-hidden"
              aria-label="Close toast"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
