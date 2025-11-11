// src/utils/cartStorage.js
const CART_KEY = "guest_cart";

// Emit a custom event so listeners (header, mini cart, etc.) can update
const notifyCart = () => {
  window.dispatchEvent(new Event("cart:updated"));
  // Also fire storage event for other tabs (optional localStorage ping)
  localStorage.setItem("__cart_ping__", String(Date.now()));
};

export const getGuestCart = () => {
  try {
    return JSON.parse(localStorage.getItem(CART_KEY)) || [];
  } catch {
    return [];
  }
};

export const saveGuestCart = (cart) => {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  notifyCart();
};

export const clearGuestCart = () => {
  localStorage.removeItem(CART_KEY);
  notifyCart();
};

// Helper to build a unique key per product/variant combo
const lineKey = (productId, variantId) => `${productId}::${variantId || ""}`;

/**
 * Add to cart (supports variantId)
 * product: { id, name, price, ... }
 */
export const addToGuestCart = (product, quantity = 1, variantId = null) => {
  const cart = getGuestCart();
  const key = lineKey(product.id, variantId);

  const idx = cart.findIndex(
    (i) => lineKey(i.id, i.variantId) === key
  );

  if (idx >= 0) {
    cart[idx].quantity += quantity;
  } else {
    cart.push({ ...product, quantity, variantId });
  }

  saveGuestCart(cart);
};

export const updateGuestCartQty = (productId, variantId, quantity) => {
  const cart = getGuestCart();
  const key = lineKey(productId, variantId);

  const idx = cart.findIndex((i) => lineKey(i.id, i.variantId) === key);
  if (idx >= 0) {
    cart[idx].quantity = Math.max(1, Number(quantity || 1));
    saveGuestCart(cart);
  }
};

export const removeFromGuestCart = (productId, variantId = null) => {
  const key = lineKey(productId, variantId);
  const next = getGuestCart().filter(
    (i) => lineKey(i.id, i.variantId) !== key
  );
  saveGuestCart(next);
};

// Optional helpers
export const guestCartCount = () =>
  getGuestCart().reduce((sum, i) => sum + (i.quantity || 1), 0);

export const guestCartTotal = () =>
  getGuestCart().reduce((sum, i) => sum + (Number(i.price || 0) * (i.quantity || 1)), 0);



// const CART_KEY = "guest_cart";

// export const getGuestCart = () => {
//   try {
//     return JSON.parse(localStorage.getItem(CART_KEY)) || [];
//   } catch {
//     return [];
//   }
// };

// export const saveGuestCart = (cart) => {
//   localStorage.setItem(CART_KEY, JSON.stringify(cart));
// };

// export const addToGuestCart = (product, quantity = 1) => {
//   const cart = getGuestCart();
//   const existing = cart.find((i) => i.id === product.id);

//   if (existing) {
//     existing.quantity += quantity;
//   } else {
//     cart.push({ ...product, quantity });
//   }

//   saveGuestCart(cart);

//   // 🔁 Force reload so header updates instantly
//   window.location.reload();
// };

// export const removeFromGuestCart = (id) => {
//   const cart = getGuestCart().filter((i) => i.id !== id);
//   saveGuestCart(cart);

//   // 🔁 Reload to update header count
//   window.location.reload();
// };

// export const clearGuestCart = () => {
//   localStorage.removeItem(CART_KEY);
// };
