import React from 'react';
import { useQuery } from 'react-query';
import { reportsApi, ordersApi, supplierApi } from '../../services/api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { TrendingUp, ShoppingCart, DollarSign, AlertTriangle, Package, Banknote, CreditCard, Wallet } from 'lucide-react';
import { clsx } from 'clsx';
import { Link } from 'react-router-dom';

// ── CSS-only staggered fade-in — no GSAP, no opacity-stuck bug ───────────────
const fadeUpStyle = (delayMs = 0) => ({
  animation: `dashFadeUp 0.45s ease both`,
  animationDelay: `${delayMs}ms`,
});

// ── Metric card ───────────────────────────────────────────────────────────────
function MetricCard({ label, value, sub, icon: Icon, color = 'brand', trend, delay = 0 }) {
  const colors = {
    brand: { bg: 'bg-brand-50',    text: 'text-brand-600',  border: 'border-brand-100' },
    green: { bg: 'bg-green-light', text: 'text-green-shop', border: 'border-green-200' },
    amber: { bg: 'bg-amber-light', text: 'text-amber-shop', border: 'border-amber-200' },
    blue:  { bg: 'bg-blue-50',     text: 'text-blue-600',   border: 'border-blue-100'  },
  };
  const c = colors[color] || colors.brand;

  return (
    <div
      style={fadeUpStyle(delay)}
      className={clsx(
        'bg-white rounded-xl border p-4 shadow-card relative overflow-hidden',
        c.border
      )}
    >
      {/* Top colour strip */}
      <div className={clsx('absolute top-0 left-0 right-0 h-0.5', c.text.replace('text-', 'bg-'))} />

      <div className="flex items-start justify-between mb-3">
        <p className="text-xs font-semibold text-stone-400 uppercase tracking-wide">{label}</p>
        <div className={clsx('w-8 h-8 rounded-lg flex items-center justify-center', c.bg)}>
          <Icon size={15} className={c.text} />
        </div>
      </div>

      <p className="text-2xl font-bold text-stone-900 font-mono">{value}</p>
      {sub && <p className="text-xs text-stone-400 mt-1">{sub}</p>}
      {trend && (
        <p className={clsx('text-xs font-medium mt-1', trend > 0 ? 'text-green-shop' : 'text-brand-500')}>
          {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}% vs last month
        </p>
      )}
    </div>
  );
}

// ── Status badge colours ──────────────────────────────────────────────────────
const STATUS_COLORS = {
  PENDING:   'bg-amber-light text-amber-shop',
  ACCEPTED:  'bg-blue-50 text-blue-600',
  PREPARING: 'bg-purple-50 text-purple-600',
  READY:     'bg-green-light text-green-shop',
  COLLECTED: 'bg-stone-100 text-stone-500',
  CANCELLED: 'bg-red-50 text-red-500',
};

// ── Dashboard ─────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const { data: dash, isLoading } = useQuery('dashboard', reportsApi.dashboard, {
    refetchInterval: 30000,
    staleTime: 15000,
  });

  const { data: balances } = useQuery('shop-balances', supplierApi.getBalances, {
    staleTime: 30000,
  });

  const cashBalance    = Number(balances?.cashBalance    || 0);
  const accountBalance = Number(balances?.accountBalance || 0);

  const fmt = (n) => '₹' + Number(n || 0).toLocaleString('en-IN');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center space-y-2">
          <div className="w-8 h-8 border-2 border-brand-400 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-stone-400">Loading dashboard…</p>
        </div>
      </div>
    );
  }

  const weeklyData = (dash?.weeklyChart || []).map(d => ({
    day:   new Date(d.day).toLocaleDateString('en-IN', { weekday: 'short' }),
    sales: Number(d.total),
  }));

  return (
    <div className="space-y-5">

      {/* ── Cash & Account Balance strip ── */}
      <div
        style={fadeUpStyle(0)}
        className="grid grid-cols-1 sm:grid-cols-3 gap-3"
      >
        {/* Cash balance */}
        <div className="bg-white rounded-xl border border-green-200 shadow-card p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-green-light rounded-xl flex items-center justify-center flex-shrink-0">
            <Banknote size={18} className="text-green-shop" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-stone-400 uppercase tracking-wide">Cash Balance</p>
            <p className="text-xl font-bold text-green-shop font-mono">₹{cashBalance.toLocaleString('en-IN')}</p>
          </div>
        </div>

        {/* Account balance */}
        <div className="bg-white rounded-xl border border-blue-200 shadow-card p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
            <CreditCard size={18} className="text-blue-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-stone-400 uppercase tracking-wide">Account / UPI</p>
            <p className="text-xl font-bold text-blue-500 font-mono">₹{accountBalance.toLocaleString('en-IN')}</p>
          </div>
        </div>

        {/* Total */}
        <div className="bg-gradient-to-r from-stone-800 to-stone-700 rounded-xl shadow-card p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center flex-shrink-0">
            <Wallet size={18} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-white/60 uppercase tracking-wide">Total Balance</p>
            <p className="text-xl font-bold text-white font-mono">₹{(cashBalance + accountBalance).toLocaleString('en-IN')}</p>
            <Link to="/admin/inventory" className="text-[10px] text-white/40 hover:text-white/70 transition">
              Manage balances →
            </Link>
          </div>
        </div>
      </div>

      {/* ── Metric cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard
          delay={0}   label="Today's Sales"  value={fmt(dash?.todaySales)}
          sub={`${dash?.todayTransactions || 0} transactions`}
          icon={ShoppingCart} color="brand"
        />
        <MetricCard
          delay={60}  label="Month Sales"    value={fmt(dash?.monthSales)}
          sub="This month" icon={TrendingUp} color="green" trend={12}
        />
        <MetricCard
          delay={120} label="Net Profit"     value={fmt(dash?.netProfit)}
          sub="Margin ~24%" icon={DollarSign} color="green"
        />
        <MetricCard
          delay={180} label="Khata Due"      value={fmt(dash?.totalKhataDue)}
          sub={`${dash?.pendingOrders || 0} pending orders`}
          icon={AlertTriangle} color="amber"
        />
      </div>

      {/* ── Chart + Low stock ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Weekly sales chart */}
        <div
          style={fadeUpStyle(240)}
          className="lg:col-span-2 bg-white rounded-xl border border-stone-200 shadow-card p-5"
        >
          <p className="text-sm font-semibold text-stone-700 mb-4">Sales this week</p>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={weeklyData} barSize={28}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0ece8" vertical={false} />
              <XAxis
                dataKey="day"
                tick={{ fontSize: 11, fill: '#a08060' }}
                axisLine={false} tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#a08060' }}
                axisLine={false} tickLine={false}
                tickFormatter={v => v >= 1000 ? `₹${(v / 1000).toFixed(0)}k` : `₹${v}`}
              />
              <Tooltip
                formatter={v => [`₹${Number(v).toLocaleString('en-IN')}`, 'Sales']}
                contentStyle={{ borderRadius: '8px', border: '1px solid #ede3d6', fontSize: '12px' }}
              />
              <Bar dataKey="sales" fill="#e05528" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Low stock alert */}
        <div
          style={fadeUpStyle(300)}
          className="bg-white rounded-xl border border-stone-200 shadow-card p-5"
        >
          <p className="text-sm font-semibold text-stone-700 mb-3 flex items-center gap-2">
            <Package size={15} className="text-amber-shop" /> Low Stock Alert
          </p>
          <div className="space-y-2">
            {(dash?.lowStockProducts || []).map(p => (
              <div
                key={p.id}
                className="flex items-center justify-between py-2 border-b border-stone-100 last:border-0"
              >
                <div>
                  <p className="text-sm font-medium text-stone-700">{p.name}</p>
                  <p className="text-xs text-stone-400">{p.categoryName}</p>
                </div>
                <span className={clsx(
                  'text-xs font-bold px-2 py-1 rounded-full',
                  p.stockStatus === 'OUT_OF_STOCK'
                    ? 'bg-red-50 text-red-500'
                    : 'bg-amber-light text-amber-shop'
                )}>
                  {p.stockQty} kg
                </span>
              </div>
            ))}
            {!dash?.lowStockProducts?.length && (
              <p className="text-xs text-stone-400 py-4 text-center">All products well-stocked ✓</p>
            )}
          </div>
        </div>
      </div>

      {/* ── Recent transactions table ── */}
      <div
        style={fadeUpStyle(360)}
        className="bg-white rounded-xl border border-stone-200 shadow-card overflow-hidden"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100">
          <p className="text-sm font-semibold text-stone-700">Recent Transactions</p>
          <a href="/admin/orders" className="text-xs text-brand-500 hover:text-brand-700 font-medium">
            View all →
          </a>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-stone-50 text-left">
                {['Order', 'Customer', 'Amount', 'Status', 'Type'].map(h => (
                  <th key={h} className="px-4 py-3 text-xs font-semibold text-stone-400 uppercase tracking-wide first:px-5">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(dash?.recentOrders || []).map(o => (
                <tr key={o.id} className="border-t border-stone-100 hover:bg-stone-50 transition">
                  <td className="px-5 py-3 font-mono text-xs text-stone-600">{o.orderNumber}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-stone-800">{o.customerName}</p>
                    <p className="text-xs text-stone-400">{o.customerMobile}</p>
                  </td>
                  <td className="px-4 py-3 font-bold text-stone-800">
                    ₹{Number(o.total).toLocaleString('en-IN')}
                  </td>
                  <td className="px-4 py-3">
                    <span className={clsx(
                      'text-xs font-semibold px-2 py-1 rounded-full',
                      STATUS_COLORS[o.status] || 'bg-stone-100 text-stone-500'
                    )}>
                      {o.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {o.onlineOrder
                      ? <span className="text-xs font-semibold px-2 py-1 rounded-full bg-blue-50 text-blue-600">🌐 Online</span>
                      : <span className="text-xs font-semibold px-2 py-1 rounded-full bg-stone-100 text-stone-500">POS</span>
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {!dash?.recentOrders?.length && (
            <p className="text-center py-8 text-sm text-stone-400">No transactions yet today</p>
          )}
        </div>
      </div>

      {/* Keyframe — defined once here, scoped to this page */}
      <style>{`
        @keyframes dashFadeUp {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0);    }
        }
      `}</style>

    </div>
  );
}