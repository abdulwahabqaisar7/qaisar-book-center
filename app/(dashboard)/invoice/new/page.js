"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import BarcodeScanner from "@/components/BarcodeScanner";
import { useToast } from "@/components/ToastContext";
import styles from "./page.module.css";

export default function NewInvoice() {
  const router = useRouter();
  const { showToast } = useToast();
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Customer & Bill Metadata
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [discount, setDiscount] = useState(0); // Flat Rs. discount
  const [tax, setTax] = useState(0); // Tax percentage (e.g. 5%)

  // Invoice Items
  const [invoiceItems, setInvoiceItems] = useState([]);

  // Selected item selector states
  const [selectedProductId, setSelectedProductId] = useState("");
  const [selectedQuantity, setSelectedQuantity] = useState(1);

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
    async function fetchData() {
      try {
        setLoading(true);
        // Fetch products
        const prodRes = await fetch("/api/products");
        const prodData = await prodRes.json();
        
        // Fetch customers
        const custRes = await fetch("/api/customers");
        const custData = await custRes.json();

        if (prodData.success) {
          setProducts(prodData.data);
          if (prodData.data.length > 0) {
            setSelectedProductId(prodData.data[0]._id);
          }
        } else {
          setError(prodData.error);
        }

        if (custData.success) {
          setCustomers(custData.data);
        }
      } catch (err) {
        console.error(err);
        setError("Failed to fetch startup data.");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const selectedProduct = products.find((p) => p._id === selectedProductId);

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

    if (selectedQuantity > selectedProduct.stock) {
      showToast(`Only ${selectedProduct.stock} items are available in stock.`, "warning");
      return;
    }

    // Check if item is already added to invoice
    const existingIndex = invoiceItems.findIndex(
      (item) => item.productId === selectedProductId
    );

    if (existingIndex > -1) {
      const updatedItems = [...invoiceItems];
      const newQty = updatedItems[existingIndex].quantity + Number(selectedQuantity);

      if (newQty > selectedProduct.stock) {
        showToast(`Cannot add more. Total requested (${newQty}) exceeds available stock (${selectedProduct.stock}).`, "warning");
        return;
      }

      updatedItems[existingIndex].quantity = newQty;
      updatedItems[existingIndex].subtotal = newQty * selectedProduct.price;
      setInvoiceItems(updatedItems);
    } else {
      setInvoiceItems((prev) => [
        ...prev,
        {
          productId: selectedProduct._id,
          name: selectedProduct.name,
          sku: selectedProduct.sku,
          price: selectedProduct.price,
          quantity: Number(selectedQuantity),
          subtotal: selectedProduct.price * Number(selectedQuantity),
        },
      ]);
    }

    // Reset selector quantity
    setSelectedQuantity(1);
  };

  const handleRemoveItem = (index) => {
    setInvoiceItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleBarcodeScan = (code) => {
    setIsScannerOpen(false);
    const codeStr = code.trim().toLowerCase();
    const product = products.find(
      (p) => p.sku.toLowerCase() === codeStr
    );

    if (product) {
      if (product.stock === 0) {
        showToast(`Product "${product.name}" is out of stock.`, "warning");
        return;
      }

      const existingIndex = invoiceItems.findIndex(
        (item) => item.productId === product._id
      );

      if (existingIndex > -1) {
        const updatedItems = [...invoiceItems];
        const newQty = updatedItems[existingIndex].quantity + 1;
        if (newQty > product.stock) {
          showToast(`Cannot add more. Exceeds stock limit (${product.stock}).`, "warning");
          return;
        }
        updatedItems[existingIndex].quantity = newQty;
        updatedItems[existingIndex].subtotal = newQty * product.price;
        setInvoiceItems(updatedItems);
      } else {
        setInvoiceItems((prev) => [
          ...prev,
          {
            productId: product._id,
            name: product.name,
            sku: product.sku,
            price: product.price,
            quantity: 1,
            subtotal: product.price,
          },
        ]);
      }
      setSelectedProductId(product._id);
      showToast(`Scanned and added: "${product.name}"`, "success");
    } else {
      showToast(`No product found with SKU: "${code}"`, "error");
    }
  };

  // Calculations
  const subtotal = invoiceItems.reduce((sum, item) => sum + item.subtotal, 0);
  const discountVal = Number(discount) || 0;
  const taxPercent = Number(tax) || 0;
  const taxVal = Math.round((subtotal - discountVal) * (taxPercent / 100));
  const totalAmount = Math.max(0, subtotal - discountVal + taxVal);

  const handleSubmitInvoice = async () => {
    if (!customerName.trim()) {
      setSubmitError("Customer name is required.");
      return;
    }
    if (invoiceItems.length === 0) {
      setSubmitError("Please add at least one item to the invoice.");
      return;
    }
    if (paymentMethod === "On Credit" && !selectedCustomerId) {
      setSubmitError("Please select a registered customer profile to bill 'On Credit' (Khata).");
      return;
    }

    setSaving(true);
    setSubmitError(null);

    const payload = {
      customerName,
      customerPhone,
      items: invoiceItems,
      subtotal,
      discount: discountVal,
      tax: taxPercent,
      totalAmount,
      paymentMethod,
      customerId: selectedCustomerId || null
    };

    try {
      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (data.success) {
        // Redirect to print layout page for this invoice
        router.push(`/invoice/${data.data._id}`);
      } else {
        setSubmitError(data.error);
      }
    } catch (err) {
      console.error(err);
      setSubmitError("Failed to save the invoice.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className={styles.loading}>Loading Invoice Setup...</div>;
  }

  return (
    <div className={`${styles.container} slide-up`}>
      {/* Header */}
      <div className={styles.header}>
        <h1 className={styles.title}>New Invoice</h1>
        <p className={styles.subtitle}>Generate a sales receipt and deduct stock from inventory</p>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.grid}>
        {/* Left Column: Build Invoice */}
        <div className={styles.panel}>
          <h2 className={styles.panelTitle}>Invoice Items</h2>

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
                <div className={styles.formInput} style={{ opacity: 0.5 }}>No products in stock</div>
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
                      ✅ {selectedProduct.name} — SKU: {selectedProduct.sku} (Rs. {selectedProduct.price.toLocaleString()} | {selectedProduct.stock} left)
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
                            disabled={p.stock === 0}
                            className={`${styles.searchDropdownItem} ${p._id === selectedProductId ? styles.searchDropdownItemActive : ''} ${p.stock === 0 ? styles.searchDropdownItemDisabled : ''}`}
                            onClick={() => {
                              setSelectedProductId(p._id);
                              setProductSearch('');
                              setIsProductDropdownOpen(false);
                            }}
                          >
                            <span className={styles.searchItemName}>{p.name}</span>
                            <span className={styles.searchItemMeta}>SKU: {p.sku} · Rs. {p.price.toLocaleString()} · {p.stock === 0 ? 'Out of stock' : `${p.stock} left`}</span>
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
                <label className={styles.formLabel}>Quantity</label>
                <input
                  type="number"
                  min="1"
                  max={selectedProduct ? selectedProduct.stock : 1}
                  value={selectedQuantity}
                  onChange={(e) => setSelectedQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className={styles.formInput}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Price</label>
                <input
                  type="text"
                  disabled
                  value={selectedProduct ? `Rs. ${selectedProduct.price}` : "-"}
                  className={styles.formInput}
                  style={{ backgroundColor: "rgba(0,0,0,0.03)" }}
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
            {invoiceItems.length === 0 ? (
              <p className={styles.emptyState}>No items added to the bill yet. Select a product above.</p>
            ) : (
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>SKU</th>
                    <th>Product Name</th>
                    <th>Price</th>
                    <th>Qty</th>
                    <th>Subtotal</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {invoiceItems.map((item, index) => (
                    <tr key={index}>
                      <td>{item.sku}</td>
                      <td>{item.name}</td>
                      <td>Rs. {item.price.toLocaleString()}</td>
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
          <h2 className={styles.panelTitle}>Customer Details & Summary</h2>

          {submitError && <div className={styles.error}>{submitError}</div>}

          {/* Link Customer Account */}
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Link Ledger Profile</label>
            <select
              value={selectedCustomerId}
              onChange={(e) => {
                const cid = e.target.value;
                setSelectedCustomerId(cid);
                if (cid) {
                  const cust = customers.find((c) => c._id === cid);
                  if (cust) {
                    setCustomerName(cust.name);
                    setCustomerPhone(cust.phone || "");
                  }
                } else {
                  setCustomerName("");
                  setCustomerPhone("");
                }
              }}
              className={styles.selectInput}
            >
              <option value="">-- Ad-hoc / New Customer --</option>
              {customers.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name} {c.phone ? `(${c.phone})` : ""} {c.creditBalance > 0 ? `[Credit: Rs. ${c.creditBalance}]` : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Customer Form */}
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Customer Name *</label>
            <input
              type="text"
              placeholder="e.g. Ali Ahmed"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className={styles.formInput}
              required
              disabled={!!selectedCustomerId}
              style={selectedCustomerId ? { backgroundColor: "rgba(0,0,0,0.03)" } : {}}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Phone Number</label>
            <input
              type="text"
              placeholder="e.g. 0300-1234567"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              className={styles.formInput}
              disabled={!!selectedCustomerId}
              style={selectedCustomerId ? { backgroundColor: "rgba(0,0,0,0.03)" } : {}}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Payment Method</label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className={styles.selectInput}
            >
              <option value="Cash">Cash</option>
              <option value="Card">Credit/Debit Card</option>
              <option value="Mobile Transfer">Mobile Transfer (EasyPaisa/JazzCash)</option>
              <option value="On Credit">On Credit (Khata)</option>
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
            onClick={handleSubmitInvoice}
            disabled={saving || invoiceItems.length === 0}
            className={styles.submitButton}
          >
            {saving ? "Saving Bill..." : "💾 Save & Print Invoice"}
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
