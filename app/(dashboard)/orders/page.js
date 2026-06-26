"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useConfirm } from "@/components/ConfirmContext";
import { useToast } from "@/components/ToastContext";
import styles from "./page.module.css";

export default function AdminOrders() {
  const confirm = useConfirm();
  const { showToast } = useToast();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter
  const [statusFilter, setStatusFilter] = useState("all");

  // Modal State for Confirmation
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [discount, setDiscount] = useState("0");
  const [tax, setTax] = useState("0"); // GST %
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [actionError, setActionError] = useState(null);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  async function fetchOrders() {
    try {
      setLoading(true);
      const res = await fetch(`/api/orders?status=${statusFilter}`);
      const data = await res.json();
      if (data.success) {
        setOrders(data.data);
      } else {
        setError(data.error);
      }
    } catch (err) {
      console.error(err);
      setError("Failed to fetch storefront orders.");
    } finally {
      setLoading(false);
    }
  }

  const handleCancel = async (id, orderNumber) => {
    const isConfirmed = await confirm({
      title: "Cancel Order",
      message: `Are you sure you want to cancel order ${orderNumber}?`,
      confirmLabel: "Cancel Order",
      cancelLabel: "Keep Order",
    });
    if (!isConfirmed) return;

    try {
      const res = await fetch(`/api/orders/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "cancelled" }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Order ${orderNumber} cancelled successfully.`, "success");
        fetchOrders();
      } else {
        showToast(data.error || "Failed to cancel order.", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Error cancelling order.", "error");
    }
  };

  const openConfirmModal = (order) => {
    setSelectedOrder(order);
    setDiscount("0");
    setTax("0");
    setPaymentMethod(order.preferredPayment || "Cash");
    setActionError(null);
    setIsConfirmModalOpen(true);
  };

  const handleConfirmSubmit = async (e) => {
    e.preventDefault();
    setActionError(null);
    setConfirming(true);

    const discountVal = parseFloat(discount);
    const taxVal = parseFloat(tax);

    if (isNaN(discountVal) || discountVal < 0) {
      setActionError("Please enter a valid discount amount.");
      setConfirming(false);
      return;
    }
    if (isNaN(taxVal) || taxVal < 0 || taxVal > 100) {
      setActionError("Please enter a valid GST percentage (0-100).");
      setConfirming(false);
      return;
    }

    try {
      const res = await fetch(`/api/orders/${selectedOrder._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "confirmed",
          discount: discountVal,
          tax: taxVal,
          paymentMethod,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setIsConfirmModalOpen(false);
        showToast("Order confirmed and invoice generated successfully!", "success");
        fetchOrders();
      } else {
        setActionError(data.error || "Failed to confirm order.");
      }
    } catch (err) {
      console.error(err);
      setActionError("Network error. Please try again.");
    } finally {
      setConfirming(false);
    }
  };

  return (
    <div className={`${styles.container} slide-up`}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.titleSection}>
          <h1 className={styles.title}>Storefront Web Orders</h1>
          <p className={styles.subtitle}>Review, reject, or confirm customer storefront orders.</p>
        </div>
      </div>

      {/* Filter tab selectors */}
      <div className={styles.filterBar}>
        <div className={styles.filterTabs}>
          {["all", "pending", "confirmed", "cancelled"].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`${styles.tabBtn} ${statusFilter === status ? styles.tabBtnActive : ""}`}
            >
              {status.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Orders ledger list panel */}
      <div className={styles.panel}>
        {error && <div className={styles.error}>{error}</div>}
        {loading && orders.length === 0 ? (
          <div className={styles.loading}>Loading orders list...</div>
        ) : (
          <div className={styles.tableWrapper}>
            {orders.length === 0 ? (
              <p className={styles.noItems}>No orders in this selection.</p>
            ) : (
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Order No</th>
                    <th>Customer Name</th>
                    <th>Contact Phone</th>
                    <th>Items</th>
                    <th>Subtotal Amount</th>
                    <th>Date Placed</th>
                    <th>Status</th>
                    <th>Billing Action</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o) => (
                    <tr key={o._id}>
                      <td style={{ fontWeight: 700 }}>{o.orderNumber}</td>
                      <td style={{ fontWeight: 600 }}>{o.customerId?.name || "Deleted Customer"}</td>
                      <td>{o.customerId?.phone || "-"}</td>
                      <td>
                        {o.items.length} items
                      </td>
                      <td style={{ fontWeight: 700 }}>
                        Rs. {o.subtotal.toLocaleString()}
                      </td>
                      <td>{new Date(o.createdAt).toLocaleDateString()}</td>
                      <td>
                        <span
                          className={
                            o.status === "confirmed"
                              ? styles.badgeConfirmed
                              : o.status === "cancelled"
                              ? styles.badgeCancelled
                              : styles.badgePending
                          }
                        >
                          {o.status}
                        </span>
                      </td>
                      <td>
                        {o.status === "pending" ? (
                          <div className={styles.actionGroup}>
                            <button
                              onClick={() => openConfirmModal(o)}
                              className={styles.confirmBtn}
                            >
                              ✓ Confirm
                            </button>
                            <button
                              onClick={() => handleCancel(o._id, o.orderNumber)}
                              className={styles.cancelBtn}
                            >
                              ✕ Cancel
                            </button>
                          </div>
                        ) : o.invoiceId ? (
                          <Link href={`/invoice/${o.invoiceId}`} target="_blank">
                            <button className={styles.viewBillBtn}>📄 View Invoice</button>
                          </Link>
                        ) : (
                          <span className={styles.naText}>N/A</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {/* CONFIRM / CONVERT TO INVOICE MODAL */}
      {isConfirmModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalCard}>
            <div className={styles.modalHeader}>
              <h2>Confirm Order & Billing Details</h2>
              <button onClick={() => setIsConfirmModalOpen(false)} className={styles.closeBtn}>
                ✕
              </button>
            </div>
            <form onSubmit={handleConfirmSubmit} className={styles.modalForm}>
              {actionError && <div className={styles.formError}>{actionError}</div>}

              <div className={styles.orderMetaPanel}>
                <p>Order: <strong>{selectedOrder?.orderNumber}</strong></p>
                <p>Customer: <strong>{selectedOrder?.customerId?.name}</strong></p>
                <p>Subtotal: <strong>Rs. {selectedOrder?.subtotal.toLocaleString()}</strong></p>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Adjust Discount (Rs. Flat)</label>
                <input
                  type="number"
                  min="0"
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value)}
                  placeholder="Enter flat discount Rs."
                  className={styles.input}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Adjust Sales Tax (GST %)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={tax}
                  onChange={(e) => setTax(e.target.value)}
                  placeholder="Enter tax percentage"
                  className={styles.input}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Confirm Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className={styles.selectInput}
                >
                  <option value="Cash">Cash</option>
                  <option value="Card">Credit/Debit Card</option>
                  <option value="Mobile Transfer">Mobile Transfer (EasyPaisa/JazzCash)</option>
                  <option value="On Credit">On Credit (Khata Ledger)</option>
                </select>
              </div>

              <div className={styles.modalActions}>
                <button
                  type="button"
                  onClick={() => setIsConfirmModalOpen(false)}
                  className={styles.modalCancelBtn}
                >
                  Cancel
                </button>
                <button type="submit" disabled={confirming} className={styles.modalSubmitBtn}>
                  {confirming ? "Processing..." : "💾 Confirm Order & Create Bill"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
