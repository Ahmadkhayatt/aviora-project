"use client"

import { Toaster as HotToastToaster, toast as hotToast } from "react-hot-toast";

export interface ToastOptions {
  readonly id?: string;
  readonly duration?: number;
  readonly position?: "top-left" | "top-center" | "top-right" | "bottom-left" | "bottom-center" | "bottom-right";
  readonly type?: "success" | "error" | "loading" | "default";
}

export interface ToastState {
  readonly id: string;
  readonly message: string;
  readonly type: "success" | "error" | "loading" | "default";
  readonly duration?: number;
}

const TOAST_CONFIG = {
  success: {
    style: { background: "#10b981", color: "white", border: "1px solid #10b981" },
    iconTheme: { primary: "white", secondary: "#10b981" },
  },
  error: {
    style: { background: "#ef4444", color: "white", border: "1px solid #ef4444" },
    iconTheme: { primary: "white", secondary: "#ef4444" },
  },
  loading: {
    style: { background: "#f59e0b", color: "white", border: "1px solid #f59e0b" },
  },
  default: {
    style: { background: "#1f2937", color: "white", border: "1px solid #374151" },
  },
};

const ToastContainer = () => {
  return (
    <HotToastToaster
      position="top-right"
      toastOptions={{
        success: { duration: 3000, style: TOAST_CONFIG.success.style },
        error: { duration: 5000, style: TOAST_CONFIG.error.style },
        loading: { duration: 0, style: TOAST_CONFIG.loading.style },
        blank: { duration: 3000, style: TOAST_CONFIG.default.style },
      }}
      containerStyle={{ top: 80, right: 20 }}
    />
  );
};

const showToast = (type: ToastState["type"], message: string, options?: ToastOptions): string => {
  const id = options?.id || Math.random().toString(36).substr(2, 9);

  const toastFn = type === "success"
    ? hotToast.success
    : type === "error"
    ? hotToast.error
    : type === "loading"
    ? hotToast.loading
    : hotToast;

  toastFn(message, {
    id,
    duration: options?.duration,
    style: {
      background: "#1e293b",
      border: "1px solid #475569",
      color: "#f1f5f9",
      borderRadius: "12px",
      padding: "16px",
      boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 10px 10px -5px rgb(0 0 0 / 0.04)",
      fontSize: "14px",
      fontWeight: "500",
      maxWidth: "400px",
    },
    iconTheme: {
      primary: type === "success" ? "#10b981" : type === "error" ? "#ef4444" : type === "loading" ? "#f59e0b" : "#94a3b8",
      secondary: "#1e293b",
    },
    ariaProps: {
      role: "alert",
      "aria-live": "polite",
    },
  });

  return id;
};

const updateToast = (id: string, type: ToastState["type"], message: string) => {
  hotToast.dismiss(id);
  showToast(type, message, { id });
};

const dismissToast = (id?: string) => {
  if (id) {
    hotToast.dismiss(id);
  } else {
    hotToast.dismiss();
  }
};

export { ToastContainer, showToast, updateToast, dismissToast };
