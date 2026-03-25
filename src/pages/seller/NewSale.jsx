import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { productsApi, ordersApi, khataApi } from '../../services/api';
import { usePosStore } from '../../store';
import {
  Plus, Printer, RotateCcw, ShoppingBag,
  Search, BookOpen, AlertTriangle, X
} from 'lucide-react';
import { clsx } from 'clsx';
import toast from 'react-hot-toast';

// ── Receipt Modal ─────────────────────────────────────────────────────────────
function ReceiptModal({ order, khataInfo, onClose }) {
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
            <span className="font-bold text-stone-800">Bill Total</span>
            <span className="font-bold text-brand-500 text-lg">
              ₹{Number(order.total).toLocaleString('en-IN')}
            </span>
          </div>
          {/* Khata breakdown — only shown in admin mode */}
          {khataInfo && (
            <div className="bg-amber-light border border-amber-200 rounded-xl p-3 space-y-1.5">
              <p className="text-xs font-bold text-amber-shop flex items-center gap-1">
                <BookOpen size={12} /> Khata — {khataInfo.accountName}
              </p>
              {khataInfo.paidNow > 0 && (
                <div className="flex justify-between text-xs">
                  <span className="text-stone-500">Paid now</span>
                  <span className="font-semibold text-green-shop">
                    ₹{Number(khataInfo.paidNow).toLocaleString('en-IN')}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-xs">
                <span className="text-stone-500">Added to Khata</span>
                <span className="font-semibold text-amber-shop">
                  ₹{Number(khataInfo.addedToKhata).toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex justify-between text-xs border-t border-amber-200 pt-1.5">
                <span className="text-stone-500">New Total Due</span>
                <span className="font-bold text-amber-shop">
                  ₹{Number(khataInfo.newDue).toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          )}
          <div className="text-xs text-stone-400 flex justify-between">
            <span>{order.customerName} · {order.customerMobile}</span>
            <span>{khataInfo ? 'KHATA' : order.paymentMethod}</span>
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

// ── Khata Account Detail Card (admin only) ────────────────────────────────────
function KhataAccountCard({ account, grandTotal, paidNow, onPaidNowChange }) {
  const prevDue      = Number(account.currentDue   || 0);
  const creditLimit  = Number(account.creditLimit   || 0);
  const paidNum      = Number(paidNow               || 0);
  const addedToKhata = Math.max(0, grandTotal - paidNum);
  const newDue       = prevDue + addedToKhata;
  const usagePct     = creditLimit > 0 ? Math.min((newDue / creditLimit) * 100, 100) : 0;
  const overLimit    = creditLimit > 0 && newDue > creditLimit;

  const barColor = usagePct > 85 ? 'bg-red-500'
                 : usagePct > 60 ? 'bg-amber-400'
                 : 'bg-green-shop';

  return (
    <div className={clsx(
      'rounded-xl border p-3 space-y-3 mt-2',
      overLimit ? 'border-red-300 bg-red-50' : 'border-amber-200 bg-amber-light/60'
    )}>
      {/* Account header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-bold text-stone-800">{account.customerName}</p>
          <p className="text-[10px] text-stone-400">{account.customerMobile}</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-stone-400">Credit Limit</p>
          <p className="text-xs font-bold text-stone-700">
            ₹{creditLimit.toLocaleString('en-IN')}
          </p>
        </div>
      </div>

      {/* Credit bar */}
      <div>
        <div className="flex justify-between text-[10px] text-stone-400 mb-1">
          <span>Limit usage after this sale</span>
          <span className={overLimit ? 'text-red-500 font-bold' : ''}>
            {usagePct.toFixed(0)}%
          </span>
        </div>
        <div className="h-2 bg-stone-200 rounded-full overflow-hidden">
          <div className={clsx('h-full rounded-full transition-all', barColor)}
            style={{ width: `${usagePct}%` }} />
        </div>
        {overLimit && (
          <p className="text-[10px] text-red-500 font-semibold mt-1 flex items-center gap-1">
            <AlertTriangle size={10} />
            Over limit by ₹{(newDue - creditLimit).toLocaleString('en-IN')}
          </p>
        )}
      </div>

      {/* Breakdown */}
      <div className="space-y-1.5 text-xs">
        <div className="flex justify-between text-stone-500">
          <span>Previous pending due</span>
          <span className="font-mono font-semibold text-amber-shop">
            ₹{prevDue.toLocaleString('en-IN')}
          </span>
        </div>
        <div className="flex justify-between text-stone-500">
          <span>This bill</span>
          <span className="font-mono font-semibold text-stone-700">
            ₹{grandTotal.toFixed(0)}
          </span>
        </div>

        {/* Paid now field */}
        <div className="flex items-center justify-between gap-2 pt-1 border-t border-amber-200">
          <label className="text-stone-500 whitespace-nowrap">Paying now (₹)</label>
          <input
            type="number" min="0" max={grandTotal} step="1"
            value={paidNow}
            onChange={e => onPaidNowChange(e.target.value)}
            placeholder="0"
            className="w-28 border border-stone-300 rounded-lg px-2 py-1 text-xs text-right font-mono focus:outline-none focus:border-brand-400"
          />
        </div>

        <div className="space-y-1 pt-1">
          <div className="flex justify-between text-stone-500">
            <span>Going to Khata now</span>
            <span className="font-mono font-bold text-amber-shop">
              ₹{addedToKhata.toLocaleString('en-IN')}
            </span>
          </div>
          <div className="flex justify-between border-t border-amber-200 pt-1.5">
            <span className="font-bold text-stone-700">Total due after sale</span>
            <span className={clsx(
              'font-mono font-bold text-base',
              overLimit ? 'text-red-500' : 'text-amber-shop'
            )}>
              ₹{newDue.toLocaleString('en-IN')}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// MAIN POS COMPONENT
// isAdmin = false  →  Seller view  (no Khata, clean POS)
// isAdmin = true   →  Admin view   (Khata account, credit logic)
//
// Layout — two-column, fits 100% height, zero page scroll:
//  ┌──────────────────────────────┬──────────────────┐
//  │  LEFT: customer + products   │  RIGHT: live bill │
//  │         + payment            │  (added items)    │
//  └──────────────────────────────┴──────────────────┘
// ════════════════════════════════════════════════════════════════════════════
export default function NewSale({ isAdmin = false }) {
  const {
    rows, customerName, customerMobile, paymentMethod,
    addRow, removeRow, updateRow, setField, reset, total, toPayload,
  } = usePosStore();

  const [receipt,        setReceipt]        = useState(null);
  const [receiptKhata,   setReceiptKhata]   = useState(null);
  const [productSearch,  setProductSearch]  = useState('');
  const [catFilter,      setCatFilter]      = useState('all');

  // Khata state — only used when isAdmin=true
  const [addToKhata,     setAddToKhata]     = useState(false);
  const [khataAccountId, setKhataAccountId] = useState('');
  const [paidNow,        setPaidNow]        = useState('');

  const qc = useQueryClient();

  const { data: products = [] } = useQuery(
    'products-pos',
    () => productsApi.getAll({ status: 'available' }),
    { staleTime: 60000 }
  );

  const { data: categories = [] } = useQuery(
    'categories-pos',
    () => import('../../services/api').then(m => m.categoriesApi.getAll()),
    { staleTime: 300000 }
  );

  // Khata accounts — fetched only when admin
  const { data: khataData } = useQuery(
    'khata',
    khataApi.summary,
    { enabled: isAdmin, staleTime: 30000 }
  );
  const khataAccounts   = khataData?.accounts || [];
  const selectedAccount = khataAccounts.find(a => String(a.id) === String(khataAccountId));

  const saleMutation = useMutation(ordersApi.posSale, {
    onSuccess: async (data) => {
      // Admin + Khata: post debit entry
      if (isAdmin && addToKhata && selectedAccount) {
        const paidNum      = Number(paidNow || 0);
        const addedToKhata = Math.max(0, grandTotal - paidNum);
        const newDue       = Number(selectedAccount.currentDue || 0) + addedToKhata;
        if (addedToKhata > 0) {
          try {
            await khataApi.addEntry({
              accountId:     selectedAccount.id,
              entryType:     'DEBIT',
              amount:        addedToKhata,
              description:   `Sale #${data.orderNumber}`,
              referenceNote: `Bill ₹${grandTotal} | Paid ₹${paidNum} | Khata ₹${addedToKhata}`,
              orderId:       data.id,
            });
          } catch (e) {
            console.error('Khata entry failed', e);
          }
        }
        setReceiptKhata({
          accountName:   selectedAccount.customerName,
          paidNow:       paidNum,
          addedToKhata,
          newDue,
        });
      } else {
        setReceiptKhata(null);
      }

      setReceipt(data);
      reset();
      setAddToKhata(false);
      setPaidNow('');
      setKhataAccountId('');
      qc.invalidateQueries('khata');
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Sale failed'),
  });

  // Quick-add from product tile click
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
    const newData  = { productId: product.id, product, qty: product.minOrderQty || 0.5 };
    if (emptyRow) {
      updateRow(emptyRow.id, newData);
    } else {
      usePosStore.setState(s => ({
        rows: [...s.rows, { id: Date.now(), ...newData }],
      }));
    }
    toast.success(`${product.categoryIcon || '🥩'} ${product.name} added`, { duration: 700 });
  };

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
    if (isAdmin && addToKhata && !khataAccountId) {
      toast.error('Select a Khata account'); return;
    }
    saleMutation.mutate({
      ...toPayload(),
      paymentMethod: addToKhata ? 'KHATA' : paymentMethod,
    });
  };

  const rowTotal   = (row) => row.product ? row.product.pricePerKg * row.qty : 0;
  const grandTotal = total();
  const validRows  = rows.filter(r => r.product);

  const filteredProducts = products.filter(p => {
    const matchCat    = catFilter === 'all' || String(p.categoryId) === catFilter;
    const matchSearch = !productSearch || p.name.toLowerCase().includes(productSearch.toLowerCase());
    return matchCat && matchSearch;
  });

  const PAY_OPTIONS = [
    { value: 'CASH', label: '💵 Cash' },
    { value: 'UPI',  label: '📱 UPI'  },
    { value: 'CARD', label: '💳 Card' },
  ];

  return (
    <div className="flex gap-3 h-full" style={{ minHeight: 0 }}>

      {/* ── LEFT PANEL ──────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col gap-3 min-w-0 overflow-y-auto pr-1" style={{ minHeight: 0 }}>

        {/* Customer */}
        <div className="bg-white rounded-2xl border border-stone-200 shadow-card p-3 flex-shrink-0">
          <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-2">Customer</p>
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
                onChange={e => setField('customerMobile', e.target.value.replace(/\D/g,'').slice(0,10))}
                placeholder="10-digit mobile"
                type="tel" maxLength={10}
                className="w-full border border-stone-200 rounded-lg px-2.5 py-2 text-sm focus:outline-none focus:border-brand-400"
              />
            </div>
          </div>
        </div>

        {/* Products — quick grid + dropdown rows */}
        <div className="bg-white rounded-2xl border border-stone-200 shadow-card p-3 flex-shrink-0">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Products</p>
            <button onClick={addRow}
              className="flex items-center gap-1 text-[10px] font-semibold text-brand-500 hover:text-brand-700">
              <Plus size={11} /> Add row
            </button>
          </div>

          {/* Search */}
          <div className="flex items-center gap-1.5 border border-stone-200 rounded-lg px-2 py-1.5 mb-2">
            <Search size={11} className="text-stone-400 flex-shrink-0" />
            <input
              value={productSearch}
              onChange={e => setProductSearch(e.target.value)}
              placeholder="Search products…"
              className="text-xs outline-none w-full text-stone-700 placeholder:text-stone-300"
            />
          </div>

          {/* Category tabs */}
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
                    isOut    ? 'border-stone-100 bg-stone-50 opacity-40 cursor-not-allowed'
                    : inCart ? 'border-brand-400 bg-brand-50'
                             : 'border-stone-200 hover:border-brand-300 hover:bg-stone-50'
                  )}
                >
                  <div className="text-base mb-0.5">{p.categoryIcon || '🥩'}</div>
                  <div className="text-[10px] font-semibold text-stone-700 truncate leading-tight">
                    {p.name}
                  </div>
                  <div className="text-[10px] text-brand-500 font-bold">₹{p.pricePerKg}/kg</div>
                  {inCart && <div className="text-[9px] text-brand-400 font-bold">✓ Added</div>}
                </button>
              );
            })}
          </div>

          {/* Dropdown rows */}
          <div className="border-t border-stone-100 pt-3">
            <div className="grid grid-cols-[2fr_90px_70px_64px_20px] gap-1.5 mb-1.5 px-0.5">
              {['Product', 'Qty (kg)', 'Rate', 'Amount', ''].map((h, i) => (
                <div key={i} className="text-[9px] font-bold text-stone-400 uppercase">{h}</div>
              ))}
            </div>
            {rows.map(row => (
              <div key={row.id} className="grid grid-cols-[2fr_90px_70px_64px_20px] gap-1.5 mb-1.5 items-center">
                <select
                  value={row.productId || ''}
                  onChange={e => handleProductChange(row.id, e.target.value)}
                  className="border border-stone-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-brand-400 bg-white"
                >
                  <option value="">Select…</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id} disabled={p.stockStatus === 'OUT_OF_STOCK'}>
                      {p.name}{p.stockStatus === 'LOW_STOCK' ? ' ⚠' : p.stockStatus === 'OUT_OF_STOCK' ? ' ✕' : ''}
                    </option>
                  ))}
                </select>
                <input
                  type="number" step="0.5" min="0.5"
                  value={row.qty}
                  onChange={e => updateRow(row.id, { qty: parseFloat(e.target.value) || 0.5 })}
                  className="border border-stone-200 rounded-lg px-2 py-1.5 text-xs text-right focus:outline-none focus:border-brand-400"
                />
                <div className="text-[10px] text-stone-400 text-right font-mono">
                  {row.product ? `₹${row.product.pricePerKg}` : '—'}
                </div>
                <div className="text-xs font-bold text-stone-800 text-right font-mono">
                  {row.product ? `₹${rowTotal(row).toFixed(0)}` : '—'}
                </div>
                <button onClick={() => removeRow(row.id)} className="text-stone-300 hover:text-red-500 transition">
                  <X size={12} />
                </button>
              </div>
            ))}
            <button onClick={addRow}
              className="w-full mt-1 border border-dashed border-stone-200 rounded-lg py-1.5 text-[10px] text-stone-400 hover:border-brand-300 hover:text-brand-400 transition flex items-center justify-center gap-1">
              <Plus size={10} /> Add another item
            </button>
          </div>
        </div>

        {/* Payment */}
        <div className="bg-white rounded-2xl border border-stone-200 shadow-card p-3 flex-shrink-0">
          <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-3">Payment</p>

          {/* Khata toggle — admin only */}
          {isAdmin && (
            <div className="mb-3">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={addToKhata}
                  onChange={e => {
                    setAddToKhata(e.target.checked);
                    if (!e.target.checked) { setKhataAccountId(''); setPaidNow(''); }
                  }}
                  className="w-4 h-4 rounded accent-brand-500"
                />
                <BookOpen size={13} className="text-amber-shop" />
                <span className="text-xs font-semibold text-stone-700">Add to Khata (Credit Account)</span>
              </label>

              {addToKhata && (
                <div className="mt-2 pl-6">
                  <label className="text-[10px] text-stone-400 mb-1 block">Select Khata Account *</label>
                  <select
                    value={khataAccountId}
                    onChange={e => { setKhataAccountId(e.target.value); setPaidNow(''); }}
                    className="w-full border border-stone-200 rounded-lg px-2.5 py-2 text-xs focus:outline-none focus:border-brand-400 bg-white"
                  >
                    <option value="">— Choose account —</option>
                    {khataAccounts.map(a => (
                      <option key={a.id} value={a.id}>
                        {a.customerName} · Due: ₹{Number(a.currentDue).toLocaleString('en-IN')}
                      </option>
                    ))}
                  </select>

                  {selectedAccount && (
                    <KhataAccountCard
                      account={selectedAccount}
                      grandTotal={grandTotal}
                      paidNow={paidNow}
                      onPaidNowChange={setPaidNow}
                    />
                  )}
                </div>
              )}
            </div>
          )}

          {/* Normal payment buttons */}
          {!addToKhata && (
            <div className="grid grid-cols-3 gap-2">
              {PAY_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setField('paymentMethod', opt.value)}
                  className={clsx(
                    'border-2 rounded-xl py-2.5 text-xs font-semibold transition',
                    paymentMethod === opt.value
                      ? 'border-brand-500 bg-brand-50 text-brand-700'
                      : 'border-stone-200 text-stone-500 hover:border-stone-300'
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>

      </div>{/* end left panel */}

      {/* ── RIGHT PANEL — live bill ──────────────────────────────────────────── */}
      <div
        className="flex flex-col bg-white rounded-2xl border border-stone-200 shadow-card overflow-hidden flex-shrink-0"
        style={{ width: '300px', minHeight: 0 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-stone-100 flex-shrink-0 bg-stone-50">
          <div>
            <p className="text-sm font-bold text-stone-800">Bill</p>
            <p className="text-[10px] text-stone-400">
              {validRows.length} item{validRows.length !== 1 ? 's' : ''}
            </p>
          </div>
          <button
            onClick={() => { reset(); setAddToKhata(false); setPaidNow(''); setKhataAccountId(''); }}
            className="flex items-center gap-1 text-[10px] text-stone-400 hover:text-red-500 border border-stone-200 rounded-lg px-2 py-1 transition"
          >
            <RotateCcw size={10} /> Clear
          </button>
        </div>

        {/* Items — scrollable */}
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
                <div key={row.id} className="flex items-start justify-between gap-2 py-2 border-b border-stone-100 last:border-0">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-stone-800 truncate">
                      {row.product?.categoryIcon} {row.product?.name}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      {/* Inline qty stepper */}
                      <div className="flex items-center border border-stone-200 rounded-lg overflow-hidden">
                        <button
                          onClick={() => updateRow(row.id, {
                            qty: Math.max(
                              row.product?.minOrderQty || 0.5,
                              parseFloat((row.qty - (row.product?.orderStep || 0.5)).toFixed(3))
                            )
                          })}
                          className="px-1.5 py-0.5 text-stone-400 hover:bg-stone-100 text-xs"
                        >−</button>
                        <span className="px-2 text-[10px] font-mono font-bold text-stone-700">
                          {row.qty}kg
                        </span>
                        <button
                          onClick={() => updateRow(row.id, {
                            qty: parseFloat((row.qty + (row.product?.orderStep || 0.5)).toFixed(3))
                          })}
                          className="px-1.5 py-0.5 text-stone-400 hover:bg-stone-100 text-xs"
                        >+</button>
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
                    <button onClick={() => removeRow(row.id)} className="text-stone-300 hover:text-red-400 mt-0.5">
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

          {/* Khata split — admin only */}
          {addToKhata && selectedAccount && (
            <>
              {Number(paidNow) > 0 && (
                <div className="flex justify-between text-xs text-green-shop">
                  <span>Paid now</span>
                  <span className="font-mono">₹{Number(paidNow).toFixed(0)}</span>
                </div>
              )}
              <div className="flex justify-between text-xs text-amber-shop">
                <span>To Khata</span>
                <span className="font-mono">
                  ₹{Math.max(0, grandTotal - Number(paidNow || 0)).toFixed(0)}
                </span>
              </div>
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
              {addToKhata ? '📖 KHATA' : paymentMethod}
            </span>
          </div>
        </div>

        {/* Complete sale */}
        <div className="p-3 flex-shrink-0">
          <button
            onClick={handleSubmit}
            disabled={saleMutation.isLoading || grandTotal === 0}
            className="w-full flex items-center justify-center gap-2 bg-brand-500 hover:bg-brand-600 text-white rounded-xl py-3 text-sm font-bold transition disabled:opacity-50 shadow-brand"
          >
            {saleMutation.isLoading
              ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              : <><ShoppingBag size={15} /> Complete Sale</>
            }
          </button>
        </div>
      </div>

      {/* Receipt */}
      {receipt && (
        <ReceiptModal
          order={receipt}
          khataInfo={receiptKhata}
          onClose={() => { setReceipt(null); setReceiptKhata(null); }}
        />
      )}
    </div>
  );
}