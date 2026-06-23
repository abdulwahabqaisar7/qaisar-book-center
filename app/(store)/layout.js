"use client";

import StoreNav from "@/components/StoreNav";
import { CartProvider } from "@/components/CartContext";
import styles from "./layout.module.css";

export default function StoreLayout({ children }) {
  return (
    <CartProvider>
      <div className={styles.storeContainer}>
        <StoreNav />
        <main className={styles.mainContent}>
          {children}
        </main>
      </div>
    </CartProvider>
  );
}
