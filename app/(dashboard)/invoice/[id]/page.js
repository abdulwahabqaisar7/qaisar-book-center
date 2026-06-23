"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useConfirm } from "@/components/ConfirmContext";
import { useToast } from "@/components/ToastContext";
import styles from "./page.module.css";

export default function InvoiceDetail() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id;
  const confirm = useConfirm();
  const { showToast } = useToast();

  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) return;

    async function fetchInvoice() {
      try {
        const res = await fetch(`/api/invoices/${id}`);
        const data = await res.json();
        if (data.success) {
          setInvoice(data.data);
        } else {
          setError(data.error || "Failed to load invoice details.");
        }
      } catch (err) {
        console.error(err);
        setError("Network error. Please try again.");
      } finally {
        setLoading(false);
      }
    }

    fetchInvoice();
  }, [id]);

  const handlePrint = () => {
    window.print();
  };

  const handleDelete = async () => {
    const isConfirmed = await confirm({
      title: "Delete Invoice",
      message: "Are you sure you want to delete this invoice? This will restore stock levels for all items and cannot be undone.",
      confirmLabel: "Delete",
      cancelLabel: "Cancel",
    });
    if (!isConfirmed) return;
    try {
      const res = await fetch(`/api/invoices/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        showToast("Invoice deleted and stock restored successfully.", "success");
        router.push("/invoice");
      } else {
        showToast("Failed to delete invoice: " + data.error, "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Error deleting invoice.", "error");
    }
  };

  if (loading) {
    return <div className={styles.loading}>Loading invoice details...</div>;
  }

  if (error || !invoice) {
    return (
      <div className={styles.container}>
        <div className={styles.errorCard}>
          <h2>⚠️ Error</h2>
          <p>{error || "Invoice not found."}</p>
          <Link href="/invoice" className="no-print">
            <button className={styles.backButton}>← Back to Invoices</button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={`${styles.invoiceWrapper} slide-up`}>
      {/* Action panel at the top (hidden in print) */}
      <div className={`${styles.actionPanel} no-print`}>
        <Link href="/invoice">
          <button className={styles.backButton}>← Back to Invoices</button>
        </Link>
        <div className={styles.actionGroup}>
          <button onClick={handlePrint} className={styles.printButton}>
            🖨️ Print Invoice
          </button>
          <button onClick={handleDelete} className={styles.deleteButton}>
            🗑️ Delete Invoice
          </button>
        </div>
      </div>

      {/* Actual printable invoice sheet */}
      <div className={styles.invoiceSheet}>
        {/* Shop Branding Header */}
        <div className={styles.shopHeader}>
          <h1 className={styles.shopName}>Qaisar Book Center</h1>
          <p className={styles.shopAddress}>Main Bazaar Nishat Colony Lahore</p>
        </div>

        {/* Invoice Metadata */}
        <div className={styles.metaSection}>
          <div className={styles.metaCol}>
            <p className={styles.metaLabel}>Invoice Number</p>
            <p className={styles.metaValueMonospace}>{invoice.invoiceNumber}</p>
          </div>
          <div className={styles.metaCol} style={{ textAlign: "right" }}>
            <p className={styles.metaLabel}>Date</p>
            <p className={styles.metaValue}>
              {new Date(invoice.createdAt).toLocaleString(undefined, {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </p>
          </div>
        </div>

        {/* Customer Information */}
        <div className={styles.customerSection}>
          <h3 className={styles.sectionTitle}>Billed To:</h3>
          <p className={styles.customerName}>{invoice.customerName}</p>
          {invoice.customerPhone && (
            <p className={styles.customerContact}>📞 {invoice.customerPhone}</p>
          )}
        </div>

        {/* Invoice Items Table */}
        <div className={styles.tableContainer}>
          <table className={styles.invoiceTable}>
            <thead>
              <tr>
                <th style={{ width: "80px", textAlign: "center" }}>#</th>
                <th>Item Description</th>
                <th style={{ width: "120px", textAlign: "right" }}>Unit Price</th>
                <th style={{ width: "100px", textAlign: "center" }}>Qty</th>
                <th style={{ width: "140px", textAlign: "right" }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item, index) => (
                <tr key={index}>
                  <td style={{ textAlign: "center" }}>{index + 1}</td>
                  <td style={{ fontWeight: 500 }}>{item.name}</td>
                  <td style={{ textAlign: "right" }}>Rs. {item.price.toLocaleString()}</td>
                  <td style={{ textAlign: "center" }}>{item.quantity}</td>
                  <td style={{ textAlign: "right", fontWeight: 600 }}>
                    Rs. {item.subtotal.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Invoice Totals Summary */}
        <div className={styles.summarySection}>
          <div className={styles.paymentMethod}>
            <span className={styles.paymentLabel}>Payment Method:</span>
            <span className={styles.paymentBadge}>{invoice.paymentMethod}</span>
          </div>

          <div className={styles.totalsTable}>
            <div className={styles.totalsRow}>
              <span>Subtotal:</span>
              <span>Rs. {invoice.subtotal.toLocaleString()}</span>
            </div>
            {invoice.discount > 0 && (
              <div className={styles.totalsRow} style={{ color: "var(--danger)" }}>
                <span>Discount:</span>
                <span>- Rs. {invoice.discount.toLocaleString()}</span>
              </div>
            )}
            {invoice.tax > 0 && (
              <div className={styles.totalsRow}>
                <span>Sales Tax:</span>
                <span>+ Rs. {invoice.tax.toLocaleString()}</span>
              </div>
            )}
            <div className={`${styles.totalsRow} ${styles.grandTotalRow}`}>
              <span>Grand Total:</span>
              <span>Rs. {invoice.totalAmount.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Invoice Footer/Thank You */}
        <div className={styles.invoiceFooter}>
          <p className={styles.thankYou}>Thank you for your business!</p>
          <p className={styles.footerNote}>Software generated invoice. No signature required.</p>
        </div>
      </div>
    </div>
  );
}
