"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useToast } from "@/components/ToastContext";
import styles from "./page.module.css";

export default function CashLedger() {
  const { showToast } = useToast();
  const [cashData, setCashData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");

  // Modal State for Manual Adjustment
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [adjAmount, setAdjAmount] = useState("");
  const [adjType, setAdjType] = useState("adjustment_in"); // "adjustment_in" | "adjustment_out"
  const [adjDescription, setAdjDescription] = useState("");
  const [savingAdj, setSavingAdj] = useState(false);
  const [modalError, setModalError] = useState(null);

  useEffect(() => {
    fetchCashLedger();
  }, []);

  async function fetchCashLedger() {
    try {
      setLoading(true);
      const res = await fetch("/api/cash");
      const data = await res.json();
      if (data.success) {
        setCashData(data.data);
      } else {
        setError(data.error);
      }
    } catch (err) {
      console.error(err);
      setError("Failed to fetch cash ledger data.");
    } finally {
      setLoading(false);
    }
  }

  const handleOpenModal = () => {
    setAdjAmount("");
    setAdjType("adjustment_in");
    setAdjDescription("");
    setModalError(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleSaveAdjustment = async (e) => {
    e.preventDefault();
    setSavingAdj(true);
    setModalError(null);

    const amount = parseFloat(adjAmount);
    if (isNaN(amount) || amount <= 0) {
      setModalError("Please enter a valid positive amount.");
      setSavingAdj(false);
      return;
    }

    if (!adjDescription.trim()) {
      setModalError("Please enter a description/reason.");
      setSavingAdj(false);
      return;
    }

    try {
      const res = await fetch("/api/cash", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount,
          type: adjType,
          description: adjDescription
        })
      });

      const data = await res.json();
      if (data.success) {
        showToast("Cash adjustment recorded successfully!", "success");
        setIsModalOpen(false);
        fetchCashLedger(); // Refresh
      } else {
        setModalError(data.error);
      }
    } catch (err) {
      console.error(err);
      setModalError("Failed to record cash adjustment.");
    } finally {
      setSavingAdj(false);
    }
  };

  if (loading && !cashData) {
    return <div className={styles.loading}>Loading cash ledger...</div>;
  }

  const { availableCash = 0, totalInflow = 0, totalOutflow = 0, transactions = [] } = cashData || {};

  // Filter computations
  const filteredTransactions = transactions.filter(tx => {
    const matchesSearch = tx.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    let matchesType = true;
    if (typeFilter !== "All") {
      if (typeFilter === "Inflows") {
        matchesType = tx.amount > 0;
      } else if (typeFilter === "Outflows") {
        matchesType = tx.amount < 0;
      } else if (typeFilter === "Sales") {
        matchesType = tx.type === "sale";
      } else if (typeFilter === "Purchases") {
        matchesType = tx.type === "purchase";
      } else if (typeFilter === "Customer Payments") {
        matchesType = tx.type === "customer_payment";
      } else if (typeFilter === "Adjustments") {
        matchesType = tx.type.startsWith("adjustment");
      }
    }

    return matchesSearch && matchesType;
  });

  const getBadgeClass = (type) => {
    switch (type) {
      case "sale":
        return styles.badgeSale;
      case "purchase":
        return styles.badgePurchase;
      case "customer_payment":
        return styles.badgePayment;
      case "adjustment_in":
        return styles.badgeAdjIn;
      case "adjustment_out":
        return styles.badgeAdjOut;
      default:
        return styles.badgeDefault;
    }
  };

  const getFriendlyType = (type) => {
    switch (type) {
      case "sale":
        return "Sale Invoice";
      case "purchase":
        return "Purchase Invoice";
      case "customer_payment":
        return "Customer Payment";
      case "adjustment_in":
        return "Cash Deposit";
      case "adjustment_out":
        return "Cash Withdrawal";
      default:
        return type;
    }
  };

  return (
    <div className={`${styles.container} slide-up`}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.titleSection}>
          <h1 className={styles.title}>Cash Ledger</h1>
          <p className={styles.subtitle}>Track available cash in hand, inflows, and expense outflows.</p>
        </div>
        <div className={styles.headerActions}>
          <button onClick={handleOpenModal} className={styles.adjustButton}>
            <span>💸</span> Record Cash Adjustment
          </button>
        </div>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      {/* Cash Overview Grid */}
      <div className={styles.overviewGrid}>
        {/* Main Cash in Hand Card */}
        <div className={`${styles.card} ${styles.mainCard}`}>
          <div className={styles.cardHeader}>
            <span className={styles.cardLabel}>Available Cash in Hand</span>
            <span className={styles.cardIcon}>💵</span>
          </div>
          <span className={styles.cardVal}>Rs. {availableCash.toLocaleString()}</span>
          <span className={styles.cardSub}>Net liquid funds physically in drawer</span>
        </div>

        {/* Total Inflow Card */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <span className={styles.cardLabel}>Total Income (Inflow)</span>
            <span className={styles.cardIcon} style={{ backgroundColor: "rgba(16, 185, 129, 0.1)", color: "#10b981" }}>📈</span>
          </div>
          <span className={styles.cardVal} style={{ color: "#10b981" }}>Rs. {totalInflow.toLocaleString()}</span>
          <span className={styles.cardSub}>Sales & customer payments collected</span>
        </div>

        {/* Total Outflow Card */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <span className={styles.cardLabel}>Total Expenses (Outflow)</span>
            <span className={styles.cardIcon} style={{ backgroundColor: "rgba(239, 68, 68, 0.1)", color: "#ef4444" }}>📉</span>
          </div>
          <span className={styles.cardVal} style={{ color: "#ef4444" }}>Rs. {totalOutflow.toLocaleString()}</span>
          <span className={styles.cardSub}>Purchases & manual withdrawals</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className={styles.filterBar}>
        <input
          type="text"
          placeholder="Search ledger by details or invoice numbers..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={styles.searchInput}
          style={{ flex: 2 }}
        />
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className={styles.selectInput}
          style={{ flex: 1 }}
        >
          <option value="All">All Transactions</option>
          <option value="Inflows">All Inflows (+)</option>
          <option value="Outflows">All Outflows (-)</option>
          <option value="Sales">Sales Only</option>
          <option value="Purchases">Purchases Only</option>
          <option value="Customer Payments">Customer Credit Payments</option>
          <option value="Adjustments">Manual Adjustments</option>
        </select>
      </div>

      {/* Transactions Table */}
      <div className={styles.panel}>
        <div className={styles.tableWrapper}>
          {filteredTransactions.length === 0 ? (
            <p className={styles.noItems}>No cash ledger records found.</p>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Date & Time</th>
                  <th>Transaction Type</th>
                  <th>Description</th>
                  <th>Amount</th>
                  <th>Reference</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map((tx) => (
                  <tr key={tx._id}>
                    <td style={{ color: "var(--text-secondary)" }}>
                      {new Date(tx.date).toLocaleString()}
                    </td>
                    <td>
                      <span className={`${styles.badge} ${getBadgeClass(tx.type)}`}>
                        {getFriendlyType(tx.type)}
                      </span>
                    </td>
                    <td style={{ fontWeight: 500 }}>{tx.description}</td>
                    <td style={{ fontWeight: 700, color: tx.amount > 0 ? "var(--success)" : "var(--danger)" }}>
                      {tx.amount > 0 ? "+" : ""} Rs. {tx.amount.toLocaleString()}
                    </td>
                    <td>
                      {tx.referenceId ? (
                        tx.referenceModel === "Invoice" ? (
                          <Link 
                            href={`/invoice/${tx.referenceId}`}
                            style={{ color: "var(--accent)", fontWeight: 600 }}
                          >
                            View Invoice
                          </Link>
                        ) : tx.referenceModel === "Customer" ? (
                          <Link 
                            href={`/customers`}
                            style={{ color: "var(--accent)", fontWeight: 600 }}
                          >
                            View Customer
                          </Link>
                        ) : (
                          <span style={{ fontSize: '0.85rem', opacity: 0.6 }}>Purchase Ref</span>
                        )
                      ) : (
                        <span style={{ fontSize: '0.85rem', opacity: 0.4 }}>Direct Entry</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Manual Cash Adjustment Modal */}
      {isModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Record Cash Adjustment</h3>
              <button onClick={handleCloseModal} className={styles.closeButton}>✕</button>
            </div>
            <form onSubmit={handleSaveAdjustment}>
              <div className={styles.modalBody}>
                {modalError && <div className={styles.modalErrorMsg}>{modalError}</div>}

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Adjustment Type *</label>
                  <div className={styles.radioGroup}>
                    <label className={`${styles.radioLabel} ${adjType === 'adjustment_in' ? styles.radioLabelActiveIn : ''}`}>
                      <input 
                        type="radio" 
                        name="adjType" 
                        value="adjustment_in"
                        checked={adjType === 'adjustment_in'}
                        onChange={() => setAdjType('adjustment_in')}
                      />
                      💵 Cash In (Deposit / Capital)
                    </label>
                    <label className={`${styles.radioLabel} ${adjType === 'adjustment_out' ? styles.radioLabelActiveOut : ''}`}>
                      <input 
                        type="radio" 
                        name="adjType" 
                        value="adjustment_out"
                        checked={adjType === 'adjustment_out'}
                        onChange={() => setAdjType('adjustment_out')}
                      />
                      💸 Cash Out (Expense / Withdrawal)
                    </label>
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Amount (Rs.) *</label>
                  <input
                    type="number"
                    min="1"
                    placeholder="e.g. 500"
                    value={adjAmount}
                    onChange={(e) => setAdjAmount(e.target.value)}
                    className={styles.formInput}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Description / Reason *</label>
                  <input
                    type="text"
                    placeholder="e.g. Rent Payment, Utility Bill, Owner Deposit, Daily Tea"
                    value={adjDescription}
                    onChange={(e) => setAdjDescription(e.target.value)}
                    className={styles.formInput}
                    required
                  />
                </div>
              </div>
              <div className={styles.modalFooter}>
                <button type="button" onClick={handleCloseModal} className={styles.cancelButton}>
                  Cancel
                </button>
                <button type="submit" disabled={savingAdj} className={styles.submitButton}>
                  {savingAdj ? "Saving..." : "Record Adjustment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
