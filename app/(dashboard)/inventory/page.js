"use client";

import { useState, useEffect } from "react";
import BarcodeScanner from "@/components/BarcodeScanner";
import { useConfirm } from "@/components/ConfirmContext";
import { useToast } from "@/components/ToastContext";
import styles from "./page.module.css";

const CATEGORIES = [
  "All Categories",
  "Notebooks & Registers",
  "Pens & Writing",
  "Art Supplies",
  "APS Items",
  "Calculators & Geometry",
  "Office Supplies",
  "Other Supplies",
];

export default function Inventory() {
  const confirm = useConfirm();
  const { showToast } = useToast();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All Categories");

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("add"); // "add" | "edit"
  const [currentProductId, setCurrentProductId] = useState(null);
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    name: "",
    sku: "",
    price: "",
    costPrice: "",
    stock: "",
    minStock: "5",
    category: "Notebooks & Registers",
    description: "",
  });
  const [formError, setFormError] = useState(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  async function fetchProducts() {
    try {
      setLoading(true);
      const res = await fetch("/api/products");
      const data = await res.json();
      if (data.success) {
        setProducts(data.data);
      } else {
        setError(data.error);
      }
    } catch (err) {
      console.error(err);
      setError("Failed to fetch products.");
    } finally {
      setLoading(false);
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const openAddModal = () => {
    setModalMode("add");
    setFormData({
      name: "",
      sku: "",
      price: "",
      costPrice: "",
      stock: "",
      minStock: "5",
      category: "Notebooks & Registers",
      description: "",
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (product) => {
    setModalMode("edit");
    setCurrentProductId(product._id);
    setFormData({
      name: product.name,
      sku: product.sku,
      price: product.price,
      costPrice: product.costPrice,
      stock: product.stock,
      minStock: product.minStock,
      category: product.category,
      description: product.description || "",
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleDelete = async (id, name) => {
    const isConfirmed = await confirm({
      title: "Delete Product",
      message: `Are you sure you want to delete "${name}" from inventory?`,
      confirmLabel: "Delete",
      cancelLabel: "Cancel",
    });
    if (!isConfirmed) return;
    try {
      const res = await fetch(`/api/products/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        setProducts((prev) => prev.filter((p) => p._id !== id));
        showToast(`"${name}" deleted successfully.`, "success");
      } else {
        showToast(data.error || "Failed to delete product.", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("An error occurred while deleting.", "error");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);

    // Validation
    if (!formData.name.trim() || !formData.sku.trim()) {
      setFormError("Product Name and SKU are required.");
      return;
    }

    const price = parseFloat(formData.price);
    const costPrice = parseFloat(formData.costPrice);
    const stock = parseInt(formData.stock);
    const minStock = parseInt(formData.minStock);

    if (isNaN(price) || price < 0) {
      setFormError("Please enter a valid price (greater or equal to 0).");
      return;
    }
    if (isNaN(costPrice) || costPrice < 0) {
      setFormError("Please enter a valid cost price (greater or equal to 0).");
      return;
    }
    if (isNaN(stock) || stock < 0) {
      setFormError("Please enter a valid stock level (greater or equal to 0).");
      return;
    }
    if (isNaN(minStock) || minStock < 0) {
      setFormError("Please enter a valid minimum stock threshold.");
      return;
    }

    const payload = {
      ...formData,
      price,
      costPrice,
      stock,
      minStock,
    };

    try {
      const url = modalMode === "add" ? "/api/products" : `/api/products/${currentProductId}`;
      const method = modalMode === "add" ? "POST" : "PUT";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (data.success) {
        setIsModalOpen(false);
        showToast(
          modalMode === "add"
            ? `"${formData.name}" added to inventory successfully!`
            : `"${formData.name}" updated successfully!`,
          "success"
        );
        fetchProducts(); // Refresh list
      } else {
        setFormError(data.error);
      }
    } catch (err) {
      console.error(err);
      setFormError("An error occurred while saving the product.");
    }
  };

  // Filter and search computation
  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory =
      selectedCategory === "All Categories" || product.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const getStockBadge = (stock, minStock) => {
    if (stock === 0) {
      return <span className={`${styles.badge} ${styles.badgeOutOfStock}`}>Out of Stock</span>;
    } else if (stock <= minStock) {
      return <span className={`${styles.badge} ${styles.badgeLowStock}`}>Low Stock ({stock})</span>;
    } else {
      return <span className={`${styles.badge} ${styles.badgeInStock}`}>In Stock ({stock})</span>;
    }
  };

  if (loading && products.length === 0) {
    return <div className={styles.loading}>Loading inventory...</div>;
  }

  return (
    <div className={`${styles.container} slide-up`}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.titleSection}>
          <h1 className={styles.title}>Inventory Manager</h1>
          <p className={styles.subtitle}>Track stationery stock levels and product details</p>
        </div>
        <div className={styles.headerActions}>
          <a href="/api/export/products" download>
            <button className={styles.exportButton}>📥 Export CSV</button>
          </a>
          <button onClick={openAddModal} className={styles.addButton}>
            <span>➕</span> Add Product
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className={styles.filterBar}>
        <div style={{ display: 'flex', flex: 2, gap: 8, alignItems: 'center' }}>
          <input
            type="text"
            placeholder="Search by product name or SKU..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
            style={{ flex: 1 }}
          />
          <button
            type="button"
            onClick={() => setIsScannerOpen(true)}
            className={styles.scanButton}
            title="Scan barcode"
            style={{
              padding: '10px 14px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border)',
              background: 'var(--bg-primary)',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            📷 Scan
          </button>
        </div>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className={styles.selectInput}
        >
          {CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      {/* Main Table */}
      <div className={styles.panel}>
        {error && <div className={styles.error} style={{ margin: 20 }}>{error}</div>}
        <div className={styles.tableWrapper}>
          {filteredProducts.length === 0 ? (
            <p className={styles.noItems}>No matching products found in inventory.</p>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>SKU</th>
                  <th>Product Name</th>
                  <th>Category</th>
                  <th>Cost Price</th>
                  <th>Sale Price</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product) => (
                  <tr key={product._id}>
                    <td style={{ fontWeight: 600, color: "var(--text-secondary)" }}>{product.sku}</td>
                    <td style={{ fontWeight: 500 }}>{product.name}</td>
                    <td>{product.category}</td>
                    <td>Rs. {product.costPrice.toLocaleString()}</td>
                    <td style={{ fontWeight: 600 }}>Rs. {product.price.toLocaleString()}</td>
                    <td>{getStockBadge(product.stock, product.minStock)}</td>
                    <td>
                      <div className={styles.actionCell}>
                        <button
                          onClick={() => openEditModal(product)}
                          className={styles.iconButton}
                          title="Edit"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleDelete(product._id, product.name)}
                          className={styles.iconButton}
                          title="Delete"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal Add/Edit */}
      {isModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>
                {modalMode === "add" ? "Add New Product" : "Edit Product"}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className={styles.closeButton}>
                ✕
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className={styles.modalBody}>
                {formError && <div className={styles.error}>{formError}</div>}

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Product Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="e.g. Spiral Notebook A4"
                    className={styles.formInput}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>SKU / Barcode Code *</label>
                  <input
                    type="text"
                    name="sku"
                    value={formData.sku}
                    onChange={handleInputChange}
                    placeholder="e.g. SN-A4-01"
                    className={styles.formInput}
                    required
                    disabled={modalMode === "edit"} // Keep SKU locked on edit
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Category</label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className={styles.formInput}
                  >
                    {CATEGORIES.slice(1).map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Cost Price (Rs.) *</label>
                    <input
                      type="number"
                      name="costPrice"
                      value={formData.costPrice}
                      onChange={handleInputChange}
                      placeholder="e.g. 150"
                      className={styles.formInput}
                      required
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Sale Price (Rs.) *</label>
                    <input
                      type="number"
                      name="price"
                      value={formData.price}
                      onChange={handleInputChange}
                      placeholder="e.g. 250"
                      className={styles.formInput}
                      required
                    />
                  </div>
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Current Stock Quantity *</label>
                    <input
                      type="number"
                      name="stock"
                      value={formData.stock}
                      onChange={handleInputChange}
                      placeholder="e.g. 50"
                      className={styles.formInput}
                      required
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Low Stock Alert Threshold *</label>
                    <input
                      type="number"
                      name="minStock"
                      value={formData.minStock}
                      onChange={handleInputChange}
                      placeholder="e.g. 5"
                      className={styles.formInput}
                      required
                    />
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Description</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Provide a small details about product..."
                    rows={3}
                    className={styles.formTextarea}
                  />
                </div>
              </div>
              <div className={styles.modalFooter}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className={styles.cancelButton}
                >
                  Cancel
                </button>
                <button type="submit" className={styles.submitButton}>
                  {modalMode === "add" ? "Add Product" : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isScannerOpen && (
        <BarcodeScanner
          onScan={(code) => {
            setSearchTerm(code);
            setIsScannerOpen(false);
          }}
          onClose={() => setIsScannerOpen(false)}
        />
      )}
    </div>
  );
}
