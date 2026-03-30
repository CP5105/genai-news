"use client";

import { Toaster } from "sonner";

export function AppToaster() {
  return (
    <Toaster
      position="top-center"
      visibleToasts={1}
      offset={24}
      toastOptions={{
        duration: 5000,
        classNames: {
          toast: "genai-toast",
          content: "genai-toast-content",
          title: "genai-toast-title",
          description: "genai-toast-description",
          actionButton: "genai-toast-action",
        },
        style: {
          background: "var(--surface)",
          border: "1px solid var(--border-strong)",
          color: "var(--foreground)",
          borderRadius: "4px",
          boxShadow: "0 14px 34px rgba(0, 0, 0, 0.12)",
        },
      }}
    />
  );
}
