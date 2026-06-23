"use client";

import { useEffect } from "react";
import styles from "./Toast.module.css";

function ToastItem({ toast, onRemove }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onRemove(toast.id);
    }, 4000);
    return () => clearTimeout(timer);
  }, [toast.id, onRemove]);

  const icons = {
    success: "✅",
    error: "❌",
    warning: "⚠️",
    info: "ℹ️",
  };

  return (
    <div className={`${styles.toast} ${styles[toast.type] || styles.info}`}>
      <span className={styles.icon}>{icons[toast.type] || "ℹ️"}</span>
      <span className={styles.message}>{toast.message}</span>
      <button className={styles.closeBtn} onClick={() => onRemove(toast.id)} aria-label="Close notification">
        ✕
      </button>
    </div>
  );
}

export default function ToastContainer({ toasts, onRemove }) {
  return (
    <div className={styles.container}>
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  );
}
