import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { productsApi, ordersApi } from '../../services/api';
import { usePosStore } from '../../store';
import {
  Plus, Printer, RotateCcw, ShoppingBag,
  Search, X, ShoppingCart, ArrowLeft, Minus,
} from 'lucide-react';
import { clsx } from 'clsx';
import toast from 'react-hot-toast';
import { useRazorpay } from '../../components/useRazorpay';

// ── QtyInput ──────────────────────────────────────────────────────────────────
function QtyInput({ value, onCommit, step = 0.5, minQty = 0.5, className = '' }) {
  const [editing, setEditing] = useState(false);
  const [draft,   setDraft]   = useState('');

  const commit = (raw) => {
    const parsed = parseFloat(raw);
    if (!isNaN(parsed) && parsed > 0) onCommit(parseFloat(parsed.toFixed(3)));
    else onCommit(value);
    setEditing(false);
    setDraft('');
  };

  if (editing) {
    return (
      <input
        type="number" min="0.001" step="any" autoFocus
        value={draft}
        onChange={e => setDraft(e.target.value)}
        onBlur={() => commit(draft)}
        onKeyDown={e => {
          if (e.key === 'Enter')  commit(draft);
          if (e.key === 'Escape') { setEditing(false); setDraft(''); }
        }}
        className={clsx(
          'text-center font-bold font-mono border border-brand-400 rounded bg-brand-50 text-brand-700 outline-none',
          className
        )}
      />
    );
  }

  return (
    <button
      onClick={() => { setEditing(true); setDraft(String(value)); }}
      title="Tap to type custom quantity"
      className={clsx(
        'text-center font-bold font-mono border border-stone-300 rounded bg-white',
        'hover:border-brand-400 hover:bg-brand-50 hover:text-brand-700 transition cursor-text',
        className
      )}>
      {value}kg
    </button>
  );
}

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
                  ₹{Number(Math.round(item.total)).toLocaleString('en-IN')}
                </span>
              </div>
            ))}
          </div>
          <div className="border-t border-stone-300 pt-3 flex justify-between">
            <span className="font-bold text-stone-800">Bill Total</span>
            <span className="font-bold text-brand-500 text-lg">
              ₹{Number(Math.round(order.total)).toLocaleString('en-IN')}
            </span>
          </div>
          <div className="flex items-center gap-2 bg-brand-50 border border-brand-200 rounded-xl px-3 py-2">
            <span className="text-base">📱</span>
            <p className="text-xs font-bold text-brand-600">Paid via UPI · Razorpay</p>
          </div>
          <div className="text-xs text-stone-900 flex justify-between">
            <span>{order.customerName} · {order.customerMobile}</span>
            <span className="font-semibold">{order.paymentMethod}</span>
          </div>
        </div>
        <div className="flex gap-3 px-5 pb-5">
          <button onClick={() => window.print()}
            className="flex-1 flex items-center justify-center gap-1.5 border border-stone-300 rounded-xl py-2.5 text-sm font-medium text-stone-600 hover:bg-stone-50">
            <Printer size={14} /> Print
          </button>
          <button onClick={onClose}
            className="flex-1 bg-brand-500 text-white rounded-xl py-2.5 text-sm font-semibold hover:bg-brand-600">
            New Sale →
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Bill Panel ────────────────────────────────────────────────────────────────
function BillPanel({
  validRows, updateRow, removeRow, doReset,
  grandTotal, customerName, saleMutation, handleSubmit,
  isMobile, onClose,
}) {
  const rowTotal = (row) => row.product ? row.product.pricePerKg * row.qty : 0;

  return (
    <div className="flex flex-col bg-white h-full overflow-hidden">

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-stone-100 flex-shrink-0 bg-stone-50">
        <div className="flex items-center gap-2">
          {isMobile && (
            <button onClick={onClose}
              className="flex items-center justify-center w-8 h-8 rounded-lg border border-stone-300 text-stone-700 hover:bg-stone-100 transition">
              <ArrowLeft size={16} />
            </button>
          )}
          <div>
            <p className="text-sm font-bold text-stone-800">Bill</p>
            <p className="text-[10px] text-stone-900">
              {validRows.length} item{validRows.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <button onClick={doReset}
          className="flex items-center gap-1 text-[10px] text-stone-900 hover:text-red-500 border border-stone-300 rounded-lg px-2 py-1 transition">
          <RotateCcw size={10} /> Clear
        </button>
      </div>

      {/* Items */}
      <div className="flex-1 overflow-y-auto px-3 py-2" style={{ minHeight: 0 }}>
        {validRows.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-stone-300 text-center py-8">
            <ShoppingBag size={28} className="mb-2 opacity-40" />
            <p className="text-xs">Bill is empty</p>
            <p className="text-[10px] mt-0.5">Tap products to add</p>
          </div>
        ) : (
          <div className="space-y-2">
            {validRows.map(row => {
              const step   = row.product?.orderStep   || 0.5;
              const minQty = row.product?.minOrderQty || 0.5;
              return (
                <div key={row.id}
                  className="flex items-start justify-between gap-2 py-2 border-b border-stone-100 last:border-0">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-stone-800 truncate">
                      {row.product?.categoryIcon} {row.product?.name}
                    </p>
                    <p className="text-[10px] text-stone-900 mb-1">₹{row.product?.pricePerKg}/kg</p>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => updateRow(row.id, {
                          qty: Math.max(minQty, parseFloat((row.qty - step).toFixed(3)))
                        })}
                        className="w-6 h-6 border border-stone-300 rounded flex items-center justify-center text-stone-900 hover:bg-red-50 hover:text-red-500 transition">
                        <Minus size={10} />
                      </button>
                      <QtyInput
                        value={row.qty} step={step} minQty={minQty}
                        onCommit={val => updateRow(row.id, { qty: val })}
                        className="w-16 py-0.5 text-[10px]"
                      />
                      <button
                        onClick={() => updateRow(row.id, {
                          qty: parseFloat((row.qty + step).toFixed(3))
                        })}
                        className="w-6 h-6 border border-stone-300 rounded flex items-center justify-center text-stone-900 hover:bg-green-50 hover:text-green-600 transition">
                        <Plus size={10} />
                      </button>
                      <span className="text-[10px] text-stone-900 font-mono ml-1">
                        @₹{row.product?.pricePerKg}
                      </span>
                    </div>
                    <p className="text-[9px] text-stone-900 mt-0.5">Tap qty to type</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-bold text-stone-800 font-mono">₹{rowTotal(row).toFixed(0)}</p>
                    <button onClick={() => removeRow(row.id)} className="text-stone-800 hover:text-red-400 mt-0.5" style={{backgroundColor:"tomato", padding:"3px" , color:"#fff", borderRadius:"5px"}}>
                      <X size={11} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Totals */}
      <div className="border-t border-stone-300 px-4 py-3 bg-stone-50 flex-shrink-0 space-y-1.5">
        <div className="flex justify-between items-center">
          <span className="text-sm font-bold text-stone-800">Total</span>
          <span className="text-xl font-bold text-brand-500 font-mono">₹{grandTotal.toFixed(0)}</span>
        </div>
        <div className="text-[10px] text-stone-900 flex justify-between">
          <span>{customerName || 'Walk-in'}</span>
          <span className="font-semibold text-brand-500">📱 UPI</span>
        </div>
      </div>

      {/* Submit */}
      <div className="p-3 flex-shrink-0">
        <button
          onClick={handleSubmit}
          disabled={saleMutation.isLoading || grandTotal === 0}
          className="w-full flex items-center justify-center gap-2 bg-brand-500 hover:bg-brand-600 text-white rounded-xl py-3 text-sm font-bold transition disabled:opacity-50 shadow-brand">
          {saleMutation.isLoading
            ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            : <><span>📱</span> Pay ₹{grandTotal.toFixed(0)} via UPI</>
          }
        </button>
        <p className="text-center text-[10px] text-stone-900 mt-1.5 flex items-center justify-center gap-1">
          <span>🔒</span> Secured by Razorpay
        </p>
      </div>
    </div>
  );
}

// ── Left Panel Content ────────────────────────────────────────────────────────
function LeftPanelContent({
  customerName, customerMobile, setField,
  rows, products, categories,
  productSearch, setProductSearch,
  catFilter, setCatFilter,
  addRow, removeRow, updateRow,
  handleProductChange, quickAdd, filteredProducts, rowTotal,
}) {
  return (
    <>
      {/* Customer */}
      <div className="bg-white rounded-2xl border border-stone-300 shadow-card p-3">
        <p className="text-[10px] font-bold text-stone-900 uppercase tracking-wider mb-2">Customer</p>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[10px] text-stone-900 mb-1 block">Name (optional)</label>
            <input
              value={customerName}
              onChange={e => setField('customerName', e.target.value)}
              placeholder="Customer name"
              className="w-full border border-stone-300 rounded-lg px-2.5 py-2 text-sm focus:outline-none focus:border-brand-400"
            />
          </div>
          <div>
            <label className="text-[10px] text-stone-900 mb-1 block">Mobile *</label>
            <input
              value={customerMobile}
              onChange={e => setField('customerMobile', e.target.value.replace(/\D/g, '').slice(0, 10))}
              placeholder="10-digit mobile"
              type="tel" maxLength={10}
              className="w-full border border-stone-300 rounded-lg px-2.5 py-2 text-sm focus:outline-none focus:border-brand-400"
            />
          </div>
        </div>
      </div>

      {/* Products */}
      <div className="bg-white rounded-2xl border border-stone-300 shadow-card p-3">
        <div className="flex items-center justify-between mb-2">
          <p className="text-[10px] font-bold text-stone-900 uppercase tracking-wider">Products</p>
          <button onClick={addRow}
            className="flex items-center gap-1 text-[10px] font-semibold text-brand-500 hover:text-brand-700">
            <Plus size={11} /> Add row
          </button>
        </div>

        {/* Search */}
        <div className="flex items-center gap-1.5 border border-stone-300 rounded-lg px-2 py-1.5 mb-2">
          <Search size={11} className="text-stone-900 flex-shrink-0" />
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
                  : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
              )}>
              {c.icon} {c.name}
            </button>
          ))}
        </div>

        {/* Quick-add tiles */}
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
                           : 'border-stone-300 hover:border-brand-300 hover:bg-stone-50'
                )}>
                <div className="text-base mb-0.5">{p.categoryIcon || '🥩'}</div>
                <div className="text-[10px] font-semibold text-stone-700 truncate leading-tight">{p.name}</div>
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
              <div key={i} className="text-[9px] font-bold text-stone-900 uppercase">{h}</div>
            ))}
          </div>
          {rows.map(row => (
            <div key={row.id}
              className="grid grid-cols-[2fr_90px_70px_64px_20px] gap-1.5 mb-1.5 items-center">
              <select
                value={row.productId || ''}
                onChange={e => handleProductChange(row.id, e.target.value)}
                className="border border-stone-300 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-brand-400 bg-white">
                <option value="">Select…</option>
                {products.map(p => (
                  <option key={p.id} value={p.id} disabled={p.stockStatus === 'OUT_OF_STOCK'}>
                    {p.name}{p.stockStatus === 'LOW_STOCK' ? ' ⚠' : p.stockStatus === 'OUT_OF_STOCK' ? ' ✕' : ''}
                  </option>
                ))}
              </select>
              <QtyInput
                value={row.qty}
                step={row.product?.orderStep || 0.5}
                minQty={row.product?.minOrderQty || 0.5}
                onCommit={val => updateRow(row.id, { qty: val })}
                className="w-full py-1.5 text-xs"
              />
              <div className="text-[10px] text-stone-900 text-right font-mono">
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
            className="w-full mt-1 border border-dashed border-stone-300 rounded-lg py-1.5 text-[10px] text-stone-900 hover:border-brand-300 hover:text-brand-400 transition flex items-center justify-center gap-1">
            <Plus size={10} /> Add another item
          </button>
        </div>
      </div>

      {/* UPI info banner */}
      <div className="flex items-center gap-3 bg-brand-50 border border-brand-200 rounded-2xl px-4 py-3">
        <span className="text-2xl">📱</span>
        <div>
          <p className="text-xs font-bold text-brand-600">Payment via UPI · Razorpay</p>
          <p className="text-[10px] text-stone-900">GPay · PhonePe · Paytm · Any UPI app</p>
        </div>
        <span className="ml-auto text-[9px] bg-brand-500 text-white px-2 py-0.5 rounded-full font-bold">SECURE</span>
      </div>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
export default function NewSale({ isAdmin = false }) {
  const {
    rows, customerName, customerMobile,
    addRow, removeRow, updateRow, setField, reset, total, toPayload,
  } = usePosStore();

  const [receipt,       setReceipt]       = useState(null);
  const [productSearch, setProductSearch] = useState('');
  const [catFilter,     setCatFilter]     = useState('all');
  const [showBillPanel, setShowBillPanel] = useState(false);

  const { pay } = useRazorpay();
  const qc      = useQueryClient();

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

  const grandTotal = total();

  const doReset = () => {
    reset();
    setShowBillPanel(false);
  };

  const finalizeSale = (razorpayResult) => {
    saleMutation.mutate({
      ...toPayload(),
      paymentMethod:     'UPI',
      cashPaid:          0,
      upiPaid:           grandTotal,
      razorpayPaymentId: razorpayResult.razorpay_payment_id,
      razorpayOrderId:   razorpayResult.razorpay_order_id,
      razorpaySignature: razorpayResult.razorpay_signature,
    });
  };

  const saleMutation = useMutation(
    (payload) => ordersApi.posSale(payload),
    {
      onSuccess: (order) => {
        setReceipt(order);
        doReset();
        qc.invalidateQueries('products-pos');
      },
      onError: (e) => toast.error(e.response?.data?.message || 'Sale failed'),
    }
  );

  const handleSubmit = async () => {
    if (!customerMobile || customerMobile.length < 10) {
      toast.error('Enter valid 10-digit mobile number'); return;
    }
    if (rows.filter(r => r.product && r.qty > 0).length === 0) {
      toast.error('Add at least one product'); return;
    }

    try {
      await pay({
        cartItems: rows
          .filter(r => r.product && r.qty > 0)
          .map(r => ({ product: r.product, qty: r.qty })),
        customerDetails: {
          name:   customerName || 'Customer',
          mobile: customerMobile,
          email:  '',
          notes:  '',
        },
        overrideAmount: grandTotal,
        cashPaid:       0,
        upiPaid:        grandTotal,
        paymentMode:    'UPI',
        role:           isAdmin ? 'ADMIN' : 'SELLER',
        isKhata:        false,
        onSuccess: (razorpayResult) => { finalizeSale(razorpayResult); },
        onFailure: ()              => { toast.error('Payment cancelled or failed.'); },
      });
    } catch (err) {
      toast.error('Could not open payment gateway. Please try again.');
      console.error('Razorpay error:', err);
    }
  };

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
    if (emptyRow) updateRow(emptyRow.id, newData);
    else usePosStore.setState(s => ({ rows: [...s.rows, { id: Date.now(), ...newData }] }));
    toast.success(`${product.categoryIcon || '🥩'} ${product.name} added`, { duration: 700 });
  };

  const handleProductChange = (rowId, productId) => {
    const product = products.find(p => String(p.id) === String(productId));
    updateRow(rowId, { productId: product?.id, product, qty: product?.minOrderQty || 0.5 });
  };

  const rowTotal         = (row) => row.product ? row.product.pricePerKg * row.qty : 0;
  const validRows        = rows.filter(r => r.product);
  const filteredProducts = products.filter(p => {
    const matchCat    = catFilter === 'all' || String(p.categoryId) === catFilter;
    const matchSearch = !productSearch || p.name.toLowerCase().includes(productSearch.toLowerCase());
    return matchCat && matchSearch;
  });

  const sharedBillProps = {
    validRows, updateRow, removeRow, doReset,
    grandTotal, customerName, saleMutation, handleSubmit,
  };

  const sharedLeftProps = {
    customerName, customerMobile, setField,
    rows, products, categories,
    productSearch, setProductSearch,
    catFilter, setCatFilter,
    addRow, removeRow, updateRow,
    handleProductChange, quickAdd, filteredProducts, rowTotal,
  };

  return (
    <>
      {/* ── DESKTOP: side-by-side ── */}
      <div className="hidden md:flex gap-3 h-full" style={{ minHeight: 0 }}>
        <div className="flex-1 flex flex-col gap-3 min-w-0 overflow-y-auto pr-1" style={{ minHeight: 0 }}>
          <LeftPanelContent {...sharedLeftProps} />
        </div>
        <div
          className="flex flex-col bg-white rounded-2xl border border-stone-300 shadow-card overflow-hidden flex-shrink-0"
          style={{ width: '300px', minHeight: 0 }}>
          <BillPanel {...sharedBillProps} isMobile={false} onClose={() => {}} />
        </div>
      </div>

      {/* ── MOBILE: single column + floating cart + slide-up bill ── */}
      <div className="flex md:hidden flex-col h-full" style={{ minHeight: 0 }}>
        <div className="flex-1 overflow-y-auto pb-24">
          <div className="flex flex-col gap-3 p-3">
            <LeftPanelContent {...sharedLeftProps} />
          </div>
        </div>

        {/* Floating cart button */}
        {validRows.length > 0 && !showBillPanel && (
          <div className="fixed bottom-4 left-0 right-0 flex justify-center z-40 px-4">
            <button
              onClick={() => setShowBillPanel(true)}
              className="flex items-center justify-between w-full max-w-sm bg-brand-500 hover:bg-brand-600 text-white rounded-2xl py-3.5 px-5 shadow-2xl transition active:scale-95">
              <div className="flex items-center gap-2">
                <div className="relative">
                  <ShoppingCart size={20} />
                  <span className="absolute -top-2 -right-2 bg-white text-brand-500 text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                    {validRows.length}
                  </span>
                </div>
                <span className="text-sm font-semibold">
                  {validRows.length} item{validRows.length !== 1 ? 's' : ''}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold font-mono">₹{grandTotal.toFixed(0)}</span>
                <span className="text-xs bg-white/20 rounded-lg px-2 py-0.5 font-semibold">Pay via UPI →</span>
              </div>
            </button>
          </div>
        )}

        {/* Slide-up bill panel */}
        {showBillPanel && (
          <>
            <div className="fixed inset-0 bg-black/40 z-40" onClick={() => setShowBillPanel(false)} />
            <div
              className="fixed inset-x-0 bottom-0 top-12 z-50 bg-white rounded-t-2xl flex flex-col overflow-hidden shadow-2xl"
              style={{ animation: 'slideUp 0.25s ease-out' }}>
              <BillPanel {...sharedBillProps} isMobile={true} onClose={() => setShowBillPanel(false)} />
            </div>
          </>
        )}
      </div>

      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
      `}</style>

      {receipt && (
        <ReceiptModal order={receipt} onClose={() => setReceipt(null)} />
      )}
    </>
  );
}