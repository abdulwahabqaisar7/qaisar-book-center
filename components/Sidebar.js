"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import ThemeToggle from "./ThemeToggle";
import { useConfirm } from "@/components/ConfirmContext";
import { useToast } from "@/components/ToastContext";
import styles from "./Sidebar.module.css";

export default function Sidebar() {
  const pathname = usePathname();
  const confirm = useConfirm();
  const { showToast } = useToast();

  const navItems = [
    { name: "Dashboard", href: "/", icon: "📊" },
    { name: "Inventory", href: "/inventory", icon: "📦" },
    { name: "Customers", href: "/customers", icon: "👥" },
    { name: "New Invoice", href: "/invoice/new", icon: "✍️" },
    { name: "Invoice History", href: "/invoice", icon: "🧾" },
    { name: "Orders", href: "/orders", icon: "📋" },
    { name: "Reports", href: "/reports", icon: "📈" },
  ];

  const handleLogout = async () => {
    const isConfirmed = await confirm({
      title: "Logout Confirmation",
      message: "Are you sure you want to log out of Qaisar Book Center?",
      confirmLabel: "Logout",
      cancelLabel: "Cancel",
    });
    if (!isConfirmed) return;

    try {
      const res = await fetch("/api/auth/logout", {
        method: "POST",
      });
      if (res.ok) {
        window.location.href = "/login";
      } else {
        showToast("Logout failed.", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Error logging out.", "error");
    }
  };

  return (
    <aside className={`${styles.sidebar} no-print`}>
      <div className={styles.brand}>
        <span className={styles.brandTitle}>Qaisar Book Center</span>
        <span className={styles.brandSub}>Stationery & Billing</span>
      </div>

      <nav className={styles.nav}>
        {navItems.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`${styles.navLink} ${isActive ? styles.navLinkActive : ""}`}
            >
              <span className={styles.icon}>{item.icon}</span>
              <span>{item.name}</span>
            </Link>
          );
        })}
        
        <ThemeToggle />
        
        <button onClick={handleLogout} className={styles.logoutBtn}>
          <span className={styles.icon}>🚪</span>
          <span>Logout</span>
        </button>
      </nav>

      <div className={styles.footer}>
        <p>© 2026 Qaisar Book Center</p>
        <p style={{ marginTop: 4, opacity: 0.6 }}>v1.0.0 (MERN)</p>
      </div>
    </aside>
  );
}
