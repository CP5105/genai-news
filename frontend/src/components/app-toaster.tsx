"use client";

import { Toaster } from "react-hot-toast";

export function AppToaster() {
  return (
    <Toaster
      position="bottom-center"
      gutter={10}
      containerStyle={{
        bottom: "1rem",
        width: "100%",
        display: "flex",
        justifyContent: "center",
      }}
      toastOptions={{
        duration: 5000,
      }}
    />
  );
}
