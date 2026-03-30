"use client";

import { Toaster } from "react-hot-toast";

export function AppToaster() {
  return (
    <Toaster
      position="bottom-center"
      gutter={12}
      containerStyle={{ bottom: 20 }}
      toastOptions={{
        duration: 5000,
      }}
    />
  );
}
