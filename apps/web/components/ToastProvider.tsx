"use client";

import * as React from "react";
import { Snackbar, Alert, AlertColor } from "@mui/material";

type ToastOptions = {
  title?: string;
  description?: string;
  severity?: AlertColor; // success | error | warning | info
  duration?: number;
};

type ToastContextType = {
  toast: (options: ToastOptions) => void;
};

export const ToastContext = React.createContext<ToastContextType | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);
  const [toast, setToast] = React.useState<ToastOptions>({
    severity: "info",
    duration: 4000,
  });

  const showToast = (options: ToastOptions) => {
    setToast({
      severity: options.severity ?? "info",
      title: options.title,
      description: options.description,
      duration: options.duration ?? 4000,
    });
    setOpen(true);
  };

  const handleClose = (_: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === "clickaway") return;
    setOpen(false);
  };

  return (
    <ToastContext.Provider value={{ toast: showToast }}>
      {children}

      <Snackbar
        open={open}
        autoHideDuration={toast.duration}
        onClose={handleClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          onClose={handleClose}
          severity={toast.severity}
          variant="filled"
          sx={{ width: "100%" }}
        >
          {toast.title && <strong>{toast.title}</strong>}
          {toast.description && (
            <div style={{ marginTop: toast.title ? 4 : 0 }}>
              {toast.description}
            </div>
          )}
        </Alert>
      </Snackbar>
    </ToastContext.Provider>
  );
}
