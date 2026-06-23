"use client";

import { ToastProvider } from "./ToastContext";
import { ConfirmProvider } from "./ConfirmContext";
import { useEffect } from "react";

export default function Providers({ children }) {
  useEffect(() => {
    // Apply theme from localStorage on mount
    const savedTheme = localStorage.getItem("theme");
    const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const initialTheme = savedTheme || (systemPrefersDark ? "dark" : "light");
    document.documentElement.setAttribute("data-theme", initialTheme);
  }, []);

  return (
    <ToastProvider>
      <ConfirmProvider>
        {children}
      </ConfirmProvider>
    </ToastProvider>
  );
}
