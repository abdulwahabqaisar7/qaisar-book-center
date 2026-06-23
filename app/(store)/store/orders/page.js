"use client";

import { useState, useEffect } from "react";
import Link from "next/navigation";
import styles from "./page.module.css";

export default function CustomerOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchOrders() {
      try {
        const res = await fetch("/api/store/orders");
        const data = await res.json();
        if (data.success) {
          setOrders(data.data);
        } else {
          setError(data.error || "Failed to load orders.");
        }
      } catch (err) {
        console.error(err);
        setError("Error loading orders.");
      } finally {
        setLoading(false);
      }
    }
    fetchOrders();
  }, []);

  if (loading) {
    return <div className={styles.loading}>Loading order history...</div>;
  }

  return (
    <div className={`${styles.container} slide-up`}>
      <h1 className={styles.title}>My Web Orders</h1>

      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.panel}>
        {orders.length === 0 ? (
          <div className={styles.emptyState}>
            <span>📋</span>
            <p>You haven't placed any storefront orders yet.</p>
          </div>
        ) : (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Order No</th>
                  <th>Order Date</th>
                  <th>Total Amount</th>
                  <th>Preferred Payment</th>
                  <th>Order Status</th>
                  <th>Billing Receipt</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order._id}>
                    <td style={{ fontWeight: 700 }}>{order.orderNumber}</td>
                    <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                    <td style={{ fontWeight: 600 }}>Rs. {order.subtotal.toLocaleString()}</td>
                    <td>
                      <span className={styles.paymentBadge}>{order.preferredPayment}</span>
                    </td>
                    <td>
                      <span
                        className={
                          order.status === "confirmed"
                            ? styles.statusConfirmed
                            : order.status === "cancelled"
                            ? styles.statusCancelled
                            : styles.statusPending
                        }
                      >
                        {order.status}
                      </span>
                    </td>
                    <td>
                      {order.invoiceId ? (
                        <a
                          href={`/invoice/${order.invoiceId}`}
                          target="_blank"
                          rel="noreferrer"
                          className={styles.viewBillBtn}
                        >
                          📄 View Printable Bill
                        </a>
                      ) : order.status === "cancelled" ? (
                        <span className={styles.naNote}>Order Cancelled</span>
                      ) : (
                        <span className={styles.pendingNote}>Waiting for confirmation</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
