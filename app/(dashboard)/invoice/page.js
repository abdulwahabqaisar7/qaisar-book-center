"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import styles from "./page.module.css";

export default function InvoiceHistory() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("All Payments");

  useEffect(() => {
    async function fetchInvoices() {
      try {
        const res = await fetch("/api/invoices");
        const data = await res.json();
        if (data.success) {
          setInvoices(data.data);
        } else {
          setError(data.error);
        }
      } catch (err) {
        console.error(err);
        setError("Failed to load invoice history.");
      } finally {
        setLoading(false);
      }
    }
    fetchInvoices();
  }, []);

  const filteredInvoices = invoices.filter((inv) => {
    const matchesSearch =
      inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (inv.customerPhone && inv.customerPhone.includes(searchTerm));

    const matchesPayment =
      paymentFilter === "All Payments" || inv.paymentMethod === paymentFilter;

    return matchesSearch && matchesPayment;
  });

  const totalSales = filteredInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0);

  if (loading && invoices.length === 0) {
    return <div className={styles.loading}>Loading invoices...</div>;
  }

  return (
    <div className={`${styles.container} slide-up`}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.titleSection}>
          <h1 className={styles.title}>Invoice History</h1>
          <p className={styles.subtitle}>
            Browse past customer billing records. Total Sales in list:{" "}
            <strong style={{ color: "var(--accent)" }}>
              Rs. {totalSales.toLocaleString()}
            </strong>
          </p>
        </div>
        <div className={styles.headerActions}>
          <a href="/api/export/invoices" download>
            <button className={styles.exportButton}>📥 Export CSV</button>
          </a>
          <Link href="/invoice/new">
            <button className={styles.actionButton} style={{ padding: "10px 18px" }}>
              ✍️ New Invoice
            </button>
          </Link>
        </div>
      </div>

      {/* Filter bar */}
      <div className={styles.filterBar}>
        <input
          type="text"
          placeholder="Search by Invoice No, customer name or phone..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={styles.searchInput}
        />
        <select
          value={paymentFilter}
          onChange={(e) => setPaymentFilter(e.target.value)}
          className={styles.selectInput}
        >
          <option value="All Payments">All Payment Methods</option>
          <option value="Cash">Cash</option>
          <option value="Card">Card</option>
          <option value="Mobile Transfer">Mobile Transfer</option>
          <option value="On Credit">On Credit (Khata)</option>
        </select>
      </div>

      {/* Invoices List Panel */}
      <div className={styles.panel}>
        {error && <div className={styles.error} style={{ margin: 20 }}>{error}</div>}
        <div className={styles.tableWrapper}>
          {filteredInvoices.length === 0 ? (
            <p className={styles.noItems}>No invoices match your search.</p>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Invoice No</th>
                  <th>Customer Name</th>
                  <th>Contact</th>
                  <th>Items Count</th>
                  <th>Grand Total</th>
                  <th>Payment Type</th>
                  <th>Date</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredInvoices.map((inv) => (
                  <tr key={inv._id}>
                    <td>
                      <Link
                        href={`/invoice/${inv._id}`}
                        style={{ fontWeight: 700, color: "var(--accent)" }}
                      >
                        {inv.invoiceNumber}
                      </Link>
                    </td>
                    <td style={{ fontWeight: 500 }}>{inv.customerName}</td>
                    <td>{inv.customerPhone || "-"}</td>
                    <td>
                      {inv.items.length} items
                    </td>
                    <td style={{ fontWeight: 700 }}>
                      Rs. {inv.totalAmount.toLocaleString()}
                    </td>
                    <td>
                      <span className={styles.badge}>{inv.paymentMethod}</span>
                    </td>
                    <td>{new Date(inv.createdAt).toLocaleDateString()}</td>
                    <td>
                      <Link href={`/invoice/${inv._id}`}>
                        <button className={styles.actionButton}>📄 View / Print</button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
