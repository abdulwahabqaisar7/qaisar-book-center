"use client";

import Link from "next/link";
import { useCart } from "@/components/CartContext";
import styles from "./page.module.css";

export default function StoreCart() {
  const { cart, updateQuantity, removeFromCart, cartTotal, clearCart } = useCart();

  if (cart.length === 0) {
    return (
      <div className={`${styles.emptyContainer} slide-up`}>
        <div className={styles.emptyCard}>
          <span className={styles.emptyIcon}>🛒</span>
          <h2>Your Cart is Empty</h2>
          <p>Browse our catalog and add stationery items to your order.</p>
          <Link href="/store">
            <button className={styles.browseBtn}>Browse Products</button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={`${styles.container} slide-up`}>
      <h1 className={styles.title}>Shopping Cart</h1>

      <div className={styles.layout}>
        {/* Left Side: Items list */}
        <div className={styles.itemsPanel}>
          <div className={styles.panelHeader}>
            <span>Cart Items ({cart.length})</span>
            <button onClick={clearCart} className={styles.clearBtn}>
              Clear All
            </button>
          </div>

          <div className={styles.itemList}>
            {cart.map((item) => (
              <div key={item.productId} className={styles.itemRow}>
                <div className={styles.itemMeta}>
                  <h3 className={item.name}>{item.name}</h3>
                  <span className={styles.itemSku}>SKU: {item.sku}</span>
                  <span className={styles.itemPrice}>Rs. {item.price.toLocaleString()} each</span>
                </div>

                <div className={styles.itemActions}>
                  <div className={styles.qtyControl}>
                    <button
                      onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                      className={styles.qtyBtn}
                    >
                      -
                    </button>
                    <span className={styles.qtyVal}>{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                      className={styles.qtyBtn}
                    >
                      +
                    </button>
                  </div>

                  <span className={styles.itemSubtotal}>Rs. {item.subtotal.toLocaleString()}</span>

                  <button
                    onClick={() => removeFromCart(item.productId)}
                    className={styles.removeBtn}
                    title="Remove item"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Side: Totals Summary */}
        <div className={styles.summaryPanel}>
          <h2 className={styles.summaryTitle}>Order Summary</h2>
          <div className={styles.summaryRow}>
            <span>Items Subtotal:</span>
            <strong>Rs. {cartTotal.toLocaleString()}</strong>
          </div>
          <div className={styles.summaryRow}>
            <span>Estimated Shipping:</span>
            <span style={{ color: "var(--success)", fontWeight: 700 }}>FREE (Self Pickup)</span>
          </div>
          
          <div className={styles.totalRow}>
            <span>Estimated Total:</span>
            <span>Rs. {cartTotal.toLocaleString()}</span>
          </div>

          <Link href="/store/checkout">
            <button className={styles.checkoutBtn}>Proceed to Checkout</button>
          </Link>
          <Link href="/store" className={styles.continueLink}>
            ← Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}
