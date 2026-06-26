"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import styles from "./page.module.css";

export default function PurchaseHistory() {
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("All Payments");

  // Modal
  const [selectedPurchase, setSelectedPurchase] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    async function fetchPurchases() {
      try {
        const res = await fetch("/api/purchases");
        const data = await res.json();
        if (data.success) {
          setPurchases(data.data);
        } else {
          setError(data.error);
        }
      } catch (err) {
        console.error(err);
        setError("Failed to load purchase history.");
      } finally {
        setLoading(false);
      }
    }
    fetchPurchases();
  }, []);

  const filteredPurchases = purchases.filter((pur) => {
    const matchesSearch =
      pur.purchaseNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (pur.notes && pur.notes.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesPayment =
      paymentFilter === "All Payments" || pur.paymentMethod === paymentFilter;

    return matchesSearch && matchesPayment;
  });

  const totalSpent = filteredPurchases.reduce((sum, pur) => sum + pur.totalAmount, 0);

  const openDetailsModal = (purchase) => {
    setSelectedPurchase(purchase);
    setIsModalOpen(true);
  };

  const closeDetailsModal = () => {
    setSelectedPurchase(null);
    setIsModalOpen(false);
  };

  if (loading && purchases.length === 0) {
    return <div className={styles.loading}>Loading purchase history...</div>;
  }

  return (
    <div className={`${styles.container} slide-up`}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.titleSection}>
          <h1 className={styles.title}>Purchase Invoices</h1>
          <p className={styles.subtitle}>
            Manage incoming inventory purchases. Total spent in list:{" "}
            <strong style={{ color: "var(--danger)" }}>
              Rs. {totalSpent.toLocaleString()}
            </strong>
          </p>
        </div>
        <div className={styles.headerActions}>
          <Link href="/purchases/new">
            <button className={styles.addButton}>
              <span>🛒</span> New Purchase Invoice
            </button>
          </Link>
        </div>
      </div>

      {/* Filter bar */}
      <div className={styles.filterBar}>
        <input
          type="text"
          placeholder="Search by Purchase Invoice No or notes..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={styles.searchInput}
          style={{ flex: 2 }}
        />
        <select
          value={paymentFilter}
          onChange={(e) => setPaymentFilter(e.target.value)}
          className={styles.selectInput}
          style={{ flex: 1 }}
        >
          <option value="All Payments">All Payment Methods</option>
          <option value="Cash">Cash</option>
          <option value="Mobile Transfer">Mobile Transfer</option>
          <option value="On Credit">On Credit</option>
        </select>
      </div>

      {/* Purchases List Panel */}
      <div className={styles.panel}>
        {error && <div className={styles.error} style={{ margin: 20 }}>{error}</div>}
        <div className={styles.tableWrapper}>
          {filteredPurchases.length === 0 ? (
            <p className={styles.noItems}>No purchase invoices match your search.</p>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Purchase No</th>
                  <th>Items Count</th>
                  <th>Grand Total</th>
                  <th>Payment Type</th>
                  <th>Date</th>
                  <th>Notes</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredPurchases.map((pur) => (
                  <tr key={pur._id}>
                    <td style={{ fontWeight: 700, color: "var(--accent)" }}>
                      {pur.purchaseNumber}
                    </td>
                    <td>{pur.items.length} items</td>
                    <td style={{ fontWeight: 700 }}>
                      Rs. {pur.totalAmount.toLocaleString()}
                    </td>
                    <td>
                      <span className={`${styles.badge} ${pur.paymentMethod === 'Cash' ? styles.badgeCash : styles.badgeMobile}`}>
                        {pur.paymentMethod}
                      </span>
                    </td>
                    <td>{new Date(pur.createdAt).toLocaleDateString()}</td>
                    <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {pur.notes || "-"}
                    </td>
                    <td>
                      <button 
                        onClick={() => openDetailsModal(pur)} 
                        className={styles.actionButton}
                      >
                        📄 View Items
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Purchase Details Modal */}
      {isModalOpen && selectedPurchase && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Purchase Details - {selectedPurchase.purchaseNumber}</h3>
              <button onClick={closeDetailsModal} className={styles.closeButton}>✕</button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.modalInfoGrid}>
                <div>
                  <strong>Date:</strong> {new Date(selectedPurchase.createdAt).toLocaleString()}
                </div>
                <div>
                  <strong>Payment Method:</strong> {selectedPurchase.paymentMethod}
                </div>
              </div>

              {selectedPurchase.notes && (
                <div className={styles.modalNotes}>
                  <strong>Notes:</strong> {selectedPurchase.notes}
                </div>
              )}

              <table className={styles.modalTable}>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Cost Price</th>
                    <th>Qty</th>
                    <th>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedPurchase.items.map((item, idx) => (
                    <tr key={idx}>
                      <td>{item.name}</td>
                      <td>Rs. {item.costPrice.toLocaleString()}</td>
                      <td>{item.quantity}</td>
                      <td style={{ fontWeight: 600 }}>Rs. {item.subtotal.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className={styles.modalSummary}>
                <div className={styles.modalSummaryRow}>
                  <span>Subtotal:</span>
                  <span>Rs. {selectedPurchase.subtotal.toLocaleString()}</span>
                </div>
                {selectedPurchase.discount > 0 && (
                  <div className={styles.modalSummaryRow} style={{ color: 'var(--danger)' }}>
                    <span>Discount:</span>
                    <span>- Rs. {selectedPurchase.discount.toLocaleString()}</span>
                  </div>
                )}
                {selectedPurchase.tax > 0 && (
                  <div className={styles.modalSummaryRow}>
                    <span>Tax ({selectedPurchase.tax}%):</span>
                    <span>+ Rs. {Math.round((selectedPurchase.subtotal - selectedPurchase.discount) * (selectedPurchase.tax / 100)).toLocaleString()}</span>
                  </div>
                )}
                <div className={styles.modalSummaryTotal}>
                  <span>Grand Total:</span>
                  <span>Rs. {selectedPurchase.totalAmount.toLocaleString()}</span>
                </div>
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button onClick={closeDetailsModal} className={styles.cancelButton}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
