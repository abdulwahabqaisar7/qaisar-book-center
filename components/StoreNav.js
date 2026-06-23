"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "./CartContext";
import styles from "./StoreNav.module.css";

export default function StoreNav() {
  const pathname = usePathname();
  const { cartCount } = useCart();

  const handleLogout = async () => {
    if (!confirm("Are you sure you want to log out?")) return;
    try {
      const res = await fetch("/api/auth/logout", { method: "POST" });
      if (res.ok) {
        window.location.href = "/login";
      } else {
        alert("Logout failed.");
      }
    } catch (err) {
      console.error(err);
      alert("Error logging out.");
    }
  };

  return (
    <header className={styles.navbar}>
      <div className={styles.navContainer}>
        <Link href="/store" className={styles.brand}>
          <span className={styles.brandIcon}>📚</span>
          <span className={styles.brandName}>QBC Storefront</span>
        </Link>

        <nav className={styles.links}>
          <Link
            href="/store"
            className={`${styles.link} ${pathname === "/store" ? styles.linkActive : ""}`}
          >
            Products
          </Link>
          <Link
            href="/store/cart"
            className={`${styles.link} ${pathname === "/store/cart" ? styles.linkActive : ""}`}
          >
            Cart
            {cartCount > 0 && <span className={styles.badge}>{cartCount}</span>}
          </Link>
          <Link
            href="/store/orders"
            className={`${styles.link} ${pathname === "/store/orders" ? styles.linkActive : ""}`}
          >
            My Orders
          </Link>
          <Link
            href="/store/account"
            className={`${styles.link} ${pathname === "/store/account" ? styles.linkActive : ""}`}
          >
            Khata Account
          </Link>
        </nav>

        <button onClick={handleLogout} className={styles.logoutBtn}>
          Logout
        </button>
      </div>
    </header>
  );
}
