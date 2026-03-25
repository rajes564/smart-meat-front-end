import React, { useEffect, useState, useRef } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, ShoppingCart, ShoppingBag, Package, BookOpen, Warehouse,
  DollarSign, FileSpreadsheet, Star, Users, Settings, BarChart3,
  Bell, LogOut, Menu, X, Store, Layers, Truck, ChevronDown, ChevronRight
} from 'lucide-react';
import { useAuthStore, useNotifStore, useShopStore } from '../../store';
import { createOrderStream, shopApi } from '../../services/api';
import { clsx } from 'clsx';
import toast from 'react-hot-toast';

// Nav items — inventory is a group with sub-items
const NAV = [
  { to: '/admin/dashboard',  label: 'Dashboard',   icon: LayoutDashboard },
  { to: '/admin/new-sale',   label: 'New Sale',     icon: ShoppingBag },
  { to: '/admin/orders',     label: 'Orders',       icon: ShoppingCart, badge: true },
  { to: '/admin/products',   label: 'Products',     icon: Package },
  { to: '/admin/categories', label: 'Categories',   icon: Layers },
  {
    label: 'Inventory', icon: Warehouse, group: true,
    children: [
      { to: '/admin/inventory',          label: 'Stock & Dashboard', icon: BarChart3 },
      { to: '/admin/inventory/suppliers', label: 'Suppliers',        icon: Truck     },
    ]
  },
  { to: '/admin/khata',      label: 'Khata',        icon: BookOpen },
  { to: '/admin/expenses',   label: 'Expenses',     icon: DollarSign },
  { to: '/admin/cash-sheet', label: 'Cash Sheet',   icon: FileSpreadsheet },
  { to: '/admin/reports',    label: 'Reports',      icon: BarChart3 },
  { to: '/admin/reviews',    label: 'Reviews',      icon: Star },
  { to: '/admin/users',      label: 'Users',        icon: Users },
  { to: '/admin/settings',   label: 'Settings',     icon: Settings },
];

// ── Collapsible nav group (for Inventory dropdown) ───────────────────────────
function NavGroup({ item, unread, onClose }) {
  const location = useLocation();
  const isChildActive = item.children?.some(c => location.pathname.startsWith(c.to));
  const [open, setOpen] = useState(isChildActive);

  return (
    <div>
      {/* Group header button */}
      <button
        onClick={() => setOpen(o => !o)}
        className={clsx(
          'w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all',
          isChildActive
            ? 'bg-brand-50 text-brand-600 font-semibold'
            : 'text-stone-500 hover:bg-stone-100 hover:text-stone-800'
        )}
      >
        <item.icon size={16} />
        <span className="flex-1 text-left">{item.label}</span>
        {open
          ? <ChevronDown size={13} className="flex-shrink-0" />
          : <ChevronRight size={13} className="flex-shrink-0" />}
      </button>

      {/* Children */}
      {open && (
        <div className="ml-3 pl-3 border-l border-stone-200 mt-0.5 space-y-0.5">
          {item.children.map(child => (
            <NavLink
              key={child.to}
              to={child.to}
              end
              onClick={onClose}
              className={({ isActive }) => clsx(
                'flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                isActive
                  ? 'bg-brand-50 text-brand-600 font-semibold'
                  : 'text-stone-400 hover:bg-stone-100 hover:text-stone-700'
              )}
            >
              <child.icon size={13} />
              {child.label}
            </NavLink>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifOpen,   setNotifOpen]   = useState(false);
  const { user, logout }              = useAuthStore();
  const { notifications, unread, push, markAllRead } = useNotifStore();
  const { settings, updateStatus }    = useShopStore();
  const navigate  = useNavigate();
  const esRef     = useRef(null);

  // Lock body scroll while admin panel is mounted — prevents the page-level
  // scrollbar that conflicts with the <main> scroll inside the layout.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
      document.documentElement.style.overflow = '';
    };
  }, []);

  // SSE — real-time events
  useEffect(() => {
    esRef.current = createOrderStream((eventName, data) => {
      if (eventName === 'new_order') {
        push({
          id: Date.now(), type: 'order',
          title: `🛒 New Order ${data.orderNumber}`,
          sub:   `${data.customerName} · ₹${data.total}`,
          time:  new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
          data,
        });
        toast.success(`New order: ${data.orderNumber}`, { icon: '🛒', duration: 5000 });
      } else if (eventName === 'low_stock') {
        push({
          id: Date.now(), type: 'stock',
          title: `⚠ Low Stock: ${data.name}`,
          sub:   `Only ${data.stockQty} kg left`,
          time:  new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
          data,
        });
        toast(`Low stock: ${data.name}`, { icon: '⚠', style: { background: '#fff6e0', color: '#9a5c00' } });
      } else if (eventName === 'new_review') {
        push({
          id: Date.now(), type: 'review',
          title: `⭐ New ${data.rating}-star Review`,
          sub:   data.name || 'Customer',
          time:  new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
        });
      }
    });
    return () => esRef.current?.close();
  }, []);

  const handleLogout = () => { logout(); navigate('/'); };

  return (
    /*
     * Layout architecture (single-scroll design):
     *
     *  ┌─────────────────────────────────────────────────┐  ← h-screen, overflow:hidden
     *  │  <aside> fixed height, internal nav scroll      │
     *  │  <div flex-col>                                  │
     *  │    <header> flex-shrink-0 (never shrinks)       │
     *  │    <main>   flex-1 overflow-y-auto  ← ONLY scroll│
     *  │  </div>                                          │
     *  └─────────────────────────────────────────────────┘
     *
     *  The aside is position:sticky on desktop (in document flow, no fixed).
     *  overflow:hidden on the root prevents the body from scrolling at all.
     */
    <div
      className="flex font-sans bg-[#faf6f1]"
      style={{ height: '100vh', overflow: 'hidden' }}
    >
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar ──────────────────────────────────────────────────────────
       *  Mobile: fixed, slides in from left
       *  Desktop (lg): sticky in document flow — NOT fixed, so main fills
       *  the remaining width correctly without any gap or double scroll
       */}
      <aside
        className={clsx(
          // shared
          'w-56 flex-shrink-0 bg-white border-r border-stone-200 flex flex-col',
          // desktop: sticky, always visible, full viewport height
          'lg:sticky lg:top-0 lg:h-screen lg:translate-x-0',
          // mobile: fixed overlay, toggled
          'fixed inset-y-0 left-0 z-40 h-full transition-transform duration-300',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Logo */}
        <div className="p-4 border-b border-stone-200 flex items-center justify-between flex-shrink-0">
          <div>
            <p className="font-display text-base font-bold text-stone-900">🥩 Smart Meat</p>
            <p className="text-[10px] text-stone-400">Admin Panel</p>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-stone-400 hover:text-stone-700"
          >
            <X size={18} />
          </button>
        </div>

        {/* Nav — scrolls only within the sidebar if many items */}
        <nav className="flex-1 p-2 overflow-y-auto space-y-0.5">
          {NAV.map((item) => {
            if (item.group) {
              return (
                <NavGroup
                  key={item.label}
                  item={item}
                  unread={unread}
                  onClose={() => setSidebarOpen(false)}
                />
              );
            }
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) => clsx(
                  'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all',
                  isActive
                    ? 'bg-brand-50 text-brand-600 font-semibold'
                    : 'text-stone-500 hover:bg-stone-100 hover:text-stone-800'
                )}
              >
                <item.icon size={16} />
                {item.label}
                {item.label === 'Orders' && unread > 0 && (
                  <span className="ml-auto bg-brand-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                    {Math.min(unread, 9)}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Shop status toggle */}
        <div className="p-3 border-t border-stone-200 flex-shrink-0">
          <button
            onClick={async () => {
              const next = settings?.status === 'OPEN' ? 'CLOSED' : 'OPEN';
              await shopApi.toggleStatus(next);
              updateStatus(next);
              toast.success(`Shop ${next}`);
            }}
            className={clsx(
              'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-all',
              settings?.status === 'OPEN'
                ? 'bg-green-light text-green-shop hover:bg-green-100'
                : 'bg-red-50 text-red-600 hover:bg-red-100'
            )}
          >
            <Store size={14} />
            Shop: {settings?.status || 'OPEN'}
          </button>
        </div>
      </aside>

      {/* ── Right column (topbar + content) ─────────────────────────────────
       *  flex-col, takes remaining width, never overflows horizontally.
       *  overflow:hidden here ensures only <main> scrolls, not this column.
       */}
      <div
        className="flex-1 flex flex-col min-w-0"
        style={{ height: '100vh', overflow: 'hidden' }}
      >
        {/* Topbar — fixed height, never shrinks */}
        <header className="flex-shrink-0 bg-white border-b border-stone-200 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-stone-500 hover:text-stone-800"
            >
              <Menu size={20} />
            </button>
          </div>

          <div className="flex items-center gap-3">
            {/* Notification bell */}
            <div className="relative">
              <button
                onClick={() => { setNotifOpen(o => !o); markAllRead(); }}
                className="relative p-2 rounded-lg hover:bg-stone-100 text-stone-500 hover:text-stone-800 transition"
              >
                <Bell size={18} />
                {unread > 0 && (
                  <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-brand-500 rounded-full border-2 border-white" />
                )}
              </button>

              {notifOpen && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-stone-200 rounded-xl shadow-card-hover z-50 overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-stone-100">
                    <span className="text-sm font-semibold text-stone-800">Notifications</span>
                    <button onClick={() => setNotifOpen(false)} className="text-stone-400 hover:text-stone-700">
                      <X size={14} />
                    </button>
                  </div>
                  <div className="max-h-72 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="py-8 text-center text-stone-400 text-sm">No notifications</div>
                    ) : notifications.map(n => (
                      <div key={n.id} className="px-4 py-3 border-b border-stone-100 hover:bg-stone-50 cursor-pointer">
                        <p className="text-sm font-medium text-stone-800">{n.title}</p>
                        <p className="text-xs text-stone-500 mt-0.5">{n.sub}</p>
                        <p className="text-[10px] text-stone-400 mt-1">{n.time}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* User avatar */}
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-brand-100 flex items-center justify-center text-brand-600 text-xs font-bold">
                {user?.name?.[0] || 'A'}
              </div>
              <span className="text-sm font-medium text-stone-700 hidden sm:block">{user?.name}</span>
            </div>

            <button
              onClick={handleLogout}
              className="p-2 rounded-lg hover:bg-stone-100 text-stone-400 hover:text-brand-500 transition"
            >
              <LogOut size={16} />
            </button>
          </div>
        </header>

        {/* ── Page content ── THE ONLY SCROLLABLE ELEMENT ─────────────────
         *  flex-1 → fills all remaining height after topbar
         *  overflow-y-auto → scrolls when content is taller than viewport
         *  All admin pages (Settings, Dashboard, etc.) render here via <Outlet>
         */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}