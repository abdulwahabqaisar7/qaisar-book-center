"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import BarcodeScanner from "@/components/BarcodeScanner";
import { useToast } from "@/components/ToastContext";
import styles from "./page.module.css";

export default function NewPurchase() {
  const router = useRouter();
  const { showToast } = useToast();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Purchase Metadata
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [discount, setDiscount] = useState(0); // Flat Rs. discount
  const [tax, setTax] = useState(0); // Tax percentage (e.g. 5%)
  const [notes, setNotes] = useState("");

  // Purchase Items
  const [purchaseItems, setPurchaseItems] = useState([]);

  // Selected item selector states
  const [selectedProductId, setSelectedProductId] = useState("");
  const [selectedQuantity, setSelectedQuantity] = useState(1);
  const [selectedCostPrice, setSelectedCostPrice] = useState(0);

  // Product search state
  const [productSearch, setProductSearch] = useState("");
  const [isProductDropdownOpen, setIsProductDropdownOpen] = useState(false);

  // Action status states
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  // Ref for click-outside detection on product search
  const searchWrapperRef = useRef(null);

  const handleClickOutside = useCallback((e) => {
    if (searchWrapperRef.current && !searchWrapperRef.current.contains(e.target)) {
      setIsProductDropdownOpen(false);
    }
  }, []);

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [handleClickOutside]);

  useEffect(() => {
    async function fetchProducts() {
      try {
        setLoading(true);
        const prodRes = await fetch("/api/products");
        const prodData = await prodRes.json();

        if (prodData.success) {
          setProducts(prodData.data);
          if (prodData.data.length > 0) {
            setSelectedProductId(prodData.data[0]._id);
            setSelectedCostPrice(prodData.data[0].costPrice || 0);
          }
        } else {
          setError(prodData.error);
        }
      } catch (err) {
        console.error(err);
        setError("Failed to fetch products.");
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
  }, []);

  const selectedProduct = products.find((p) => p._id === selectedProductId);

  // Reset cost price when selected product changes
  useEffect(() => {
    if (selectedProduct) {
      setSelectedCostPrice(selectedProduct.costPrice || 0);
    }
  }, [selectedProductId, selectedProduct]);

  // Filtered products based on search
  const filteredProducts = products.filter((p) => {
    if (!productSearch.trim()) return true;
    const q = productSearch.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      p.sku.toLowerCase().includes(q)
    );
  });

  const handleAddItem = () => {
    if (!selectedProduct) return;

    if (selectedQuantity <= 0) {
      showToast("Quantity must be at least 1", "warning");
      return;
    }

    if (selectedCostPrice < 0) {
      showToast("Cost price cannot be negative", "warning");
      return;
    }

    // Check if item is already added to purchase invoice
    const existingIndex = purchaseItems.findIndex(
      (item) => item.productId === selectedProductId
    );

    if (existingIndex > -1) {
      const updatedItems = [...purchaseItems];
      const newQty = updatedItems[existingIndex].quantity + Number(selectedQuantity);
      
      // Update quantity and set costPrice to the latest entered cost price
      updatedItems[existingIndex].quantity = newQty;
      updatedItems[existingIndex].costPrice = Number(selectedCostPrice);
      updatedItems[existingIndex].subtotal = newQty * Number(selectedCostPrice);
      setPurchaseItems(updatedItems);
      showToast(`Updated "${selectedProduct.name}" quantity to ${newQty}`, "success");
    } else {
      setPurchaseItems((prev) => [
        ...prev,
        {
          productId: selectedProduct._id,
          name: selectedProduct.name,
          sku: selectedProduct.sku,
          costPrice: Number(selectedCostPrice),
          quantity: Number(selectedQuantity),
          subtotal: Number(selectedCostPrice) * Number(selectedQuantity),
        },
      ]);
      showToast(`Added "${selectedProduct.name}" to purchase list`, "success");
    }

    // Reset selector quantity
    setSelectedQuantity(1);
  };

  const handleRemoveItem = (index) => {
    setPurchaseItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleBarcodeScan = (code) => {
    setIsScannerOpen(false);
    const codeStr = code.trim().toLowerCase();
    const product = products.find(
      (p) => p.sku.toLowerCase() === codeStr
    );

    if (product) {
      const existingIndex = purchaseItems.findIndex(
        (item) => item.productId === product._id
      );

      if (existingIndex > -1) {
        const updatedItems = [...purchaseItems];
        const newQty = updatedItems[existingIndex].quantity + 1;
        updatedItems[existingIndex].quantity = newQty;
        updatedItems[existingIndex].subtotal = newQty * updatedItems[existingIndex].costPrice;
        setPurchaseItems(updatedItems);
      } else {
        setPurchaseItems((prev) => [
          ...prev,
          {
            productId: product._id,
            name: product.name,
            sku: product.sku,
            costPrice: product.costPrice || 0,
            quantity: 1,
            subtotal: product.costPrice || 0,
          },
        ]);
      }
      setSelectedProductId(product._id);
      showToast(`Scanned and selected: "${product.name}"`, "success");
    } else {
      showToast(`No product found with SKU: "${code}"`, "error");
    }
  };

  // Calculations
  const subtotal = purchaseItems.reduce((sum, item) => sum + item.subtotal, 0);
  const discountVal = Number(discount) || 0;
  const taxPercent = Number(tax) || 0;
  const taxVal = Math.round((subtotal - discountVal) * (taxPercent / 100));
  const totalAmount = Math.max(0, subtotal - discountVal + taxVal);

  const handleSubmitPurchase = async () => {
    if (purchaseItems.length === 0) {
      setSubmitError("Please add at least one item to the purchase invoice.");
      return;
    }

    setSaving(true);
    setSubmitError(null);

    const payload = {
      items: purchaseItems,
      subtotal,
      discount: discountVal,
      tax: taxPercent,
      totalAmount,
      paymentMethod,
      notes: notes.trim() || undefined
    };

    try {
      const res = await fetch("/api/purchases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (data.success) {
        showToast(`Purchase invoice ${data.data.purchaseNumber} recorded! Inventory updated.`, "success");
        router.push("/purchases");
      } else {
        setSubmitError(data.error);
      }
    } catch (err) {
      console.error(err);
      setSubmitError("Failed to save the purchase invoice.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className={styles.loading}>Loading Purchase Setup...</div>;
  }

  return (
    <div className={`${styles.container} slide-up`}>
      {/* Header */}
      <div className={styles.header}>
        <h1 className={styles.title}>New Purchase Invoice</h1>
        <p className={styles.subtitle}>Log stock purchase from suppliers, add to stock, and deduct cash</p>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.grid}>
        {/* Left Column: Build Purchase */}
        <div className={styles.panel}>
          <h2 className={styles.panelTitle}>Purchased Items</h2>

          {/* Item Selector */}
          <div className={styles.itemSelector}>
            <div className={styles.formGroup}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <label className={styles.formLabel} style={{ marginBottom: 0 }}>Search & Select Product</label>
                <button
                  type="button"
                  onClick={() => setIsScannerOpen(true)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--accent)',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: 700,
                  }}
                >
                  📷 Scan Barcode
                </button>
              </div>
              {products.length === 0 ? (
                <div className={styles.formInput} style={{ opacity: 0.5 }}>No products found in database</div>
              ) : (
                <div className={styles.searchWrapper} ref={searchWrapperRef}>
                  <input
                    type="text"
                    placeholder="Type to search by name or SKU..."
                    value={productSearch}
                    onChange={(e) => {
                      setProductSearch(e.target.value);
                      setIsProductDropdownOpen(true);
                    }}
                    onFocus={() => setIsProductDropdownOpen(true)}
                    className={styles.formInput}
                    style={{ width: '100%' }}
                  />
                  {selectedProduct && !isProductDropdownOpen && (
                    <div className={styles.selectedChip}>
                      ✅ {selectedProduct.name} — SKU: {selectedProduct.sku} (Current Cost: Rs. {selectedProduct.costPrice.toLocaleString()} | Current Stock: {selectedProduct.stock} left)
                    </div>
                  )}
                  {isProductDropdownOpen && (
                    <div className={styles.searchDropdown}>
                      {filteredProducts.length === 0 ? (
                        <div className={styles.searchDropdownEmpty}>No products match your search.</div>
                      ) : (
                        filteredProducts.map((p) => (
                          <button
                            key={p._id}
                            type="button"
                            className={`${styles.searchDropdownItem} ${p._id === selectedProductId ? styles.searchDropdownItemActive : ''}`}
                            onClick={() => {
                              setSelectedProductId(p._id);
                              setProductSearch('');
                              setIsProductDropdownOpen(false);
                            }}
                          >
                            <span className={styles.searchItemName}>{p.name}</span>
                            <span className={styles.searchItemMeta}>SKU: {p.sku} · Cost: Rs. {p.costPrice.toLocaleString()} · Stock: {p.stock} left</span>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className={styles.itemSelectorRow}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Quantity to Purchase</label>
                <input
                  type="number"
                  min="1"
                  value={selectedQuantity}
                  onChange={(e) => setSelectedQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className={styles.formInput}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Purchase Cost Price (Rs.)</label>
                <input
                  type="number"
                  min="0"
                  value={selectedCostPrice}
                  onChange={(e) => setSelectedCostPrice(Math.max(0, parseFloat(e.target.value) || 0))}
                  className={styles.formInput}
                />
              </div>

              <button
                type="button"
                onClick={handleAddItem}
                disabled={products.length === 0 || !selectedProduct}
                className={styles.addButton}
              >
                Add Item
              </button>
            </div>
          </div>

          {/* Items Table */}
          <div className={styles.tableWrapper}>
            {purchaseItems.length === 0 ? (
              <p className={styles.emptyState}>No items added to the purchase invoice yet. Select a product above.</p>
            ) : (
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>SKU</th>
                    <th>Product Name</th>
                    <th>Purchase Cost</th>
                    <th>Qty</th>
                    <th>Subtotal</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {purchaseItems.map((item, index) => (
                    <tr key={index}>
                      <td>{item.sku}</td>
                      <td>{item.name}</td>
                      <td>Rs. {item.costPrice.toLocaleString()}</td>
                      <td>{item.quantity}</td>
                      <td style={{ fontWeight: 600 }}>Rs. {item.subtotal.toLocaleString()}</td>
                      <td>
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(index)}
                          className={styles.removeButton}
                          title="Remove"
                        >
                          ✕
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Right Column: Checkout Info */}
        <div className={styles.panel}>
          <h2 className={styles.panelTitle}>Purchase Invoice Summary</h2>

          {submitError && <div className={styles.error}>{submitError}</div>}

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Payment Method</label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className={styles.selectInput}
            >
              <option value="Cash">Cash (Deduct Cash-in-hand)</option>
              <option value="Mobile Transfer">Mobile Transfer</option>
              <option value="On Credit">On Credit</option>
            </select>
          </div>

          {/* Financials Adjustments */}
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Discount (Rs. Flat)</label>
            <input
              type="number"
              min="0"
              value={discount}
              onChange={(e) => setDiscount(Math.max(0, parseFloat(e.target.value) || 0))}
              className={styles.formInput}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Tax (GST %)</label>
            <input
              type="number"
              min="0"
              max="100"
              value={tax}
              onChange={(e) => setTax(Math.max(0, Math.min(100, parseFloat(e.target.value) || 0)))}
              className={styles.formInput}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Purchase Notes</label>
            <textarea
              placeholder="e.g. Stationery restock batch #5"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className={styles.formInput}
              style={{ fontFamily: 'inherit', resize: 'vertical' }}
            />
          </div>

          {/* Totals Summary */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 16 }}>
            <div className={styles.summaryRow}>
              <span>Subtotal:</span>
              <span>Rs. {subtotal.toLocaleString()}</span>
            </div>
            {discountVal > 0 && (
              <div className={styles.summaryRow} style={{ color: "var(--danger)" }}>
                <span>Discount:</span>
                <span>- Rs. {discountVal.toLocaleString()}</span>
              </div>
            )}
            {taxPercent > 0 && (
              <div className={styles.summaryRow}>
                <span>Tax ({taxPercent}%):</span>
                <span>+ Rs. {taxVal.toLocaleString()}</span>
              </div>
            )}
            <div className={styles.summaryTotal}>
              <span>Grand Total:</span>
              <span>Rs. {totalAmount.toLocaleString()}</span>
            </div>
          </div>

          {/* Submit */}
          <button
            type="button"
            onClick={handleSubmitPurchase}
            disabled={saving || purchaseItems.length === 0}
            className={styles.submitButton}
          >
            {saving ? "Saving Purchase..." : "💾 Save Purchase Invoice"}
          </button>
        </div>
      </div>

      {isScannerOpen && (
        <BarcodeScanner
          onScan={handleBarcodeScan}
          onClose={() => setIsScannerOpen(false)}
        />
      )}
    </div>
  );
}
