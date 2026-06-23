"use client";

import { useState, useEffect } from "react";
import { useCart } from "@/components/CartContext";
import { useToast } from "@/components/ToastContext";
import styles from "./page.module.css";

export default function StoreCatalog() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const { addToCart, cart } = useCart();
  const { showToast } = useToast();

  useEffect(() => {
    async function fetchProducts() {
      try {
        setLoading(true);
        const res = await fetch("/api/store/products");
        const data = await res.json();
        if (data.success) {
          setProducts(data.data);
        } else {
          setError(data.error);
        }
      } catch (err) {
        console.error(err);
        setError("Failed to fetch product catalog.");
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
  }, []);

  const categories = ["All", ...new Set(products.map((p) => p.category))];

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "All" || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getCartQuantity = (productId) => {
    const item = cart.find((i) => i.productId === productId);
    return item ? item.quantity : 0;
  };

  if (loading) {
    return <div className={styles.loading}>Loading product catalog...</div>;
  }

  return (
    <div className={`${styles.container} slide-up`}>
      {/* Search & Filter Bar */}
      <div className={styles.filterSection}>
        <div className={styles.searchWrapper}>
          <input
            type="text"
            placeholder="Search stationery products by name or SKU..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
        </div>
        <div className={styles.categoryWrapper}>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`${styles.categoryBtn} ${selectedCategory === cat ? styles.categoryBtnActive : ""}`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      {/* Products Grid */}
      {filteredProducts.length === 0 ? (
        <div className={styles.emptyState}>No products available in this selection.</div>
      ) : (
        <div className={styles.grid}>
          {filteredProducts.map((product) => {
            const cartQty = getCartQuantity(product._id);
            const remainingStock = product.stock - cartQty;
            const isOutOfStock = remainingStock <= 0;

            return (
              <div key={product._id} className={styles.card}>
                <div className={styles.cardHeader}>
                  <span className={styles.categoryBadge}>{product.category}</span>
                  <span className={product.stock < 10 ? styles.stockAlert : styles.stockNormal}>
                    {product.stock} in stock
                  </span>
                </div>
                <div className={styles.cardBody}>
                  <h3 className={styles.prodName}>{product.name}</h3>
                  <p className={styles.prodSku}>SKU: {product.sku}</p>
                  <p className={styles.prodDesc}>{product.description || "No description provided."}</p>
                </div>
                <div className={styles.cardFooter}>
                  <div className={styles.priceSection}>
                    <span className={styles.currency}>Rs.</span>
                    <span className={styles.price}>{product.price.toLocaleString()}</span>
                  </div>
                  <button
                    onClick={() => {
                      const success = addToCart(product, 1);
                      if (success) showToast(`Added "${product.name}" to cart!`, "success");
                    }}
                    disabled={isOutOfStock}
                    className={styles.addBtn}
                  >
                    {isOutOfStock ? "Out of Stock" : "Add to Cart"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
