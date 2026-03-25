import React, { useEffect, Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './store';
import { shopApi } from './services/api';
import { useShopStore } from './store';

// ── Lazy imports ──────────────────────────────────────────────────────────────
const HomePage       = lazy(() => import('./pages/HomePage'));
const LoginPage      = lazy(() => import('./pages/LoginPage'));
const RegisterPage   = lazy(() => import('./pages/RegisterPage'));
const OrderStatusPage= lazy(() => import('./pages/OrderStatusPage'));

// Admin pages
const AdminLayout    = lazy(() => import('./pages/admin/AdminLayout'));
const Dashboard      = lazy(() => import('./pages/admin/Dashboard'));
const ProductsAdmin  = lazy(() => import('./pages/admin/ProductsAdmin'));
const CategoriesAdmin= lazy(() => import('./pages/admin/CategoriesAdmin'));
const AdminNewSale   = lazy(() => import('./pages/admin/NewSale'));
const OrdersAdmin    = lazy(() => import('./pages/admin/Orders'));
const KhataAdmin     = lazy(() => import('./pages/admin/Khata'));
const InventoryAdmin = lazy(() => import('./pages/admin/Inventory'));
const ExpensesAdmin  = lazy(() => import('./pages/admin/Expenses'));
const CashSheet      = lazy(() => import('./pages/admin/CashSheet'));
const ReviewsAdmin   = lazy(() => import('./pages/admin/Reviews'));
const UsersAdmin     = lazy(() => import('./pages/admin/Users'));
const ShopSettings   = lazy(() => import('./pages/admin/ShopSettings'));
const ReportsAdmin   = lazy(() => import('./pages/admin/Reports'));

// Seller pages
const SellerLayout   = lazy(() => import('./pages/seller/SellerLayout'));
const NewSale        = lazy(() => import('./pages/seller/NewSale'));

// ── Guards ────────────────────────────────────────────────────────────────────
function RequireAuth({ roles }) {
  const { user, token } = useAuthStore();
  if (!token) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user?.role)) return <Navigate to="/" replace />;
  return <Outlet />;
}

// ── Loading spinner ───────────────────────────────────────────────────────────
function PageLoader() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-[#f5eeea] z-50">
      <div className="text-center">
        <div className="flex gap-2 justify-center mb-4">
          {['🐟', '🍗', '🥩'].map((e, i) => (
            <span key={i} className="text-5xl animate-bounce" style={{ animationDelay: `${i * 0.2}s` }}>{e}</span>
          ))}
        </div>
        <p className="font-display text-2xl font-bold text-stone-800">Smart Meat Shop</p>
        <p className="text-sm text-stone-500 mt-1">Loading…</p>
      </div>
    </div>
  );
}

// ── App ───────────────────────────────────────────────────────────────────────
export default function App() {
  const setSettings = useShopStore(s => s.setSettings);

  // Load shop settings on startup
  useEffect(() => {
    shopApi.getSettings().then(setSettings).catch(console.warn);
  }, []);

  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3500,
          style: { fontFamily: '"DM Sans", sans-serif', fontSize: '14px' },
          success: { style: { background: '#e6f7ee', color: '#16713f', border: '1px solid #b0e4c8' } },
          error:   { style: { background: '#fdf1ec', color: '#b83a12', border: '1px solid #f4b8a0' } },
        }}
      />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Public */}
          <Route path="/"           element={<HomePage />} />
          <Route path="/login"      element={<LoginPage />} />
          <Route path="/register"   element={<RegisterPage />} />
          <Route path="/order/:id"  element={<OrderStatusPage />} />

          {/* Admin routes */}
          <Route element={<RequireAuth roles={['ADMIN']} />}>
            <Route path="/admin" element={<AdminLayout />}>
              <Route index               element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard"    element={<Dashboard />} />
              <Route path="new-sale"     element={<AdminNewSale />} />
              <Route path="products"     element={<ProductsAdmin />} />
              <Route path="categories"   element={<CategoriesAdmin />} />
              <Route path="orders"       element={<OrdersAdmin />} />
              <Route path="khata"        element={<KhataAdmin />} />
              <Route path="inventory"    element={<InventoryAdmin />} />
              <Route path="inventory/suppliers" element={<InventoryAdmin />} />
              <Route path="expenses"     element={<ExpensesAdmin />} />
              <Route path="cash-sheet"   element={<CashSheet />} />
              <Route path="reviews"      element={<ReviewsAdmin />} />
              <Route path="users"        element={<UsersAdmin />} />
              <Route path="settings"     element={<ShopSettings />} />
              <Route path="reports"      element={<ReportsAdmin />} />
            </Route>
          </Route>

          {/* Seller routes — only New Sale */}
          <Route element={<RequireAuth roles={['SELLER', 'ADMIN']} />}>
            <Route path="/seller" element={<SellerLayout />}>
              <Route index            element={<Navigate to="new-sale" replace />} />
              <Route path="new-sale"  element={<NewSale />} />
            </Route>
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}