"use client";

import { createContext, useContext, useState, useEffect } from "react";

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cart, setCart] = useState([]);

  useEffect(() => {
    const storedCart = localStorage.getItem("qbc_cart");
    if (storedCart) {
      try {
        setCart(JSON.parse(storedCart));
      } catch (err) {
        console.error("Failed to parse cart:", err);
      }
    }
  }, []);

  const saveCart = (newCart) => {
    setCart(newCart);
    localStorage.setItem("qbc_cart", JSON.stringify(newCart));
  };

  const addToCart = (product, quantity = 1) => {
    const existingIndex = cart.findIndex((item) => item.productId === product._id);
    const qty = Number(quantity);

    if (existingIndex > -1) {
      const newCart = [...cart];
      const newQty = newCart[existingIndex].quantity + qty;
      if (newQty > product.stock) {
        alert(`Cannot add more. Total requested (${newQty}) exceeds stock (${product.stock}).`);
        return false;
      }
      newCart[existingIndex].quantity = newQty;
      newCart[existingIndex].subtotal = newQty * product.price;
      saveCart(newCart);
    } else {
      if (qty > product.stock) {
        alert(`Cannot add more. Requested quantity exceeds stock.`);
        return false;
      }
      const newCart = [
        ...cart,
        {
          productId: product._id,
          name: product.name,
          sku: product.sku,
          price: product.price,
          quantity: qty,
          subtotal: product.price * qty,
          stock: product.stock,
        },
      ];
      saveCart(newCart);
    }
    return true;
  };

  const removeFromCart = (productId) => {
    const newCart = cart.filter((item) => item.productId !== productId);
    saveCart(newCart);
  };

  const updateQuantity = (productId, quantity) => {
    const qty = Math.max(1, Number(quantity));
    const item = cart.find((i) => i.productId === productId);
    if (!item) return;

    if (qty > item.stock) {
      alert(`Only ${item.stock} items are available in stock.`);
      return;
    }

    const newCart = cart.map((i) => {
      if (i.productId === productId) {
        return {
          ...i,
          quantity: qty,
          subtotal: qty * i.price,
        };
      }
      return i;
    });
    saveCart(newCart);
  };

  const clearCart = () => {
    saveCart([]);
  };

  const cartCount = cart.length;
  const cartTotal = cart.reduce((sum, item) => sum + item.subtotal, 0);

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        cartCount,
        cartTotal,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
