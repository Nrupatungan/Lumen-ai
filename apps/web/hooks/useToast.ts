"use client";

import { ToastContext } from "@/components/ToastProvider";
import * as React from "react";

export function useToast() {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context;
}
