"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import styles from "./page.module.css";

export default function Dashboard() {
  const [products, setProducts] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [cashInHand, setCashInHand] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const [prodRes, invRes, cashRes] = await Promise.all([
          fetch("/api/products"),
          fetch("/api/invoices"),
          fetch("/api/cash"),
        ]);

        const prodData = await prodRes.json();
        const invData = await invRes.json();
        const cashData = await cashRes.json();

        if (prodData.success) setProducts(prodData.data);
        if (invData.success) setInvoices(invData.data);
        if (cashData.success) setCashInHand(cashData.data.availableCash);
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
        setError("Failed to load dashboard data. Please try again.");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return <div className={styles.loading}>Loading Dashboard...</div>;
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.panel} style={{ color: "var(--danger)" }}>
          <h3>Error</h3>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  // Calculate Metrics
  const activeProductsCount = products.length;
  
  const lowStockItems = products.filter(
    (product) => product.stock <= product.minStock
  );
  const lowStockCount = lowStockItems.length;

  // Total Sales today
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  
  const salesToday = invoices
    .filter((inv) => new Date(inv.createdAt) >= todayStart)
    .reduce((sum, inv) => sum + inv.totalAmount, 0);

  const totalInvoicesCount = invoices.length;

  // Total Inventory Value (sum of stock * costPrice for all products)
  const totalInventoryValue = products.reduce(
    (sum, product) => sum + (product.stock * (product.costPrice || 0)), 0
  );

  // Format currency
  const formatCurrency = (amount) => {
    return `Rs. ${amount.toLocaleString("en-PK")}`;
  };

  return (
    <div className={`${styles.container} slide-up`}>
      {/* Header */}
      <div className={styles.header}>
        <h1 className={styles.title}>Dashboard</h1>
        <p className={styles.subtitle}>
          Welcome back to Qaisar Book Center's management panel.
        </p>
      </div>

      {/* Quick Actions */}
      <div className={styles.actionsSection}>
        <Link href="/invoice/new">
          <button className={`${styles.actionButton} ${styles.actionPrimary}`}>
            <span>✍️</span> Create New Invoice
          </button>
        </Link>
        <Link href="/inventory">
          <button className={`${styles.actionButton} ${styles.actionSecondary}`}>
            <span>📦</span> Manage Inventory
          </button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <span className={styles.statLabel}>Sales Today</span>
            <span className={styles.statIcon} style={{ backgroundColor: "var(--success-light)", color: "var(--success)" }}>📈</span>
          </div>
          <span className={styles.statValue}>{formatCurrency(salesToday)}</span>
          <span className={styles.statSubtext}>Based on invoices created today</span>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <span className={styles.statLabel}>Cash in Hand</span>
            <span className={styles.statIcon} style={{ backgroundColor: "rgba(16, 185, 129, 0.1)", color: "#10b981" }}>💵</span>
          </div>
          <span className={styles.statValue}>{formatCurrency(cashInHand)}</span>
          <span className={styles.statSubtext}>Available liquid cash in drawer</span>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <span className={styles.statLabel}>Active Inventory</span>
            <span className={styles.statIcon} style={{ backgroundColor: "var(--accent-light)", color: "var(--accent)" }}>📦</span>
          </div>
          <span className={styles.statValue}>{activeProductsCount}</span>
          <span className={styles.statSubtext}>Unique stationery & book items</span>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <span className={styles.statLabel}>Low Stock Items</span>
            <span className={styles.statIcon} style={{ backgroundColor: lowStockCount > 0 ? "var(--danger-light)" : "var(--success-light)", color: lowStockCount > 0 ? "var(--danger)" : "var(--success)" }}>⚠️</span>
          </div>
          <span className={styles.statValue}>{lowStockCount}</span>
          <span className={styles.statSubtext}>Needs replenishment soon</span>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <span className={styles.statLabel}>Total Invoices</span>
            <span className={styles.statIcon} style={{ backgroundColor: "var(--warning-light)", color: "var(--warning)" }}>🧾</span>
          </div>
          <span className={styles.statValue}>{totalInvoicesCount}</span>
          <span className={styles.statSubtext}>All time bills generated</span>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statHeader}>
            <span className={styles.statLabel}>Inventory Value</span>
            <span className={styles.statIcon} style={{ backgroundColor: "rgba(16, 185, 129, 0.1)", color: "#10b981" }}>💰</span>
          </div>
          <span className={styles.statValue}>{formatCurrency(totalInventoryValue)}</span>
          <span className={styles.statSubtext}>Total capital in stock (qty × cost)</span>
        </div>
      </div>

      {/* Two Column Section */}
      <div className={styles.gridTwoCol}>
        {/* Recent Invoices */}
        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <h2 className={styles.panelTitle}>Recent Invoices</h2>
            <Link href="/invoice" className={styles.viewAllLink}>
              View All
            </Link>
          </div>
          <div className={styles.tableWrapper}>
            {invoices.length === 0 ? (
              <p className={styles.noAlerts}>No invoices created yet.</p>
            ) : (
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Invoice No</th>
                    <th>Customer</th>
                    <th>Date</th>
                    <th>Total</th>
                    <th>Payment</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.slice(0, 5).map((inv) => (
                    <tr key={inv._id}>
                      <td>
                        <Link href={`/invoice/${inv._id}`} style={{ fontWeight: 600, color: "var(--accent)" }}>
                          {inv.invoiceNumber}
                        </Link>
                      </td>
                      <td>{inv.customerName}</td>
                      <td>{new Date(inv.createdAt).toLocaleDateString()}</td>
                      <td style={{ fontWeight: 600 }}>{formatCurrency(inv.totalAmount)}</td>
                      <td>
                        <span className={`${styles.badge} ${styles.badgeSuccess}`}>
                          {inv.paymentMethod}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <h2 className={styles.panelTitle}>Stock Alerts</h2>
            <Link href="/inventory" className={styles.viewAllLink}>
              Manage
            </Link>
          </div>
          <div className={styles.alertList}>
            {lowStockItems.length === 0 ? (
              <p className={styles.noAlerts}>✅ All items have healthy stock levels.</p>
            ) : (
              lowStockItems.slice(0, 6).map((item) => (
                <div
                  key={item._id}
                  className={`${styles.alertItem} ${item.stock === 0 ? "" : styles.alertItemWarning}`}
                >
                  <div className={styles.alertInfo}>
                    <span className={styles.alertName}>{item.name}</span>
                    <span className={styles.alertStock}>SKU: {item.sku}</span>
                  </div>
                  <span className={`${styles.badge} ${item.stock === 0 ? styles.badgeDanger : styles.badgeWarning}`}>
                    {item.stock === 0 ? "Out of Stock" : `${item.stock} left`}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
