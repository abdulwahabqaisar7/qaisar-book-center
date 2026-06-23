"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCart } from "@/components/CartContext";
import { useToast } from "@/components/ToastContext";
import styles from "./page.module.css";

export default function StoreCheckout() {
  const { cart, cartTotal, clearCart } = useCart();
  const router = useRouter();
  const { showToast } = useToast();

  const [customer, setCustomer] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);

  // Form states
  const [preferredPayment, setPreferredPayment] = useState("Cash");
  const [notes, setNotes] = useState("");
  const [placingOrder, setPlacingOrder] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    // Check if cart is empty, redirect to cart page
    if (cart.length === 0) {
      router.push("/store/cart");
      return;
    }

    async function fetchUser() {
      try {
        const res = await fetch("/api/auth/me");
        const data = await res.json();
        if (data.success) {
          setCustomer(data.user);
        }
      } catch (err) {
        console.error("Failed to load user session:", err);
      } finally {
        setLoadingUser(false);
      }
    }
    fetchUser();
  }, [cart, router]);

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    setPlacingOrder(true);
    setError("");

    const orderPayload = {
      items: cart.map((i) => ({
        productId: i.productId,
        name: i.name,
        quantity: i.quantity,
      })),
      preferredPayment,
      notes,
    };

    try {
      const res = await fetch("/api/store/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderPayload),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        clearCart();
        showToast("Order placed successfully! Pending admin review.", "success");
        router.push("/store/orders");
      } else {
        setError(data.error || "Failed to place order.");
      }
    } catch (err) {
      console.error(err);
      setError("Network error. Please try again.");
    } finally {
      setPlacingOrder(false);
    }
  };

  if (loadingUser) {
    return <div className={styles.loading}>Loading Checkout Details...</div>;
  }

  return (
    <div className={`${styles.container} slide-up`}>
      <h1 className={styles.title}>Store Checkout</h1>

      <div className={styles.layout}>
        {/* Left: Confirmation Details Form */}
        <form onSubmit={handlePlaceOrder} className={styles.checkoutForm}>
          {error && <div className={styles.errorAlert}>{error}</div>}

          <div className={styles.panel}>
            <h2 className={styles.panelTitle}>1. Account Information</h2>
            <div className={styles.metaRow}>
              <span>Customer Name:</span>
              <strong>{customer?.displayName || customer?.username || "Default Customer"}</strong>
            </div>
            <div className={styles.metaRow}>
              <span>Billing Account:</span>
              <span className={styles.usernameBadge}>@{customer?.username}</span>
            </div>
          </div>

          <div className={styles.panel}>
            <h2 className={styles.panelTitle}>2. Payment & Delivery</h2>
            <p className={styles.helperText}>
              All orders placed online are prepared for <strong>Self Pickup</strong> at our retail shop:{" "}
              <em>Main Bazaar Nishat Colony Lahore</em>.
            </p>

            <div className={styles.formGroup}>
              <label className={styles.label}>Preferred Payment Mode</label>
              <select
                value={preferredPayment}
                onChange={(e) => setPreferredPayment(e.target.value)}
                className={styles.selectInput}
              >
                <option value="Cash">Cash on Pickup</option>
                <option value="Card">Credit/Debit Card (Instore)</option>
                <option value="Mobile Transfer">Mobile Transfer (EasyPaisa/JazzCash)</option>
                <option value="On Credit">On Credit (Khata Ledger)</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Additional Notes / Pickup Instructions</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Mention any special notes for the shop administrator..."
                className={styles.textarea}
              />
            </div>
          </div>

          <button type="submit" disabled={placingOrder} className={styles.submitBtn}>
            {placingOrder ? "Placing Order..." : "🚀 Place Order"}
          </button>
        </form>

        {/* Right: Invoice Summary Review */}
        <div className={styles.summaryPanel}>
          <h2 className={styles.panelTitle}>Order Review</h2>
          <div className={styles.itemsReviewList}>
            {cart.map((item) => (
              <div key={item.productId} className={styles.reviewItem}>
                <div className={styles.reviewMeta}>
                  <span className={styles.reviewQty}>{item.quantity}x</span>
                  <span className={styles.reviewName}>{item.name}</span>
                </div>
                <span className={styles.reviewSubtotal}>Rs. {item.subtotal.toLocaleString()}</span>
              </div>
            ))}
          </div>

          <div className={styles.divider} />

          <div className={styles.summaryRow}>
            <span>Subtotal Amount:</span>
            <span>Rs. {cartTotal.toLocaleString()}</span>
          </div>
          <div className={styles.summaryRow}>
            <span>Estimated GST/Taxes:</span>
            <span>- (Determined by Admin)</span>
          </div>
          <div className={styles.summaryRow}>
            <span>Fulfillment Mode:</span>
            <span style={{ color: "var(--success)", fontWeight: 700 }}>Pickup</span>
          </div>

          <div className={styles.totalRow}>
            <span>Order Total:</span>
            <span>Rs. {cartTotal.toLocaleString()}</span>
          </div>

          <Link href="/store/cart" className={styles.backLink}>
            ← Modify Shopping Cart
          </Link>
        </div>
      </div>
    </div>
  );
}
