import axios from 'axios';

import { useAuthStore } from '../store';

// const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';
const BASE_URL = import.meta.env.VITE_API_URL || 'https://smart-meat-back-end.onrender.com';

const api = axios.create({
  baseURL: BASE_URL + '/api',
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT automatically
api.interceptors.request.use(config => {
  const token = localStorage.getItem('sms_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 globally
api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('sms_token');
      localStorage.removeItem('sms_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// ── Auth ─────────────────────────────────────────────────────────────────────
export const authApi = {
  login:    (data) => api.post('/auth/login', data).then(r => r.data),
  register: (data) => api.post('/auth/register', data).then(r => r.data),
  me:       ()     => api.get('/auth/me').then(r => r.data),
};

// ── Products (public + admin) ─────────────────────────────────────────────────
export const productsApi = {
  getAll:    (params) => api.get('/products', { params }).then(r => r.data),
  getById:   (id)     => api.get(`/products/${id}`).then(r => r.data),
  create:    (form)   => api.post('/products', form, { headers: { 'Content-Type': 'multipart/form-data' } }).then(r => r.data),
  update:    (id, form) => api.put(`/products/${id}`, form, { headers: { 'Content-Type': 'multipart/form-data' } }).then(r => r.data),
  delete:    (id)     => api.delete(`/products/${id}`),
  toggle:    (id)     => api.patch(`/products/${id}/toggle`).then(r => r.data),
};

// ── Categories ────────────────────────────────────────────────────────────────
export const categoriesApi = {
  getAll:    ()         => api.get('/categories').then(r => r.data),
  getAllAdmin:()         => api.get('/categories/all').then(r => r.data),
  getById:   (id)       => api.get(`/categories/${id}`).then(r => r.data),
  create:    (data)     => api.post('/categories', data).then(r => r.data),
  update:    (id, data) => api.put(`/categories/${id}`, data).then(r => r.data),
  delete:    (id)       => api.delete(`/categories/${id}`),
};

// ── Orders ────────────────────────────────────────────────────────────────────
export const ordersApi = {
  place:        (data)           => api.post('/orders', data).then(r => r.data),
  posSale:      (data)           => api.post('/orders/pos', data).then(r => r.data),
  list:         (params)         => api.get('/orders', { params }).then(r => r.data),
  myOrders:     (params)         => api.get('/orders/my', { params }).then(r => r.data),
  getById:      (id)             => api.get(`/orders/${id}`).then(r => r.data),
  updateStatus: (id, status)     => api.patch(`/orders/${id}/status`, null, { params: { status } }).then(r => r.data),
};

// ── Khata (admin only) ────────────────────────────────────────────────────────
export const khataApi = {
  getAll:        ()      => api.get('/khata').then(r => r.data),
  getLedger:     (id)    => api.get(`/khata/${id}/ledger`).then(r => r.data),
  createAccount: (data)  => api.post('/khata/accounts', data).then(r => r.data),
  createDirect:  (data)  => api.post('/khata/accounts/direct', data).then(r => r.data),
  addEntry:      (data)  => api.post('/khata/entries', data).then(r => r.data),
  summary:       ()      => api.get('/khata/summary').then(r => r.data),
};

// ── Inventory (admin only) ────────────────────────────────────────────────────
export const inventoryApi = {
  getAll:          (params) => api.get('/inventory', { params }).then(r => r.data),
  addPurchase:     (data)   => api.post('/inventory', data).then(r => r.data),
  supplierBalances:()       => api.get('/inventory/supplier-balances').then(r => r.data),
};

// ── Suppliers (admin only) ────────────────────────────────────────────────────
export const supplierApi = {
  getAll:       ()      => api.get('/suppliers').then(r => r.data),
  create:       (data)  => api.post('/suppliers', data).then(r => r.data),
  update:       (id, d) => api.put(`/suppliers/${id}`, d).then(r => r.data),
  getLedger:    (id)    => api.get(`/suppliers/${id}/ledger`).then(r => r.data),
  addEntry:     (data)  => api.post('/suppliers/ledger', data).then(r => r.data),
  getBalances:  ()      => api.get('/suppliers/balances').then(r => r.data),
  adjustBalance:(type, amount, note) => api.post('/suppliers/balances/adjust', null,
                 { params: { type, amount, note } }).then(r => r.data),
};

// ── Expenses (admin only) ─────────────────────────────────────────────────────
export const expensesApi = {
  getAll:  (params) => api.get('/expenses', { params }).then(r => r.data),
  add:     (data)   => api.post('/expenses', data).then(r => r.data),
  delete:  (id)     => api.delete(`/expenses/${id}`),
};

// ── Reports (admin only) ──────────────────────────────────────────────────────
export const reportsApi = {
  cashSheet:    (params) => api.get('/reports/cash-sheet', { params }).then(r => r.data),
  dashboard:    ()       => api.get('/reports/dashboard').then(r => r.data),
  salesSummary: (period) => api.get('/reports/sales-summary', { params: { period } }).then(r => r.data),
};

// ── Shop Settings ─────────────────────────────────────────────────────────────
export const shopApi = {
  getSettings:  ()          => api.get('/shop/settings').then(r => r.data),
  update:       (form)      => api.put('/shop/settings', form, { headers: { 'Content-Type': 'multipart/form-data' } }).then(r => r.data),
  toggleStatus: (status)    => api.patch('/shop/status', null, { params: { status } }).then(r => r.data),
};

// ── Reviews ───────────────────────────────────────────────────────────────────
export const reviewsApi = {
  getPublic: ()      => api.get('/reviews/public').then(r => r.data),
  submit:    (data)  => api.post('/reviews/submit', data).then(r => r.data),
  getAll:    ()      => api.get('/reviews').then(r => r.data),
  approve:   (id)    => api.patch(`/reviews/${id}/approve`).then(r => r.data),
  delete:    (id)    => api.delete(`/reviews/${id}`),
};


export const paymentApi = {
  createOrder: (data) =>
    api.post('/payment/create-order', data).then(r => r.data),

verifyPayment: (data) => {
  const { user } = useAuthStore.getState();
  const endpoint = user?.role === 'ADMIN'
    ? '/payment/verify-by-admin'
    : '/payment/verify';
  return api.post(endpoint, data).then(r => r.data);
},

};

// ── Users (admin only) ────────────────────────────────────────────────────────
export const usersApi = {
  getAll:    ()      => api.get('/users').then(r => r.data),
  create:    (data)  => api.post('/users', data).then(r => r.data),
  update:    (id, d) => api.put(`/users/${id}`, d).then(r => r.data),
  delete:    (id)    => api.delete(`/users/${id}`),
  changeRole:(id, r) => api.patch(`/users/${id}/role`, null, { params: { role: r } }).then(r => r.data),
};

// ── SSE stream ────────────────────────────────────────────────────────────────
export const createOrderStream = (onEvent) => {
  const token = localStorage.getItem('sms_token');
  const url = `${BASE_URL}/api/orders/stream${token ? `?token=${token}` : ''}`;
  const es = new EventSource(url);
  es.addEventListener('new_order',      e => onEvent('new_order', JSON.parse(e.data)));
  es.addEventListener('order_status',   e => onEvent('order_status', JSON.parse(e.data)));
  es.addEventListener('low_stock',      e => onEvent('low_stock', JSON.parse(e.data)));
  es.addEventListener('new_review',     e => onEvent('new_review', JSON.parse(e.data)));
  es.onerror = () => setTimeout(() => createOrderStream(onEvent), 5000); // reconnect
  return es;
};

export default api;