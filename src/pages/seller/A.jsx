import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { productsApi, categoriesApi, ordersApi } from '../../services/api';
import { usePosStore } from '../../store';
import { Plus, Printer, RotateCcw, ShoppingBag, Search, X } from 'lucide-react';
import { clsx } from 'clsx';
import toast from 'react-hot-toast';

// ── Receipt Modal ─────────────────────────────────────────────────────────────
function ReceiptModal({ order, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden">
        <div className="bg-gradient-to-br from-brand-500 to-brand-400 p-5 text-white text-center">
          <div className="text-3xl mb-1">✓</div>
          <h2 className="font-display text-xl font-bold">Sale Complete!</h2>
          <p className="text-sm opacity-80 mt-0.5 font-mono">#{order.orderNumber}</p>
        </div>
        <div className="p-5 space-y-3">
          <div className="space-y-1.5">
            {order.items?.map((item, i) => (
              <div key={i} className="flex justify-between text-sm">
                <span className="text-stone-600">{item.productName} × {item.qty}kg</span>
                <span className="font-semibold text-stone-800">
                  ₹{Number(item.total).toLocaleString('en-IN')}
                </span>
              </div>
            ))}
          </div>
          <div className="border-t border-stone-200 pt-3 flex justify-between">
            <span className="font-bold text-stone-800">Total</span>
            <span className="font-bold text-brand-500 text-lg">
              ₹{Number(order.total).toLocaleString('en-IN')}
            </span>
          </div>
          <div className="text-xs text-stone-400 flex justify-between">
            <span>{order.customerName} · {order.customerMobile}</span>
            <span>{order.paymentMethod}</span>
          </div>
        </div>
        <div className="flex gap-3 px-5 pb-5">
          <button
            onClick={() => window.print()}
            className="flex-1 flex items-center justify-center gap-1.5 border border-stone-200 rounded-xl py-2.5 text-sm font-medium text-stone-600 hover:bg-stone-50"
          >
            <Printer size={14} /> Print
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-brand-500 text-white rounded-xl py-2.5 text-sm font-semibold hover:bg-brand-600"
          >
            New Sale →
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Seller POS — two-column layout, fits 100vh, no page scroll ────────────────
//
//  ┌─────────────────────────────────┬──────────────────┐
//  │  LEFT: Customer + Products      │  RIGHT: Live Bill │
//  │        + Payment                │  (added items)    │
//  └─────────────────────────────────┴──────────────────┘
//
export default function NewSale() {
  const {
    rows, customerName, customerMobile, paymentMethod,
    addRow, removeRow, updateRow, setField, reset, total, toPayload,
  } = usePosStore();

  const [receipt,       setReceipt]       = useState(null);
  const [productSearch, setProductSearch] = useState('');
  const [catFilter,     setCatFilter]     = useState('all');
  const [payMode,       setPayMode]       = useState('CASH');  // CASH|UPI|CARD|SPLIT
  const [cashAmt,       setCashAmt]       = useState('');
  const [upiAmt,        setUpiAmt]        = useState('');

  const qc = useQueryClient();

  const { data: products = [] } = useQuery(
    'products-pos',
    () => productsApi.getAll({ status: 'available' }),
    { staleTime: 60000 }
  );

  const { data: categories = [] } = useQuery(
    'categories-pos',
    categoriesApi.getAll,
    { staleTime: 300000 }
  );

  const saleMutation = useMutation(
    (payload) => ordersApi.posSale(payload),
    {
      onSuccess: (data) => {
        setReceipt(data);
        reset();
        setCashAmt('');
        setUpiAmt('');
        setPayMode('CASH');
        qc.invalidateQueries('products-pos');
      },
      onError: (e) => toast.error(e.response?.data?.message || 'Sale failed'),
    }
  );

  // Click a product tile → add to bill instantly
  const quickAdd = (product) => {
    const existing = rows.find(r => r.productId === product.id);
    if (existing) {
      updateRow(existing.id, {
        qty: parseFloat((existing.qty + (product.orderStep || 0.5)).toFixed(3)),
      });
      toast.success(`+${product.orderStep || 0.5}kg — ${product.name}`, { duration: 700 });
      return;
    }
    const emptyRow = rows.find(r => !r.product);
    const payload  = { productId: product.id, product, qty: product.minOrderQty || 0.5 };
    if (emptyRow) {
      updateRow(emptyRow.id, payload);
    } else {
      usePosStore.setState(s => ({
        rows: [...s.rows, { id: Date.now(), ...payload }],
      }));
    }
    toast.success(`${product.categoryIcon || '🥩'} ${product.name} added`, { duration: 700 });
  };

  // Dropdown row → change product
  const handleProductChange = (rowId, productId) => {
    const product = products.find(p => String(p.id) === String(productId));
    updateRow(rowId, { productId: product?.id, product, qty: product?.minOrderQty || 0.5 });
  };

  const handleSubmit = () => {
    if (!customerMobile || customerMobile.length < 10) {
      toast.error('Enter valid 10-digit mobile number'); return;
    }
    if (rows.filter(r => r.product && r.qty > 0).length === 0) {
      toast.error('Add at least one product'); return;
    }
    if (payMode === 'SPLIT') {
      const splitSum = Number(cashAmt || 0) + Number(upiAmt || 0);
      if (Math.abs(splitSum - grandTotal) > 0.5) {
        toast.error(`Split total ₹${splitSum.toFixed(0)} must equal bill ₹${grandTotal.toFixed(0)}`);
        return;
      }
    }
    saleMutation.mutate({
      ...toPayload(),
      paymentMethod: payMode === 'SPLIT' ? 'SPLIT' : payMode,
      cashPaid:      payMode === 'SPLIT' ? Number(cashAmt || 0) : (payMode === 'CASH' ? grandTotal : 0),
      upiPaid:       payMode === 'SPLIT' ? Number(upiAmt  || 0) : (payMode !== 'CASH' ? grandTotal : 0),
    });
  };

  const rowTotal   = (row) => row.product ? row.product.pricePerKg * row.qty : 0;
  const grandTotal  = total();
  const validRows   = rows.filter(r => r.product);

  const filteredProducts = products.filter(p => {
    const matchCat    = catFilter === 'all' || String(p.categoryId) === catFilter;
    const matchSearch = !productSearch ||
      p.name.toLowerCase().includes(productSearch.toLowerCase());
    return matchCat && matchSearch;
  });

  const clearAll = () => { reset(); setCashAmt(''); setUpiAmt(''); setPayMode('CASH'); };

  // ── render ──────────────────────────────────────────────────────────────────
  return (
    <div className="flex gap-3 h-full" style={{ minHeight: 0 }}>

      {/* ════════════════════════════════════════════════════════
          LEFT PANEL — Customer · Products · Payment
      ════════════════════════════════════════════════════════ */}
      <div
        className="flex-1 flex flex-col gap-3 min-w-0 overflow-y-auto pr-1"
        style={{ minHeight: 0 }}
      >

        {/* ── Customer ── */}
        <div className="bg-white rounded-2xl border border-stone-200 shadow-card p-3 flex-shrink-0">
          <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-2">
            Customer
          </p>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-stone-400 mb-1 block">Name (optional)</label>
              <input
                value={customerName}
                onChange={e => setField('customerName', e.target.value)}
                placeholder="Customer name"
                className="w-full border border-stone-200 rounded-lg px-2.5 py-2 text-sm focus:outline-none focus:border-brand-400"
              />
            </div>
            <div>
              <label className="text-[10px] text-stone-400 mb-1 block">Mobile *</label>
              <input
                value={customerMobile}
                onChange={e =>
                  setField('customerMobile', e.target.value.replace(/\D/g, '').slice(0, 10))
                }
                placeholder="10-digit mobile"
                type="tel"
                maxLength={10}
                className="w-full border border-stone-200 rounded-lg px-2.5 py-2 text-sm focus:outline-none focus:border-brand-400"
              />
            </div>
          </div>
        </div>

        {/* ── Products ── */}
        <div className="bg-white rounded-2xl border border-stone-200 shadow-card p-3 flex-shrink-0">
          {/* Header */}
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">
              Products
            </p>
            <button
              onClick={addRow}
              className="flex items-center gap-1 text-[10px] font-semibold text-brand-500 hover:text-brand-700"
            >
              <Plus size={11} /> Add row
            </button>
          </div>

          {/* Search bar */}
          <div className="flex items-center gap-1.5 border border-stone-200 rounded-lg px-2 py-1.5 mb-2">
            <Search size={11} className="text-stone-400 flex-shrink-0" />
            <input
              value={productSearch}
              onChange={e => setProductSearch(e.target.value)}
              placeholder="Search products…"
              className="text-xs outline-none w-full text-stone-700 placeholder:text-stone-300"
            />
          </div>

          {/* Category filter tabs */}
          <div className="flex gap-1.5 mb-3 flex-wrap">
            {[{ id: 'all', name: 'All', icon: '🥩' }, ...categories].map(c => (
              <button
                key={c.id}
                onClick={() => setCatFilter(String(c.id))}
                className={clsx(
                  'px-2.5 py-1 rounded-full text-[10px] font-semibold transition',
                  catFilter === String(c.id)
                    ? 'bg-brand-500 text-white'
                    : 'bg-stone-100 text-stone-500 hover:bg-stone-200'
                )}
              >
                {c.icon} {c.name}
              </button>
            ))}
          </div>

          {/* Quick-add product tiles */}
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5 mb-3">
            {filteredProducts.map(p => {
              const inCart = rows.some(r => r.productId === p.id);
              const isOut  = p.stockStatus === 'OUT_OF_STOCK';
              return (
                <button
                  key={p.id}
                  onClick={() => !isOut && quickAdd(p)}
                  disabled={isOut}
                  className={clsx(
                    'rounded-xl border p-2 text-left transition',
                    isOut
                      ? 'border-stone-100 bg-stone-50 opacity-40 cursor-not-allowed'
                      : inCart
                      ? 'border-brand-400 bg-brand-50'
                      : 'border-stone-200 hover:border-brand-300 hover:bg-stone-50'
                  )}
                >
                  <div className="text-base mb-0.5">{p.categoryIcon || '🥩'}</div>
                  <div className="text-[10px] font-semibold text-stone-700 truncate leading-tight">
                    {p.name}
                  </div>
                  <div className="text-[10px] text-brand-500 font-bold">
                    ₹{p.pricePerKg}/kg
                  </div>
                  {inCart && (
                    <div className="text-[9px] text-brand-400 font-bold">✓ Added</div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Dropdown rows — manual item entry */}
          <div className="border-t border-stone-100 pt-3">
            {/* Column headers */}
            <div className="grid grid-cols-[2fr_90px_70px_64px_20px] gap-1.5 mb-1.5 px-0.5">
              {['Product', 'Qty (kg)', 'Rate', 'Amount', ''].map((h, i) => (
                <div key={i} className="text-[9px] font-bold text-stone-400 uppercase">
                  {h}
                </div>
              ))}
            </div>

            {rows.map(row => (
              <div
                key={row.id}
                className="grid grid-cols-[2fr_90px_70px_64px_20px] gap-1.5 mb-1.5 items-center"
              >
                <select
                  value={row.productId || ''}
                  onChange={e => handleProductChange(row.id, e.target.value)}
                  className="border border-stone-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-brand-400 bg-white"
                >
                  <option value="">Select…</option>
                  {products.map(p => (
                    <option
                      key={p.id}
                      value={p.id}
                      disabled={p.stockStatus === 'OUT_OF_STOCK'}
                    >
                      {p.name}
                      {p.stockStatus === 'LOW_STOCK' ? ' ⚠' : p.stockStatus === 'OUT_OF_STOCK' ? ' ✕' : ''}
                    </option>
                  ))}
                </select>

                <input
                  type="number"
                  step="0.5"
                  min="0.5"
                  value={row.qty}
                  onChange={e =>
                    updateRow(row.id, { qty: parseFloat(e.target.value) || 0.5 })
                  }
                  className="border border-stone-200 rounded-lg px-2 py-1.5 text-xs text-right focus:outline-none focus:border-brand-400"
                />

                <div className="text-[10px] text-stone-400 text-right font-mono">
                  {row.product ? `₹${row.product.pricePerKg}` : '—'}
                </div>

                <div className="text-xs font-bold text-stone-800 text-right font-mono">
                  {row.product ? `₹${rowTotal(row).toFixed(0)}` : '—'}
                </div>

                <button
                  onClick={() => removeRow(row.id)}
                  className="text-stone-300 hover:text-red-500 transition"
                >
                  <X size={12} />
                </button>
              </div>
            ))}

            <button
              onClick={addRow}
              className="w-full mt-1 border border-dashed border-stone-200 rounded-lg py-1.5 text-[10px] text-stone-400 hover:border-brand-300 hover:text-brand-400 transition flex items-center justify-center gap-1"
            >
              <Plus size={10} /> Add another item
            </button>
          </div>
        </div>

        {/* ── Payment ── */}
        <div className="bg-white rounded-2xl border border-stone-200 shadow-card p-3 flex-shrink-0">
          <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-3">
            Payment Method
          </p>
          <div className="grid grid-cols-4 gap-1.5">
            {[
              { value: 'CASH',  emoji: '💵', label: 'Cash'  },
              { value: 'UPI',   emoji: '📱', label: 'UPI'   },
              { value: 'CARD',  emoji: '💳', label: 'Card'  },
              { value: 'SPLIT', emoji: '🔀', label: 'Split' },
            ].map(opt => (
              <button
                key={opt.value}
                onClick={() => { setPayMode(opt.value); if (opt.value !== 'SPLIT') { setCashAmt(''); setUpiAmt(''); } }}
                className={clsx(
                  'border-2 rounded-xl py-2 text-[10px] font-bold transition flex flex-col items-center gap-0.5',
                  payMode === opt.value
                    ? 'border-brand-500 bg-brand-50 text-brand-700'
                    : 'border-stone-200 text-stone-500 hover:border-stone-300'
                )}
              >
                <span className="text-sm leading-none">{opt.emoji}</span>
                <span>{opt.label}</span>
              </button>
            ))}
          </div>

          {/* Split inputs */}
          {payMode === 'SPLIT' && (
            <div className="mt-3 space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-semibold text-green-shop mb-1 block">💵 Cash (₹)</label>
                  <input type="number" min="0" step="1" value={cashAmt}
                    onChange={e => setCashAmt(e.target.value)} placeholder="0"
                    className="w-full border border-green-300 rounded-lg px-2.5 py-2 text-sm font-mono focus:outline-none focus:border-green-400" />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-blue-500 mb-1 block">📱 UPI / Card (₹)</label>
                  <input type="number" min="0" step="1" value={upiAmt}
                    onChange={e => setUpiAmt(e.target.value)} placeholder="0"
                    className="w-full border border-blue-300 rounded-lg px-2.5 py-2 text-sm font-mono focus:outline-none focus:border-blue-400" />
                </div>
              </div>
              {/* Validation feedback */}
              {(Number(cashAmt) + Number(upiAmt)) > 0 && (() => {
                const sum  = Number(cashAmt || 0) + Number(upiAmt || 0);
                const diff = sum - grandTotal;
                return (
                  <div className={clsx(
                    'text-xs rounded-lg px-3 py-2 flex justify-between border',
                    Math.abs(diff) < 0.5 ? 'bg-green-light border-green-200 text-green-shop'
                      : diff > 0         ? 'bg-red-50 border-red-200 text-red-500'
                                         : 'bg-amber-light border-amber-200 text-amber-shop'
                  )}>
                    <span>
                      <span className="font-bold">₹{sum.toFixed(0)}</span> of ₹{grandTotal.toFixed(0)}
                    </span>
                    <span className="font-bold">
                      {Math.abs(diff) < 0.5 ? '✓ Exact'
                        : diff > 0 ? `₹${diff.toFixed(0)} over`
                                   : `₹${Math.abs(diff).toFixed(0)} short`}
                    </span>
                  </div>
                );
              })()}
            </div>
          )}
        </div>

      </div>
      {/* end left panel */}

      {/* ════════════════════════════════════════════════════════
          RIGHT PANEL — Live bill
      ════════════════════════════════════════════════════════ */}
      <div
        className="flex flex-col bg-white rounded-2xl border border-stone-200 shadow-card overflow-hidden flex-shrink-0"
        style={{ width: '300px', minHeight: 0 }}
      >
        {/* Bill header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-stone-100 flex-shrink-0 bg-stone-50">
          <div>
            <p className="text-sm font-bold text-stone-800">Bill</p>
            <p className="text-[10px] text-stone-400">
              {validRows.length} item{validRows.length !== 1 ? 's' : ''}
            </p>
          </div>
          <button
            onClick={clearAll}
            className="flex items-center gap-1 text-[10px] text-stone-400 hover:text-red-500 border border-stone-200 rounded-lg px-2 py-1 transition"
          >
            <RotateCcw size={10} /> Clear
          </button>
        </div>

        {/* Bill items — scrollable */}
        <div className="flex-1 overflow-y-auto px-3 py-2" style={{ minHeight: 0 }}>
          {validRows.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-stone-300 text-center py-8">
              <ShoppingBag size={28} className="mb-2 opacity-40" />
              <p className="text-xs">Bill is empty</p>
              <p className="text-[10px] mt-0.5">Tap products to add</p>
            </div>
          ) : (
            <div className="space-y-2">
              {validRows.map(row => (
                <div
                  key={row.id}
                  className="flex items-start justify-between gap-2 py-2 border-b border-stone-100 last:border-0"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-stone-800 truncate">
                      {row.product?.categoryIcon} {row.product?.name}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      {/* Inline qty stepper */}
                      <div className="flex items-center border border-stone-200 rounded-lg overflow-hidden">
                        <button
                          onClick={() =>
                            updateRow(row.id, {
                              qty: Math.max(
                                row.product?.minOrderQty || 0.5,
                                parseFloat(
                                  (row.qty - (row.product?.orderStep || 0.5)).toFixed(3)
                                )
                              ),
                            })
                          }
                          className="px-1.5 py-0.5 text-stone-400 hover:bg-stone-100 text-xs"
                        >
                          −
                        </button>
                        <span className="px-2 text-[10px] font-mono font-bold text-stone-700">
                          {row.qty}kg
                        </span>
                        <button
                          onClick={() =>
                            updateRow(row.id, {
                              qty: parseFloat(
                                (row.qty + (row.product?.orderStep || 0.5)).toFixed(3)
                              ),
                            })
                          }
                          className="px-1.5 py-0.5 text-stone-400 hover:bg-stone-100 text-xs"
                        >
                          +
                        </button>
                      </div>
                      <span className="text-[10px] text-stone-400 font-mono">
                        @₹{row.product?.pricePerKg}
                      </span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-bold text-stone-800 font-mono">
                      ₹{rowTotal(row).toFixed(0)}
                    </p>
                    <button
                      onClick={() => removeRow(row.id)}
                      className="text-stone-300 hover:text-red-400 mt-0.5"
                    >
                      <X size={11} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Totals */}
        <div className="border-t border-stone-200 px-4 py-3 bg-stone-50 flex-shrink-0 space-y-1.5">
          <div className="flex justify-between text-xs text-stone-500">
            <span>Subtotal</span>
            <span className="font-mono">₹{grandTotal.toFixed(0)}</span>
          </div>

          {/* Split breakdown */}
          {payMode === 'SPLIT' && (Number(cashAmt) + Number(upiAmt)) > 0 && (
            <>
              {Number(cashAmt) > 0 && (
                <div className="flex justify-between text-xs text-green-shop">
                  <span>💵 Cash</span>
                  <span className="font-mono">₹{Number(cashAmt).toFixed(0)}</span>
                </div>
              )}
              {Number(upiAmt) > 0 && (
                <div className="flex justify-between text-xs text-blue-500">
                  <span>📱 UPI / Card</span>
                  <span className="font-mono">₹{Number(upiAmt).toFixed(0)}</span>
                </div>
              )}
            </>
          )}

          <div className="flex justify-between items-center pt-1 border-t border-stone-200">
            <span className="text-sm font-bold text-stone-800">Total</span>
            <span className="text-xl font-bold text-brand-500 font-mono">
              ₹{grandTotal.toFixed(0)}
            </span>
          </div>
          <div className="text-[10px] text-stone-400 flex justify-between">
            <span>{customerName || 'Walk-in'}</span>
            <span className="font-semibold">
              {payMode === 'SPLIT'
                ? `💵₹${Number(cashAmt||0).toFixed(0)}+📱₹${Number(upiAmt||0).toFixed(0)}`
                : payMode === 'CASH' ? '💵 Cash'
                : payMode === 'UPI'  ? '📱 UPI'
                :                     '💳 Card'}
            </span>
          </div>
        </div>

        {/* Complete sale button */}
        <div className="p-3 flex-shrink-0">
          <button
            onClick={handleSubmit}
            disabled={saleMutation.isLoading || grandTotal === 0}
            className="w-full flex items-center justify-center gap-2 bg-brand-500 hover:bg-brand-600 text-white rounded-xl py-3 text-sm font-bold transition disabled:opacity-50 shadow-brand"
          >
            {saleMutation.isLoading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <><ShoppingBag size={15} /> Complete Sale</>
            )}
          </button>
        </div>
      </div>
      {/* end right panel */}

      {/* Receipt modal */}
      {receipt && (
        <ReceiptModal order={receipt} onClose={() => setReceipt(null)} />
      )}
    </div>
  );
}
