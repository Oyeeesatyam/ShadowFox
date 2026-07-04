// cart.js — cart, wishlist, saved-for-later persistence
(function () {
  const K = { cart: "nm_cart_v1", wish: "nm_wish_v1", saved: "nm_saved_v1", addr: "nm_addr_v1" };
  const load = (k) => { try { return JSON.parse(localStorage.getItem(k)) || []; } catch { return []; } };
  const save = (k, v) => localStorage.setItem(k, JSON.stringify(v));

  const state = {
    cart: load(K.cart),   // [{id, qty, color, size}]
    wish: load(K.wish),   // [id]
    saved: load(K.saved), // [{id, qty, color, size}]
    addresses: load(K.addr), // saved shipping addresses
  };

  const listeners = new Set();
  const emit = () => listeners.forEach((fn) => fn(state));

  function findProduct(id) { return window.PRODUCTS.find((p) => p.id === id); }

  const Cart = {
    state,
    on(fn) { listeners.add(fn); return () => listeners.delete(fn); },
    add(id, opts = {}) {
      const existing = state.cart.find((l) => l.id === id && l.color === opts.color && l.size === opts.size);
      if (existing) existing.qty += opts.qty || 1;
      else state.cart.push({ id, qty: opts.qty || 1, color: opts.color || null, size: opts.size || null });
      save(K.cart, state.cart); emit();
    },
    setQty(idx, qty) {
      if (qty <= 0) state.cart.splice(idx, 1);
      else state.cart[idx].qty = qty;
      save(K.cart, state.cart); emit();
    },
    remove(idx) { state.cart.splice(idx, 1); save(K.cart, state.cart); emit(); },
    clear() { state.cart = []; save(K.cart, state.cart); emit(); },
    count() { return state.cart.reduce((n, l) => n + l.qty, 0); },
    subtotal() {
      return state.cart.reduce((s, l) => {
        const p = findProduct(l.id); return s + (p ? p.price * l.qty : 0);
      }, 0);
    },
    saveForLater(idx) {
      const [line] = state.cart.splice(idx, 1);
      if (line) state.saved.push(line);
      save(K.cart, state.cart); save(K.saved, state.saved); emit();
    },
    moveToCart(idx) {
      const [line] = state.saved.splice(idx, 1);
      if (line) state.cart.push(line);
      save(K.cart, state.cart); save(K.saved, state.saved); emit();
    },
    removeSaved(idx) { state.saved.splice(idx, 1); save(K.saved, state.saved); emit(); },

    // wishlist
    toggleWish(id) {
      const i = state.wish.indexOf(id);
      if (i >= 0) state.wish.splice(i, 1);
      else state.wish.push(id);
      save(K.wish, state.wish); emit();
      return i < 0;
    },
    inWish(id) { return state.wish.includes(id); },

    // addresses
    addAddress(addr) { state.addresses.push(addr); save(K.addr, state.addresses); emit(); },
  };

  window.NM_CART = Cart;
})();
