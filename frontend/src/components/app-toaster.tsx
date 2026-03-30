"use client";

import { Toaster } from "sonner";

export function AppToaster() {
  return (
    <Toaster
      position="bottom-center"
      offset={16}
      toastOptions={{ duration: 5000 }}
    />
  );
}
