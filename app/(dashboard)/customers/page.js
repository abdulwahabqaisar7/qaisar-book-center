"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useConfirm } from "@/components/ConfirmContext";
import { useToast } from "@/components/ToastContext";
import styles from "./page.module.css";

export default function Customers() {
  const confirm = useConfirm();
  const { showToast } = useToast();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Search
  const [searchTerm, setSearchTerm] = useState("");

  // Modals state
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [customerModalMode, setCustomerModalMode] = useState("add"); // "add" | "edit"
  const [currentCustomerId, setCurrentCustomerId] = useState(null);

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState("");

  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [historyInvoices, setHistoryInvoices] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    address: "",
    notes: "",
  });
  const [formError, setFormError] = useState(null);

  useEffect(() => {
    fetchCustomers();
  }, []);

  async function fetchCustomers() {
    try {
      setLoading(true);
      const res = await fetch("/api/customers");
      const data = await res.json();
      if (data.success) {
        setCustomers(data.data);
      } else {
        setError(data.error);
      }
    } catch (err) {
      console.error(err);
      setError("Failed to fetch customers.");
    } finally {
      setLoading(false);
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const openAddModal = () => {
    setCustomerModalMode("add");
    setFormData({
      name: "",
      phone: "",
      address: "",
      notes: "",
    });
    setFormError(null);
    setIsCustomerModalOpen(true);
  };

  const openEditModal = (customer) => {
    setCustomerModalMode("edit");
    setCurrentCustomerId(customer._id);
    setFormData({
      name: customer.name,
      phone: customer.phone || "",
      address: customer.address || "",
      notes: customer.notes || "",
    });
    setFormError(null);
    setIsCustomerModalOpen(true);
  };

  const openPaymentModal = (customer) => {
    setSelectedCustomer(customer);
    setPaymentAmount("");
    setIsPaymentModalOpen(true);
  };

  const openHistoryModal = async (customer) => {
    setSelectedCustomer(customer);
    setIsHistoryModalOpen(true);
    setHistoryLoading(true);
    try {
      const res = await fetch(`/api/customers/${customer._id}`);
      const data = await res.json();
      if (data.success) {
        setHistoryInvoices(data.data.invoices || []);
      } else {
        showToast(data.error || "Failed to load history.", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Error loading customer history.", "error");
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleDelete = async (id, name) => {
    const isConfirmed = await confirm({
      title: "Delete Customer",
      message: `Are you sure you want to delete customer "${name}"? This cannot be undone.`,
      confirmLabel: "Delete",
      cancelLabel: "Cancel",
    });
    if (!isConfirmed) return;
    try {
      const res = await fetch(`/api/customers/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        setCustomers((prev) => prev.filter((c) => c._id !== id));
        showToast(`Customer "${name}" deleted successfully.`, "success");
      } else {
        showToast(data.error || "Failed to delete customer.", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("An error occurred while deleting.", "error");
    }
  };

  const handleCustomerSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.name.trim()) {
      setFormError("Customer Name is required.");
      return;
    }

    try {
      const url =
        customerModalMode === "add"
          ? "/api/customers"
          : `/api/customers/${currentCustomerId}`;
      const method = customerModalMode === "add" ? "POST" : "PUT";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (data.success) {
        setIsCustomerModalOpen(false);
        showToast(
          customerModalMode === "add"
            ? `Customer "${formData.name}" created successfully!`
            : `Customer "${formData.name}" details updated!`,
          "success"
        );
        fetchCustomers();
      } else {
        setFormError(data.error);
      }
    } catch (err) {
      console.error(err);
      setFormError("An error occurred. Please try again.");
    }
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      showToast("Please enter a valid payment amount.", "warning");
      return;
    }

    try {
      const res = await fetch(`/api/customers/${selectedCustomer._id}/payment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount }),
      });
      const data = await res.json();
      if (data.success) {
        setIsPaymentModalOpen(false);
        fetchCustomers();
        showToast("Payment recorded successfully!", "success");
      } else {
        showToast(data.error || "Failed to record payment.", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Error recording payment.", "error");
    }
  };

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.phone && c.phone.includes(searchTerm))
  );

  return (
    <div className={`${styles.container} slide-up`}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.titleSection}>
          <h1 className={styles.title}>Customers & Khata Ledger</h1>
          <p className={styles.subtitle}>Manage customer credits and khata balance history.</p>
        </div>
        <button onClick={openAddModal} className={styles.actionButton}>
          ➕ Add Customer
        </button>
      </div>

      {/* Search */}
      <div className={styles.filterBar}>
        <input
          type="text"
          placeholder="Search customers by name or contact number..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={styles.searchInput}
        />
      </div>

      {/* Main Customers List Panel */}
      <div className={styles.panel}>
        {error && <div className={styles.error}>{error}</div>}
        {loading && customers.length === 0 ? (
          <div className={styles.loading}>Loading customers ledger...</div>
        ) : (
          <div className={styles.tableWrapper}>
            {filteredCustomers.length === 0 ? (
              <p className={styles.noItems}>No customers found.</p>
            ) : (
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Customer Name</th>
                    <th>Contact Phone</th>
                    <th>Address</th>
                    <th>Total Purchases</th>
                    <th>Khata Balance (Credit)</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCustomers.map((c) => {
                    const hasCredit = c.creditBalance > 0;
                    return (
                      <tr key={c._id}>
                        <td style={{ fontWeight: 700 }}>{c.name}</td>
                        <td>{c.phone || "-"}</td>
                        <td>{c.address || "-"}</td>
                        <td style={{ fontWeight: 600 }}>
                          Rs. {c.totalPurchases.toLocaleString()}
                        </td>
                        <td
                          className={hasCredit ? styles.creditBalanceText : styles.clearBalanceText}
                        >
                          Rs. {c.creditBalance.toLocaleString()}
                        </td>
                        <td>
                          <div className={styles.rowActions}>
                            <button onClick={() => openHistoryModal(c)} className={styles.rowButton}>
                              🧾 Ledger
                            </button>
                            <button onClick={() => openPaymentModal(c)} className={styles.rowButtonPayment}>
                              💸 Record Payment
                            </button>
                            <button onClick={() => openEditModal(c)} className={styles.rowButtonEdit}>
                              ✏️ Edit
                            </button>
                            <button onClick={() => handleDelete(c._id, c.name)} className={styles.rowButtonDelete}>
                              🗑️ Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {/* ADD/EDIT CUSTOMER MODAL */}
      {isCustomerModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalCard}>
            <div className={styles.modalHeader}>
              <h2>{customerModalMode === "add" ? "Create Customer Profile" : "Edit Customer Profile"}</h2>
              <button onClick={() => setIsCustomerModalOpen(false)} className={styles.closeBtn}>
                ✕
              </button>
            </div>
            <form onSubmit={handleCustomerSubmit} className={styles.modalForm}>
              {formError && <div className={styles.formError}>{formError}</div>}

              <div className={styles.inputGroup}>
                <label className={styles.label}>Customer Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="e.g. Adnan Ahmad"
                  className={styles.input}
                  required
                />
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.label}>Contact Phone</label>
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="e.g. 0321-4567890"
                  className={styles.input}
                />
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.label}>Address</label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  placeholder="e.g. Phase 5 DHA Lahore"
                  className={styles.input}
                />
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.label}>Notes</label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  placeholder="Write any additional details, special credit policies, etc."
                  className={styles.textarea}
                />
              </div>

              <div className={styles.modalActions}>
                <button
                  type="button"
                  onClick={() => setIsCustomerModalOpen(false)}
                  className={styles.modalCancelBtn}
                >
                  Cancel
                </button>
                <button type="submit" className={styles.modalSubmitBtn}>
                  {customerModalMode === "add" ? "Create Customer" : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RECORD PAYMENT MODAL */}
      {isPaymentModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalCard}>
            <div className={styles.modalHeader}>
              <h2>Record Khata Payment</h2>
              <button onClick={() => setIsPaymentModalOpen(false)} className={styles.closeBtn}>
                ✕
              </button>
            </div>
            <form onSubmit={handlePaymentSubmit} className={styles.modalForm}>
              <p className={styles.modalText}>
                Recording credit payment for <strong>{selectedCustomer?.name}</strong>.
              </p>
              <p className={styles.modalTextSub}>
                Current Credit Balance:{" "}
                <strong style={{ color: "var(--danger)" }}>
                  Rs. {selectedCustomer?.creditBalance.toLocaleString()}
                </strong>
              </p>

              <div className={styles.inputGroup}>
                <label className={styles.label}>Payment Amount Received (Rs.) *</label>
                <input
                  type="number"
                  min="1"
                  step="any"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder="Enter amount paid"
                  className={styles.input}
                  required
                  autoFocus
                />
              </div>

              <div className={styles.modalActions}>
                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(false)}
                  className={styles.modalCancelBtn}
                >
                  Cancel
                </button>
                <button type="submit" className={styles.modalSubmitBtn}>
                  💸 Save Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* INVOICE HISTORY / LEDGER MODAL */}
      {isHistoryModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.ledgerModalCard}>
            <div className={styles.modalHeader}>
              <h2>Customer Ledger: {selectedCustomer?.name}</h2>
              <button onClick={() => setIsHistoryModalOpen(false)} className={styles.closeBtn}>
                ✕
              </button>
            </div>
            <div className={styles.ledgerContent}>
              <div className={styles.ledgerSummary}>
                <div className={styles.summaryItem}>
                  <span>Total Purchases:</span>
                  <strong>Rs. {selectedCustomer?.totalPurchases.toLocaleString()}</strong>
                </div>
                <div className={styles.summaryItem}>
                  <span>Outstanding Credit Balance:</span>
                  <strong style={{ color: selectedCustomer?.creditBalance > 0 ? "var(--warning)" : "var(--success)" }}>
                    Rs. {selectedCustomer?.creditBalance.toLocaleString()}
                  </strong>
                </div>
              </div>

              <h3 className={styles.ledgerTitle}>Invoice Billing Records</h3>
              {historyLoading ? (
                <div className={styles.loading}>Loading ledger invoices...</div>
              ) : historyInvoices.length === 0 ? (
                <p className={styles.noLedgerItems}>No billing history records for this customer.</p>
              ) : (
                <div className={styles.ledgerTableWrapper}>
                  <table className={styles.ledgerTable}>
                    <thead>
                      <tr>
                        <th>Invoice No</th>
                        <th>Total Amount</th>
                        <th>Payment Method</th>
                        <th>Date Created</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {historyInvoices.map((inv) => (
                        <tr key={inv._id}>
                          <td style={{ fontWeight: 700 }}>{inv.invoiceNumber}</td>
                          <td style={{ fontWeight: 600 }}>Rs. {inv.totalAmount.toLocaleString()}</td>
                          <td>
                            <span className={styles.ledgerBadge}>{inv.paymentMethod}</span>
                          </td>
                          <td>{new Date(inv.createdAt).toLocaleDateString()}</td>
                          <td>
                            <Link href={`/invoice/${inv._id}`} target="_blank">
                              <button className={styles.ledgerRowBtn}>📄 Print / View</button>
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
