"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import styles from "./page.module.css";

export default function CustomerAccount() {
  const [profile, setProfile] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await fetch("/api/store/profile");
        const data = await res.json();
        if (data.success) {
          setProfile(data.data.customer);
          setInvoices(data.data.invoices || []);
        } else {
          setError(data.error || "Failed to load ledger profile.");
        }
      } catch (err) {
        console.error(err);
        setError("Error loading ledger profile.");
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, []);

  if (loading) {
    return <div className={styles.loading}>Loading ledger account...</div>;
  }

  const hasCredit = profile?.creditBalance > 0;

  return (
    <div className={`${styles.container} slide-up`}>
      <h1 className={styles.title}>My Khata Ledger</h1>

      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.grid}>
        {/* Left Side: Profile & Balance Summary */}
        <div className={styles.leftCol}>
          {/* Balance card */}
          <div className={hasCredit ? styles.balanceCardCredit : styles.balanceCardClear}>
            <span className={styles.balanceLabel}>Outstanding Khata Balance</span>
            <span className={styles.balanceVal}>Rs. {profile?.creditBalance.toLocaleString()}</span>
            <p className={styles.balanceNote}>
              {hasCredit
                ? "Please settle this amount at the Qaisar Book Center counter."
                : "All clear! Thank you for maintaining a zero-debt account."}
            </p>
          </div>

          {/* Profile details */}
          <div className={styles.panel}>
            <h2 className={styles.panelTitle}>Profile Information</h2>
            <div className={styles.profileRow}>
              <span>Customer Name:</span>
              <strong>{profile?.name}</strong>
            </div>
            <div className={styles.profileRow}>
              <span>Contact Phone:</span>
              <strong>{profile?.phone || "-"}</strong>
            </div>
            <div className={styles.profileRow}>
              <span>Billing Address:</span>
              <strong>{profile?.address || "-"}</strong>
            </div>
            {profile?.notes && (
              <div className={styles.profileNotes}>
                <span>Account Notes:</span>
                <p>{profile.notes}</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Ledger Billing List */}
        <div className={styles.rightCol}>
          <div className={styles.panel} style={{ height: "100%" }}>
            <h2 className={styles.panelTitle}>Ledger Billing History</h2>
            <div className={styles.summaryItem}>
              <span>Cumulative Lifetime Purchases:</span>
              <strong>Rs. {profile?.totalPurchases.toLocaleString()}</strong>
            </div>

            {invoices.length === 0 ? (
              <p className={styles.emptyLedger}>No billing invoices found on this account ledger.</p>
            ) : (
              <div className={styles.ledgerList}>
                {invoices.map((inv) => (
                  <div key={inv._id} className={styles.ledgerRow}>
                    <div className={styles.ledgerMeta}>
                      <span className={styles.invNumber}>{inv.invoiceNumber}</span>
                      <span className={styles.invDate}>{new Date(inv.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className={styles.ledgerPriceGroup}>
                      <span className={styles.invPrice}>Rs. {inv.totalAmount.toLocaleString()}</span>
                      <span className={styles.invMethod}>{inv.paymentMethod}</span>
                    </div>
                    <a
                      href={`/invoice/${inv._id}`}
                      target="_blank"
                      rel="noreferrer"
                      className={styles.viewBtn}
                    >
                      📄 View Bill
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
