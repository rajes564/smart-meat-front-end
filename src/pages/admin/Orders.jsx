import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { ordersApi } from '../../services/api';
import { useNotifStore } from '../../store';
import { CheckCircle, XCircle, Package, RefreshCw, Search } from 'lucide-react';
import { clsx } from 'clsx';
import toast from 'react-hot-toast';

const STATUS_COLORS = {
  PENDING:   'bg-amber-light text-amber-shop border-amber-200',
  ACCEPTED:  'bg-blue-50 text-blue-600 border-blue-200',
  PREPARING: 'bg-purple-50 text-purple-600 border-purple-200',
  READY:     'bg-green-light text-green-shop border-green-200',
  COLLECTED: 'bg-stone-100 text-stone-400 border-stone-200',
  CANCELLED: 'bg-red-50 text-red-400 border-red-200',
};

const STATUS_NEXT = {
  PENDING:   ['ACCEPTED', 'CANCELLED'],
  ACCEPTED:  ['PREPARING', 'CANCELLED'],
  PREPARING: ['READY'],
  READY:     ['COLLECTED'],
};

function OrderCard({ order, onStatusChange }) {
  const isNew = order.status === 'PENDING';

  const timeSince = (dateStr) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    return `${Math.floor(mins / 60)}h ${mins % 60}m ago`;
  };

  return (
    <div
      style={isNew ? { animation: 'orderSlideIn 0.4s ease both' } : {}}
      className={clsx(
        'bg-white rounded-2xl border shadow-card hover:shadow-card-hover transition-shadow overflow-hidden',
        isNew ? 'border-brand-200 ring-1 ring-brand-100' : 'border-stone-200'
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between px-4 pt-4 pb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-sm font-bold text-stone-800">{order.orderNumber}</span>
            {order.onlineOrder && (
              <span className="text-[10px] font-bold bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">
                🌐 Online
              </span>
            )}
          </div>
          <p className="text-sm font-semibold text-stone-700">{order.customerName}</p>
          <p className="text-xs text-stone-400">
            {order.customerMobile} · {timeSince(order.createdAt)}
          </p>
        </div>
        <span className={clsx('text-xs font-bold px-2.5 py-1 rounded-full border flex-shrink-0', STATUS_COLORS[order.status])}>
          {order.status}
        </span>
      </div>

      {/* Items + amount */}
      <div className="px-4 pb-3 border-b border-stone-100">
        <div className="flex flex-wrap gap-1.5 mb-2">
          {order.items?.map((item, i) => (
            <span key={i} className="text-xs bg-stone-50 border border-stone-200 text-stone-600 px-2 py-1 rounded-lg">
              {item.productName} {item.qty}kg
            </span>
          ))}
        </div>
        <div className="flex items-center justify-between">
          <span className="text-base font-bold text-stone-900">
            ₹{Number(order.total).toLocaleString('en-IN')}
          </span>
          <span className={clsx(
            'text-xs font-semibold px-2 py-0.5 rounded-full',
            order.paymentMethod === 'CASH' ? 'bg-green-light text-green-shop' :
            order.paymentMethod === 'UPI'  ? 'bg-blue-50 text-blue-600' :
            order.paymentMethod === 'CARD' ? 'bg-purple-50 text-purple-600' :
            'bg-amber-light text-amber-shop'
          )}>
            {order.paymentMethod}
          </span>
        </div>
        {order.onlineOrder && (
          <div className="mt-2 flex items-center gap-1.5 text-xs text-green-shop bg-green-light rounded-lg px-2.5 py-1.5">
            <Package size={11} />
            <span className="font-medium">Dispatch Collection — customer will pick up</span>
          </div>
        )}
      </div>

      {/* Action buttons */}
      {STATUS_NEXT[order.status] && (
        <div className="flex gap-2 p-3">
          {STATUS_NEXT[order.status].map(next => (
            <button
              key={next}
              onClick={() => onStatusChange(order.id, next)}
              className={clsx(
                'flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition',
                next === 'CANCELLED'
                  ? 'bg-red-50 text-red-500 hover:bg-red-100'
                  : next === 'COLLECTED'
                  ? 'bg-green-light text-green-shop hover:bg-green-100'
                  : 'bg-brand-500 text-white hover:bg-brand-600'
              )}
            >
              {next === 'CANCELLED'  && <><XCircle size={12} />   Reject</>}
              {next === 'ACCEPTED'   && <><CheckCircle size={12} /> Accept</>}
              {next === 'PREPARING'  && <><Package size={12} />    Start Prep</>}
              {next === 'READY'      && <><CheckCircle size={12} /> Mark Ready</>}
              {next === 'COLLECTED'  && <><CheckCircle size={12} /> Collected</>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function OrdersAdmin() {
  const [statusFilter, setStatusFilter] = useState('active');
  const [search, setSearch] = useState('');
  const qc = useQueryClient();
  const { notifications } = useNotifStore();

  const { data: ordersPage, isLoading } = useQuery(
    ['orders', statusFilter],
    () => ordersApi.list(
      statusFilter !== 'all' && statusFilter !== 'active' ? { status: statusFilter } : {}
    ),
    { refetchInterval: 10000 }
  );

  const statusMutation = useMutation(
    ({ id, status }) => ordersApi.updateStatus(id, status),
    {
      onSuccess: (updated) => {
        qc.invalidateQueries('orders');
        const labels = {
          ACCEPTED:  'Order accepted!',
          PREPARING: 'Preparing now…',
          READY:     'Order ready for pickup! 📦',
          COLLECTED: 'Collected ✓',
          CANCELLED: 'Order cancelled',
        };
        toast.success(labels[updated.status] || 'Status updated');
      },
      onError: (e) => toast.error(e.response?.data?.message || 'Failed to update status'),
    }
  );

  const newOrderCount = notifications.filter(
    n => n.type === 'order' && n.data?.status === 'PENDING'
  ).length;

  const allOrders = ordersPage?.content || ordersPage || [];

  const filtered = allOrders.filter(o => {
    if (statusFilter === 'active') {
      return ['PENDING', 'ACCEPTED', 'PREPARING', 'READY'].includes(o.status);
    }
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      o.customerName?.toLowerCase().includes(q) ||
      o.orderNumber?.toLowerCase().includes(q) ||
      o.customerMobile?.includes(q)
    );
  });

  const counts = allOrders.reduce((acc, o) => {
    acc[o.status] = (acc[o.status] || 0) + 1;
    return acc;
  }, {});

  const FILTERS = [
    { key: 'active',    label: 'Active'    },
    { key: 'PENDING',   label: 'Pending'   },
    { key: 'ACCEPTED',  label: 'Accepted'  },
    { key: 'PREPARING', label: 'Preparing' },
    { key: 'READY',     label: 'Ready'     },
    { key: 'COLLECTED', label: 'Collected' },
    { key: 'CANCELLED', label: 'Cancelled' },
    { key: 'all',       label: 'All'       },
  ];

  return (
    <div className="space-y-4">

      {/* Page header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-lg font-bold text-stone-800">Orders</h1>
          <p className="text-sm text-stone-400">
            {allOrders.length} total · {counts.PENDING || 0} pending
          </p>
        </div>
        <div className="flex items-center gap-2">
          {newOrderCount > 0 && (
            <div className="flex items-center gap-2 bg-brand-50 border border-brand-200 rounded-xl px-3 py-1.5">
              <span className="text-brand-500 font-bold text-sm animate-pulse">
                {newOrderCount} new order{newOrderCount > 1 ? 's' : ''}!
              </span>
              <button onClick={() => setStatusFilter('PENDING')} className="text-xs text-brand-600 underline">
                View
              </button>
            </div>
          )}
          <button
            onClick={() => qc.invalidateQueries('orders')}
            className="p-2 rounded-lg hover:bg-stone-100 text-stone-400 hover:text-stone-700 transition"
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Pending',   key: 'PENDING',   cls: 'bg-amber-light text-amber-shop'  },
          { label: 'Preparing', key: 'PREPARING',  cls: 'bg-blue-50 text-blue-600'        },
          { label: 'Ready',     key: 'READY',      cls: 'bg-green-light text-green-shop'  },
          { label: 'Today',     key: '_today',     cls: 'bg-brand-50 text-brand-500'      },
        ].map(({ label, key, cls }) => (
          <div key={key} className={clsx('rounded-xl border border-stone-200 shadow-card p-3 text-center', cls)}>
            <p className="text-xs text-stone-500 mb-1">{label}</p>
            <p className="text-2xl font-bold">
              {key === '_today' ? allOrders.length : (counts[key] || 0)}
            </p>
          </div>
        ))}
      </div>

      {/* Filters + Search bar */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-card p-3 flex flex-col sm:flex-row gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Search size={14} className="text-stone-400 flex-shrink-0" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, order #, or mobile…"
            className="flex-1 text-sm text-stone-700 placeholder:text-stone-300 outline-none bg-transparent min-w-0"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {FILTERS.map(f => (
            <button
              key={f.key}
              onClick={() => setStatusFilter(f.key)}
              className={clsx(
                'px-2.5 py-1 rounded-lg text-xs font-semibold transition whitespace-nowrap',
                statusFilter === f.key
                  ? 'bg-brand-500 text-white'
                  : 'bg-stone-100 text-stone-500 hover:bg-stone-200'
              )}
            >
              {f.label}{counts[f.key] ? ` (${counts[f.key]})` : ''}
            </button>
          ))}
        </div>
      </div>

      {/* Orders grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array(6).fill(0).map((_, i) => (
            <div key={i} className="bg-stone-100 rounded-2xl h-48 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-stone-200 text-stone-400">
          <p className="text-4xl mb-3">📋</p>
          <p className="text-sm font-medium">No orders found</p>
          <p className="text-xs mt-1">Orders appear here as customers place them</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(order => (
            <OrderCard
              key={order.id}
              order={order}
              onStatusChange={(id, status) => statusMutation.mutate({ id, status })}
            />
          ))}
        </div>
      )}

      {/* Pure CSS keyframe — no GSAP involved */}
      <style>{`
        @keyframes orderSlideIn {
          from { opacity: 0; transform: translateY(-10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}