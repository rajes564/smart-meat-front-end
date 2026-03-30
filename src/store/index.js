import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ── Auth Store ────────────────────────────────────────────────────────────────
export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: () => !!get().token,
      role: () => get().user?.role || null,
      isAdmin: () => get().user?.role === 'ADMIN',
      isSeller: () => get().user?.role === 'SELLER',
      isCustomer: () => get().user?.role === 'CUSTOMER',

      setAuth: (user, token) => {
        localStorage.setItem('sms_token', token);
        set({ user, token });
      },
      logout: () => {
        localStorage.removeItem('sms_token');
        localStorage.removeItem('sms_user');
        set({ user: null, token: null });
      },
      updateUser: (updates) => set(state => ({ user: { ...state.user, ...updates } })),
    }),
    { name: 'sms_auth', partialize: (s) => ({ user: s.user, token: s.token }) }
  )
);

// ── Cart Store ────────────────────────────────────────────────────────────────
export const useCartStore = create(
  persist(
    (set, get) => ({
      items: {}, // { [productId]: { product, qty } }

      addItem: (product) => {
        const items = { ...get().items };
        if (items[product.id]) {
          items[product.id] = {
            ...items[product.id],
            qty: parseFloat((items[product.id].qty + (product.orderStep || 0.5)).toFixed(2)),
          };
        } else {
          items[product.id] = { product, qty: product.minOrderQty || 0.5 };
        }
        set({ items });
      },

      removeItem: (productId) => {
        const items = { ...get().items };
        delete items[productId];
        set({ items });
      },

      changeQty: (productId, delta) => {
        const items = { ...get().items };
        if (!items[productId]) return;
        const newQty = parseFloat((items[productId].qty + delta).toFixed(2));
        if (newQty <= 0) {
          delete items[productId];
        } else {
          items[productId] = { ...items[productId], qty: newQty };
        }
        set({ items });
      },

      // ✅ NEW — set qty directly (used by manual input)
      setQty: (productId, qty) => {
        const items = { ...get().items };
        if (!items[productId]) return;
        const finalQty = parseFloat(qty.toFixed(2));
        if (finalQty <= 0) {
          delete items[productId];
        } else {
          items[productId] = { ...items[productId], qty: finalQty };
        }
        set({ items });
      },

      clearCart: () => set({ items: {} }),

      itemCount: () => Object.keys(get().items).length,

      total: () =>
        Object.values(get().items).reduce(
          (sum, { product, qty }) => sum + product.pricePerKg * qty,
          0
        ),

      itemsList: () => Object.values(get().items),

      toOrderPayload: (customerInfo) => ({
        customerName: customerInfo.name,
        customerMobile: customerInfo.mobile,
        paymentMethod: customerInfo.paymentMethod || 'CASH',
        notes: customerInfo.notes || '',
        items: Object.values(get().items).map(({ product, qty }) => ({
          productId: product.id,
          qty,
        })),
      }),
    }),
    { name: 'sms_cart' }
  )
);

// ── Shop Store (live settings) ────────────────────────────────────────────────
export const useShopStore = create((set) => ({
  settings: null,
  loaded: false,
  setSettings: (s) => set({ settings: s, loaded: true }),
  updateStatus: (status) => set(state => ({
    settings: state.settings ? { ...state.settings, status } : null,
  })),
}));

// ── Notifications Store ───────────────────────────────────────────────────────
export const useNotifStore = create((set, get) => ({
  notifications: [],
  unread: 0,

  push: (notif) => {
    set(state => ({
      notifications: [notif, ...state.notifications].slice(0, 50),
      unread: state.unread + 1,
    }));
  },

  markAllRead: () => set({ unread: 0 }),

  clear: () => set({ notifications: [], unread: 0 }),
}));

// ── Admin POS Store (seller / admin new-sale state) ───────────────────────────
export const usePosStore = create((set, get) => ({
  rows: [{ id: Date.now(), productId: null, qty: 1, product: null }],
  customerName: '',
  customerMobile: '',
  paymentMethod: 'CASH',
  addToKhata: false,
  paidNow: 0,

  setField: (field, val) => set({ [field]: val }),

  addRow: () => set(state => ({
    rows: [...state.rows, { id: Date.now(), productId: null, qty: 0.5, product: null }],
  })),

  removeRow: (id) => set(state => ({
    rows: state.rows.filter(r => r.id !== id),
  })),

  updateRow: (id, updates) => set(state => ({
    rows: state.rows.map(r => r.id === id ? { ...r, ...updates } : r),
  })),

  total: () => get().rows.reduce((sum, r) => {
    if (!r.product) return sum;
    return sum + r.product.pricePerKg * r.qty;
  }, 0),

  reset: () => set({
    rows: [{ id: Date.now(), productId: null, qty: 1, product: null }],
    customerName: '',
    customerMobile: '',
    paymentMethod: 'CASH',
    addToKhata: false,
    paidNow: 0,
  }),

  toPayload: () => {
    const { rows, customerName, customerMobile, paymentMethod } = get();
    return {
      customerName,
      customerMobile,
      paymentMethod,
      items: rows
        .filter(r => r.product && r.qty > 0)
        .map(r => ({ productId: r.productId, qty: r.qty })),
    };
  },
}));
