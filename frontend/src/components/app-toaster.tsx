"use client";

import { Toaster } from "sonner";

export function AppToaster() {
  return (
    <Toaster
      position="top-center"
      visibleToasts={1}
      toastOptions={{
        duration: 5000,
        style: {
          background: "var(--surface)",
          border: "1px solid var(--border-strong)",
          color: "var(--foreground)",
          borderRadius: "4px",
          boxShadow: "0 12px 30px rgba(0, 0, 0, 0.12)",
        },
      }}
    />
  );
}
