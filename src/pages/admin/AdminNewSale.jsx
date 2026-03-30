import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { productsApi, categoriesApi, ordersApi, khataApi } from '../../services/api';
import api from '../../services/api';
import { usePosStore } from '../../store';
import {
  Plus, Printer, RotateCcw, ShoppingBag, Search, X,
  BookOpen, AlertTriangle, ChevronDown, Minus
} from 'lucide-react';
import { clsx } from 'clsx';
import toast from 'react-hot-toast';

// ── computeSplit ───────────────────────────────────────────────────────────────
function computeSplit(payState, grandTotal) {
  if (payState.mode === 'SPLIT') {
    const cash = parseFloat(payState.cashAmt) || 0;
    const upi  = parseFloat(payState.upiAmt)  || 0;
    return {
      cashDelta:    cash,
      accountDelta: upi,
      isValid:      cash + upi > 0,
      error:        cash + upi <= 0 ? 'Enter cash and UPI amounts' : null,
    };
  }
  return {
    cashDelta:    payState.mode === 'CASH' ? grandTotal : 0,
    accountDelta: (payState.mode === 'UPI' || payState.mode === 'CARD') ? grandTotal : 0,
    isValid:      true,
    error:        null,
  };
}

// ── QtyInput — controlled input that allows backspace + free typing ────────────
function QtyInput({ value, onCommit, step = 0.5, minQty = 0.5, className = '' }) {
  const [editing, setEditing]   = useState(false);
  const [draft,   setDraft]     = useState('');

  const commit = (raw) => {
    const parsed = parseFloat(raw);
    if (!isNaN(parsed) && parsed > 0) {
      onCommit(parseFloat(parsed.toFixed(3)));
    } else {
      // revert to current value
      onCommit(value);
    }
    setEditing(false);
    setDraft('');
  };

  if (editing) {
    return (
      <input
        type="number"
        min="0.001"
        step="any"
        autoFocus
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
        'text-center font-bold font-mono border border-stone-200 rounded bg-white',
        'hover:border-brand-400 hover:bg-brand-50 hover:text-brand-700 transition cursor-text',
        className
      )}>
      {value}kg
    </button>
  );
}

// ── PaymentSelector ────────────────────────────────────────────────────────────
// Always renders all 4 methods. khataMode=true shows partial amount field below.
function PaymentSelector({ total, value, onChange, khataMode }) {
  const methods = [
    { key: 'CASH',  icon: '💵', text: 'Cash'  },
    { key: 'UPI',   icon: '📱', text: 'UPI'   },
    { key: 'CARD',  icon: '💳', text: 'Card'  },
    { key: 'SPLIT', icon: '✂️', text: 'Split' },
  ];

  const cashVal = parseFloat(value.cashAmt) || 0;
  const upiVal  = parseFloat(value.upiAmt)  || 0;
  const splitSum = cashVal + upiVal;

  return (
    <div className="space-y-3">
      <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">
        {khataMode ? 'Payment Method (for amount paying now)' : 'Payment Method'}
      </p>

      {/* ✅ All 4 buttons always shown */}
      <div className="grid grid-cols-4 gap-1.5">
        {methods.map(m => (
          <button
            key={m.key}
            onClick={() => onChange({ ...value, mode: m.key, cashAmt: '', upiAmt: '' })}
            className={clsx(
              'flex flex-col items-center gap-0.5 py-2.5 rounded-xl border text-[11px] font-semibold transition',
              value.mode === m.key
                ? 'border-brand-500 bg-brand-50 text-brand-600'
                : 'border-stone-200 text-stone-500 hover:border-brand-300 hover:bg-stone-50'
            )}>
            <span className="text-lg leading-none">{m.icon}</span>
            {m.text}
          </button>
        ))}
      </div>

      {/* No method selected */}
      {!value.mode && (
        <p className="text-[10px] text-red-500 font-semibold flex items-center gap-1">
          <AlertTriangle size={10} /> Select a payment method
        </p>
      )}

      {/* ── SPLIT inputs (normal mode — full amount) ── */}
      {value.mode === 'SPLIT' && !khataMode && (
        <div className="space-y-2 bg-stone-50 rounded-xl p-3 border border-stone-200">
          <p className="text-[10px] font-semibold text-stone-500">
            Total ₹{total.toFixed(0)} — split between Cash and UPI
          </p>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-stone-400 mb-1 block">💵 Cash (₹)</label>
              <input
                type="number" min="0" step="1" placeholder="0"
                value={value.cashAmt}
                onChange={e => onChange({ ...value, cashAmt: e.target.value })}
                className="w-full border border-stone-200 rounded-lg px-2 py-1.5 text-xs font-mono focus:outline-none focus:border-brand-400"
              />
            </div>
            <div>
              <label className="text-[10px] text-stone-400 mb-1 block">📱 UPI/Card (₹)</label>
              <input
                type="number" min="0" step="1" placeholder="0"
                value={value.upiAmt}
                onChange={e => onChange({ ...value, upiAmt: e.target.value })}
                className="w-full border border-stone-200 rounded-lg px-2 py-1.5 text-xs font-mono focus:outline-none focus:border-brand-400"
              />
            </div>
          </div>
          {splitSum > 0 && (
            <div className="flex justify-between text-[10px] font-semibold pt-1 border-t border-stone-200">
              <span className="text-stone-500">Split total</span>
              <span className={clsx(
                'font-mono',
                Math.abs(splitSum - total) < 0.01 ? 'text-green-600' : 'text-amber-600'
              )}>
                ₹{splitSum.toFixed(0)}
                {Math.abs(splitSum - total) < 0.01 ? ' ✓' : ` (need ₹${total.toFixed(0)})`}
              </span>
            </div>
          )}
        </div>
      )}

      {/* ── SPLIT inputs (khata mode — partial split) ── */}
      {value.mode === 'SPLIT' && khataMode && (
        <div className="space-y-2 bg-amber-light/40 rounded-xl p-3 border border-amber-200">
          <p className="text-[10px] font-semibold text-amber-shop">
            Enter partial amounts — rest goes to Khata
          </p>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-stone-400 mb-1 block">💵 Cash (₹)</label>
              <input
                type="number" min="0" step="1" placeholder="0"
                value={value.cashAmt}
                onChange={e => onChange({ ...value, cashAmt: e.target.value })}
                className="w-full border border-stone-200 rounded-lg px-2 py-1.5 text-xs font-mono focus:outline-none focus:border-brand-400"
              />
            </div>
            <div>
              <label className="text-[10px] text-stone-400 mb-1 block">📱 UPI/Card (₹)</label>
              <input
                type="number" min="0" step="1" placeholder="0"
                value={value.upiAmt}
                onChange={e => onChange({ ...value, upiAmt: e.target.value })}
                className="w-full border border-stone-200 rounded-lg px-2 py-1.5 text-xs font-mono focus:outline-none focus:border-brand-400"
              />
            </div>
          </div>
          {splitSum > 0 && (
            <p className="text-[10px] text-stone-500">
              Paying ₹{splitSum.toFixed(0)} now · ₹{Math.max(0, total - splitSum).toFixed(0)} → Khata
            </p>
          )}
        </div>
      )}

      {/* ── Single method partial amount (khata mode, non-split) ── */}
      {khataMode && value.mode && value.mode !== 'SPLIT' && (
        <div className="bg-amber-light/40 rounded-xl p-3 border border-amber-200 space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-semibold text-amber-shop">
              Paying now via {value.mode} (₹)
            </label>
            <span className="text-[10px] text-stone-400">leave 0 → full bill on Khata</span>
          </div>
          <input
            type="number" min="0" step="1" placeholder="0"
            value={value.cashAmt}
            onChange={e => onChange({ ...value, cashAmt: e.target.value })}
            className="w-full border border-amber-300 rounded-lg px-2.5 py-2 text-sm font-mono focus:outline-none focus:border-brand-500 bg-white"
          />
          {cashVal > 0 && (
            <p className="text-[10px] text-stone-500 font-semibold">
              ₹{cashVal.toFixed(0)} now · ₹{Math.max(0, total - cashVal).toFixed(0)} → Khata
            </p>
          )}
        </div>
      )}
    </div>
  );
}

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
                <span className="font-semibold">₹{Number(item.total).toLocaleString('en-IN')}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-stone-200 pt-3 flex justify-between">
            <span className="font-bold text-stone-800">Bill Total</span>
            <span className="font-bold text-brand-500 text-lg">
              ₹{Number(order.total).toLocaleString('en-IN')}
            </span>
          </div>
          {khataInfo && (
            <div className="bg-amber-light border border-amber-200 rounded-xl p-3 space-y-1.5">
              <p className="text-xs font-bold text-amber-shop flex items-center gap-1">
                <BookOpen size={12} /> Khata — {khataInfo.accountName}
              </p>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between text-stone-500">
                  <span>Previous due</span>
                  <span className="font-mono font-bold text-amber-shop">
                    ₹{Number(khataInfo.prevDue).toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex justify-between text-stone-500">
                  <span>This bill</span>
                  <span className="font-mono">₹{Number(khataInfo.billTotal).toLocaleString('en-IN')}</span>
                </div>
                {khataInfo.cashPaid > 0 && (
                  <div className="flex justify-between text-green-shop">
                    <span>Paid — Cash</span>
                    <span className="font-mono">₹{Number(khataInfo.cashPaid).toLocaleString('en-IN')}</span>
                  </div>
                )}
                {khataInfo.upiPaid > 0 && (
                  <div className="flex justify-between text-blue-500">
                    <span>Paid — UPI/Card</span>
                    <span className="font-mono">₹{Number(khataInfo.upiPaid).toLocaleString('en-IN')}</span>
                  </div>
                )}
                <div className="flex justify-between text-amber-shop font-bold border-t border-amber-200 pt-1">
                  <span>Added to Khata</span>
                  <span className="font-mono">₹{Number(khataInfo.addedToKhata).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between font-bold text-sm border-t border-amber-200 pt-1">
                  <span className="text-stone-700">New Total Due</span>
                  <span className="font-mono text-amber-shop">
                    ₹{Number(khataInfo.newDue).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            </div>
          )}
          {!khataInfo && (
            <div className="text-xs text-stone-400 flex justify-between">
              <span>{order.customerName} · {order.customerMobile}</span>
              <span className="font-semibold">{order.paymentMethod}</span>
            </div>
          )}
        </div>
        <div className="flex gap-3 px-5 pb-5">
          <button onClick={() => window.print()}
            className="flex-1 flex items-center justify-center gap-1.5 border border-stone-200 rounded-xl py-2.5 text-sm font-medium text-stone-600 hover:bg-stone-50">
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

// ── Khata Card ─────────────────────────────────────────────────────────────────
function KhataCard({ account, billTotal, totalPaidNow }) {
  const prevDue     = Number(account.currentDue  || 0);
  const creditLimit = Number(account.creditLimit  || 0);
  const paid        = Math.min(Number(totalPaidNow || 0), billTotal);
  const toKhata     = Math.max(0, billTotal - paid);
  const newDue      = prevDue + toKhata;
  const usagePct    = creditLimit > 0 ? Math.min((newDue / creditLimit) * 100, 100) : 0;
  const overLimit   = creditLimit > 0 && newDue > creditLimit;
  const barColor    = usagePct > 85 ? '#b83a12' : usagePct > 60 ? '#9a5c00' : '#16713f';

  return (
    <div className={clsx(
      'rounded-xl border p-3 space-y-2',
      overLimit ? 'border-red-300 bg-red-50' : 'border-amber-200 bg-amber-light/60'
    )}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-bold text-stone-800">{account.customerName}</p>
          <p className="text-[10px] text-stone-400">{account.customerMobile}</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-stone-400">Credit Limit</p>
          <p className="text-xs font-bold text-stone-600 font-mono">
            ₹{creditLimit.toLocaleString('en-IN')}
          </p>
        </div>
      </div>
      <div>
        <div className="flex justify-between text-[10px] mb-1">
          <span className="text-stone-400">Limit usage after this sale</span>
          <span className={clsx('font-bold', overLimit ? 'text-red-500' : 'text-stone-500')}>
            {usagePct.toFixed(0)}%
          </span>
        </div>
        <div className="h-1.5 bg-stone-200 rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all"
            style={{ width: `${usagePct}%`, background: barColor }} />
        </div>
        {overLimit && (
          <p className="text-[10px] text-red-500 font-semibold mt-1 flex items-center gap-1">
            <AlertTriangle size={10} />
            Over limit by ₹{(newDue - creditLimit).toLocaleString('en-IN')}
          </p>
        )}
      </div>
      <div className="space-y-1 text-xs border-t border-amber-200 pt-2">
        <div className="flex justify-between text-stone-500">
          <span>Previous pending due</span>
          <span className="font-mono font-bold text-amber-shop">₹{prevDue.toLocaleString('en-IN')}</span>
        </div>
        <div className="flex justify-between text-stone-500">
          <span>This purchase</span>
          <span className="font-mono font-semibold">₹{billTotal.toFixed(0)}</span>
        </div>
        {paid > 0 && (
          <div className="flex justify-between text-green-shop">
            <span>Paying now</span>
            <span className="font-mono font-semibold">₹{paid.toFixed(0)}</span>
          </div>
        )}
        <div className="flex justify-between bg-amber-light/80 rounded-lg px-2 py-1.5">
          <span className="text-amber-shop font-semibold">Going to Khata</span>
          <span className="font-mono font-bold text-amber-shop">₹{toKhata.toFixed(0)}</span>
        </div>
        <div className={clsx(
          'flex justify-between rounded-lg px-2 py-1.5 border',
          overLimit ? 'bg-red-50 border-red-200' : 'bg-white border-amber-200'
        )}>
          <span className="font-bold text-stone-700">New Total Due</span>
          <span className={clsx('font-mono font-bold text-sm', overLimit ? 'text-red-500' : 'text-amber-shop')}>
            ₹{newDue.toLocaleString('en-IN')}
          </span>
        </div>
      </div>
    </div>
  );
}

// ── Admin New Sale ─────────────────────────────────────────────────────────────
export default function AdminNewSale() {
  const {
    rows, customerName, customerMobile,
    addRow, removeRow, updateRow, setField, reset, total, toPayload,
  } = usePosStore();

  const [receipt,       setReceipt]       = useState(null);
  const [receiptKhata,  setReceiptKhata]  = useState(null);
  const [productSearch, setProductSearch] = useState('');
  const [catFilter,     setCatFilter]     = useState('all');
  const [useKhata,      setUseKhata]      = useState(false);
  const [khataAccountId,setKhataAccountId]= useState('');

  // ✅ mode starts empty — forces admin to pick
  const [payState, setPayState] = useState({ mode: '', cashAmt: '', upiAmt: '' });

  const qc = useQueryClient();
  const { data: products   = [] } = useQuery('products-pos',   () => productsApi.getAll({ status: 'available' }), { staleTime: 60000  });
  const { data: categories = [] } = useQuery('categories-pos', categoriesApi.getAll,                              { staleTime: 300000 });
  const { data: khataData }       = useQuery('khata-summary',  khataApi.summary,                                  { staleTime: 30000  });

  const khataAccounts   = khataData?.accounts || [];
  const selectedAccount = khataAccounts.find(a => String(a.id) === String(khataAccountId));

  useEffect(() => {
    if (selectedAccount) {
      setField('customerName',   selectedAccount.customerName);
      setField('customerMobile', selectedAccount.customerMobile);
      setPayState(p => ({ ...p, cashAmt: '', upiAmt: '' }));
    }
  }, [khataAccountId]);

  const grandTotal = total();
  const { cashDelta, accountDelta } = computeSplit(payState, grandTotal);

  // ✅ totalPaidNow: for Khata — use cashAmt (single method) or split sum
  const totalPaidNow = (() => {
    if (!useKhata) return grandTotal;
    if (payState.mode === 'SPLIT') {
      return Math.min(cashDelta + accountDelta, grandTotal);
    }
    return Math.min(parseFloat(payState.cashAmt) || 0, grandTotal);
  })();

  const addedToKhata   = useKhata ? Math.max(0, grandTotal - totalPaidNow) : 0;
  const effectiveMethod = useKhata ? 'KHATA' : payState.mode === 'SPLIT' ? 'SPLIT' : payState.mode;

  const doReset = () => {
    reset();
    setUseKhata(false);
    setKhataAccountId('');
    setPayState({ mode: '', cashAmt: '', upiAmt: '' });
  };

  const saleMutation = useMutation(
    (payload) => ordersApi.posSale(payload),
    {
      onSuccess: async (order) => {
        if (useKhata && selectedAccount && addedToKhata > 0) {
          try {
            await api.post('/khata/entries', {
              accountId:     selectedAccount.id,
              entryType:     'DEBIT',
              amount:        addedToKhata,
              description:   `Sale #${order.orderNumber}`,
              referenceNote: `Bill ₹${grandTotal.toFixed(0)} | Paid ₹${totalPaidNow.toFixed(0)} | Khata ₹${addedToKhata.toFixed(0)}`,
            });
          } catch {
            toast.error('Sale recorded but Khata entry failed — add manually');
          }
          setReceiptKhata({
            accountName:  selectedAccount.customerName,
            prevDue:      Number(selectedAccount.currentDue || 0),
            billTotal:    grandTotal,
            cashPaid:     payState.mode === 'CASH'  ? totalPaidNow
                        : payState.mode === 'SPLIT' ? cashDelta : 0,
            upiPaid:      (payState.mode === 'UPI' || payState.mode === 'CARD') ? totalPaidNow
                        : payState.mode === 'SPLIT' ? accountDelta : 0,
            addedToKhata,
            newDue:       Number(selectedAccount.currentDue || 0) + addedToKhata,
          });
          qc.invalidateQueries('khata-summary');
          qc.invalidateQueries('khata');
        } else {
          setReceiptKhata(null);
        }
        setReceipt(order);
        doReset();
        qc.invalidateQueries('products-pos');
        qc.invalidateQueries('shop-settings-admin');
      },
      onError: (e) => toast.error(e.response?.data?.message || 'Sale failed'),
    }
  );

  const quickAdd = (product) => {
    const existing = rows.find(r => r.productId === product.id);
    if (existing) {
      updateRow(existing.id, {
        qty: parseFloat((existing.qty + (product.orderStep || 0.5)).toFixed(3))
      });
      toast.success(`+${product.orderStep || 0.5}kg — ${product.name}`, { duration: 700 });
      return;
    }
    const payload  = { productId: product.id, product, qty: product.minOrderQty || 0.5 };
    const emptyRow = rows.find(r => !r.product);
    if (emptyRow) updateRow(emptyRow.id, payload);
    else usePosStore.setState(s => ({ rows: [...s.rows, { id: Date.now(), ...payload }] }));
    toast.success(`${product.categoryIcon || '🥩'} ${product.name} added`, { duration: 700 });
  };

  const handleProductChange = (rowId, productId) => {
    const product = products.find(p => String(p.id) === String(productId));
    updateRow(rowId, { productId: product?.id, product, qty: product?.minOrderQty || 0.5 });
  };

  const handleSubmit = () => {
    if (!customerMobile || customerMobile.length < 10) { toast.error('Enter valid 10-digit mobile'); return; }
    if (rows.filter(r => r.product && r.qty > 0).length === 0) { toast.error('Add at least one product'); return; }
    if (useKhata && !khataAccountId) { toast.error('Select a Khata account'); return; }
    if (!payState.mode) { toast.error('Select a payment method'); return; }
    if (!useKhata && payState.mode === 'SPLIT') {
      const { isValid, error } = computeSplit(payState, grandTotal);
      if (!isValid) { toast.error(error); return; }
    }
    saleMutation.mutate({
      ...toPayload(),
      paymentMethod: effectiveMethod,
      cashPaid:
        payState.mode === 'CASH'    ? (useKhata ? totalPaidNow : grandTotal)
        : payState.mode === 'SPLIT' ? cashDelta
        : 0,
      upiPaid:
        (payState.mode === 'UPI' || payState.mode === 'CARD') ? (useKhata ? totalPaidNow : grandTotal)
        : payState.mode === 'SPLIT' ? accountDelta
        : 0,
    });
  };

  const rowTotal         = (row) => row.product ? row.product.pricePerKg * row.qty : 0;
  const validRows        = rows.filter(r => r.product);
  const filteredProducts = products.filter(p => {
    const matchCat    = catFilter === 'all' || String(p.categoryId) === catFilter;
    const matchSearch = !productSearch || p.name.toLowerCase().includes(productSearch.toLowerCase());
    return matchCat && matchSearch;
  });

  const billLabel = (() => {
    if (!payState.mode) return '— select method —';
    if (useKhata) {
      if (totalPaidNow === 0) return '📖 Full Khata';
      const pStr =
        payState.mode === 'SPLIT' ? `💵₹${cashDelta.toFixed(0)}+📱₹${accountDelta.toFixed(0)}`
        : payState.mode === 'CASH'  ? `💵₹${totalPaidNow.toFixed(0)}`
        :                             `📱₹${totalPaidNow.toFixed(0)}`;
      return `${pStr} + 📖₹${addedToKhata.toFixed(0)}`;
    }
    if (payState.mode === 'SPLIT') return `💵₹${cashDelta.toFixed(0)}+📱₹${accountDelta.toFixed(0)}`;
    return payState.mode === 'CASH' ? '💵 Cash' : payState.mode === 'UPI' ? '📱 UPI' : '💳 Card';
  })();

  return (
    <div className="flex gap-3 h-full" style={{ minHeight: 0 }}>

      {/* ── LEFT PANEL ── */}
      <div className="flex-1 flex flex-col gap-3 min-w-0 overflow-y-auto pr-1" style={{ minHeight: 0 }}>

        {/* Customer */}
        <div className="bg-white rounded-2xl border border-stone-200 shadow-card p-3 flex-shrink-0">
          <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-2">Customer</p>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-stone-400 mb-1 block">Name (optional)</label>
              <input value={customerName} onChange={e => setField('customerName', e.target.value)}
                placeholder="Customer name"
                className="w-full border border-stone-200 rounded-lg px-2.5 py-2 text-sm focus:outline-none focus:border-brand-400" />
            </div>
            <div>
              <label className="text-[10px] text-stone-400 mb-1 block">Mobile *</label>
              <input value={customerMobile}
                onChange={e => setField('customerMobile', e.target.value.replace(/\D/g,'').slice(0,10))}
                placeholder="10-digit mobile" type="tel" maxLength={10}
                className="w-full border border-stone-200 rounded-lg px-2.5 py-2 text-sm focus:outline-none focus:border-brand-400" />
            </div>
          </div>
        </div>

        {/* Products */}
        <div className="bg-white rounded-2xl border border-stone-200 shadow-card p-3 flex-shrink-0">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Products</p>
            <button onClick={addRow}
              className="flex items-center gap-1 text-[10px] font-semibold text-brand-500 hover:text-brand-700">
              <Plus size={11} /> Add row
            </button>
          </div>
          <div className="flex items-center gap-1.5 border border-stone-200 rounded-lg px-2 py-1.5 mb-2">
            <Search size={11} className="text-stone-400 flex-shrink-0" />
            <input value={productSearch} onChange={e => setProductSearch(e.target.value)}
              placeholder="Search products…"
              className="text-xs outline-none w-full placeholder:text-stone-300" />
          </div>
          <div className="flex gap-1.5 mb-3 flex-wrap">
            {[{ id: 'all', name: 'All', icon: '🥩' }, ...categories].map(c => (
              <button key={c.id} onClick={() => setCatFilter(String(c.id))}
                className={clsx('px-2.5 py-1 rounded-full text-[10px] font-semibold transition',
                  catFilter === String(c.id) ? 'bg-brand-500 text-white' : 'bg-stone-100 text-stone-500 hover:bg-stone-200')}>
                {c.icon} {c.name}
              </button>
            ))}
          </div>

          {/* Quick add grid */}
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5 mb-3">
            {filteredProducts.map(p => {
              const inCart = rows.some(r => r.productId === p.id);
              const isOut  = p.stockStatus === 'OUT_OF_STOCK';
              return (
                <button key={p.id} onClick={() => !isOut && quickAdd(p)} disabled={isOut}
                  className={clsx('rounded-xl border p-2 text-left transition',
                    isOut ? 'border-stone-100 bg-stone-50 opacity-40 cursor-not-allowed'
                    : inCart ? 'border-brand-400 bg-brand-50'
                    : 'border-stone-200 hover:border-brand-300 hover:bg-stone-50')}>
                  <div className="text-base mb-0.5">{p.categoryIcon || '🥩'}</div>
                  <div className="text-[10px] font-semibold text-stone-700 truncate">{p.name}</div>
                  <div className="text-[10px] text-brand-500 font-bold">₹{p.pricePerKg}/kg</div>
                  {inCart && <div className="text-[9px] text-brand-400 font-bold">✓ Added</div>}
                </button>
              );
            })}
          </div>

          {/* Row table */}
          <div className="border-t border-stone-100 pt-3">
            <div className="grid grid-cols-[2fr_90px_70px_64px_20px] gap-1.5 mb-1.5 px-0.5">
              {['Product', 'Qty (kg)', 'Rate', 'Amount', ''].map((h, i) => (
                <div key={i} className="text-[9px] font-bold text-stone-400 uppercase">{h}</div>
              ))}
            </div>
            {rows.map(row => (
              <div key={row.id}
                className="grid grid-cols-[2fr_90px_70px_64px_20px] gap-1.5 mb-1.5 items-center">
                <select value={row.productId || ''} onChange={e => handleProductChange(row.id, e.target.value)}
                  className="border border-stone-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-brand-400 bg-white">
                  <option value="">Select…</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id} disabled={p.stockStatus === 'OUT_OF_STOCK'}>{p.name}</option>
                  ))}
                </select>

                {/* ✅ QtyInput component — handles backspace cleanly */}
                <QtyInput
                  value={row.qty}
                  step={row.product?.orderStep || 0.5}
                  minQty={row.product?.minOrderQty || 0.5}
                  onCommit={val => updateRow(row.id, { qty: val })}
                  className="w-full py-1.5 text-xs"
                />

                <div className="text-[10px] text-stone-400 text-right font-mono">
                  {row.product ? `₹${row.product.pricePerKg}` : '—'}
                </div>
                <div className="text-xs font-bold text-stone-800 text-right font-mono">
                  {row.product ? `₹${rowTotal(row).toFixed(0)}` : '—'}
                </div>
                <button onClick={() => removeRow(row.id)} className="text-stone-300 hover:text-red-500">
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
        <div className="bg-white rounded-2xl border border-stone-200 shadow-card p-3 flex-shrink-0 space-y-3">
          <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Payment</p>

          {/* Khata toggle */}
          <label className="flex items-center gap-2 cursor-pointer select-none p-2 rounded-xl border border-stone-200 hover:bg-stone-50 transition">
            <input type="checkbox" checked={useKhata}
              onChange={e => {
                setUseKhata(e.target.checked);
                if (!e.target.checked) { setKhataAccountId(''); setPayState({ mode: '', cashAmt: '', upiAmt: '' }); }
              }}
              className="w-4 h-4 rounded accent-brand-500" />
            <BookOpen size={14} className="text-amber-shop" />
            <span className="text-xs font-semibold text-stone-700">Add to Khata (Credit Account)</span>
          </label>

          {/* Khata account */}
          {useKhata && (
            <div>
              <label className="text-[10px] text-stone-400 mb-1 block">Khata Account *</label>
              <div className="relative">
                <select value={khataAccountId} onChange={e => setKhataAccountId(e.target.value)}
                  className="w-full border border-amber-300 rounded-xl px-3 py-2.5 text-xs font-semibold focus:outline-none bg-white appearance-none pr-8">
                  <option value="">— Choose account —</option>
                  {khataAccounts.map(a => (
                    <option key={a.id} value={a.id}>
                      {a.customerName} ({a.customerMobile}) · Due ₹{Number(a.currentDue).toLocaleString('en-IN')}
                    </option>
                  ))}
                </select>
                <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
              </div>
              {khataAccounts.length === 0 && (
                <p className="text-[10px] text-amber-shop mt-1 flex items-center gap-1">
                  <AlertTriangle size={10} /> No Khata accounts. Create one first.
                </p>
              )}
            </div>
          )}

          <div className="border-t border-stone-100" />

          {/* ✅ PaymentSelector — always visible, no SplitPayment import */}
          <PaymentSelector
            total={grandTotal}
            value={payState}
            onChange={setPayState}
            khataMode={useKhata}
          />

          {/* Khata breakdown card */}
          {useKhata && selectedAccount && (
            <KhataCard
              account={selectedAccount}
              billTotal={grandTotal}
              totalPaidNow={totalPaidNow}
            />
          )}
        </div>

      </div>{/* end left */}

      {/* ── RIGHT PANEL — Bill ── */}
      <div className="flex flex-col bg-white rounded-2xl border border-stone-200 shadow-card overflow-hidden flex-shrink-0"
        style={{ width: '300px', minHeight: 0 }}>

        <div className="flex items-center justify-between px-4 py-3 border-b border-stone-100 flex-shrink-0 bg-stone-50">
          <div>
            <p className="text-sm font-bold text-stone-800">Bill</p>
            <p className="text-[10px] text-stone-400">{validRows.length} item{validRows.length !== 1 ? 's' : ''}</p>
          </div>
          <button onClick={doReset}
            className="flex items-center gap-1 text-[10px] text-stone-400 hover:text-red-500 border border-stone-200 rounded-lg px-2 py-1 transition">
            <RotateCcw size={10} /> Clear
          </button>
        </div>

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
                      <p className="text-[10px] text-stone-400 mb-1">₹{row.product?.pricePerKg}/kg</p>

                      {/* ✅ Stepper + QtyInput in bill panel */}
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => updateRow(row.id, {
                            qty: Math.max(minQty, parseFloat((row.qty - step).toFixed(3)))
                          })}
                          className="w-6 h-6 border border-stone-200 rounded flex items-center justify-center text-stone-400 hover:bg-red-50 hover:text-red-500 transition">
                          <Minus size={10} />
                        </button>

                        {/* ✅ QtyInput — tap to type, backspace works */}
                        <QtyInput
                          value={row.qty}
                          step={step}
                          minQty={minQty}
                          onCommit={val => updateRow(row.id, { qty: val })}
                          className="w-16 py-0.5 text-[10px]"
                        />

                        <button
                          onClick={() => updateRow(row.id, {
                            qty: parseFloat((row.qty + step).toFixed(3))
                          })}
                          className="w-6 h-6 border border-stone-200 rounded flex items-center justify-center text-stone-400 hover:bg-green-50 hover:text-green-600 transition">
                          <Plus size={10} />
                        </button>

                        <span className="text-[10px] text-stone-400 font-mono ml-1">
                          @₹{row.product?.pricePerKg}
                        </span>
                      </div>
                      <p className="text-[9px] text-stone-400 mt-0.5">Tap qty to type</p>
                    </div>

                    <div className="text-right flex-shrink-0">
                      {/* ✅ live cost */}
                      <p className="text-sm font-bold text-stone-800 font-mono">₹{rowTotal(row).toFixed(0)}</p>
                      <button onClick={() => removeRow(row.id)} className="text-stone-300 hover:text-red-400 mt-0.5">
                        <X size={11} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Bill footer */}
        <div className="border-t border-stone-200 px-4 py-3 bg-stone-50 flex-shrink-0 space-y-1.5">
          <div className="flex justify-between text-xs text-stone-500">
            <span>Bill Total</span><span className="font-mono">₹{grandTotal.toFixed(0)}</span>
          </div>
          {!useKhata && payState.mode === 'SPLIT' && (cashDelta + accountDelta) > 0 && (
            <>
              {cashDelta > 0 && (
                <div className="flex justify-between text-xs text-green-shop">
                  <span>💵 Cash</span><span className="font-mono">₹{cashDelta.toFixed(0)}</span>
                </div>
              )}
              {accountDelta > 0 && (
                <div className="flex justify-between text-xs text-blue-500">
                  <span>📱 UPI/Card</span><span className="font-mono">₹{accountDelta.toFixed(0)}</span>
                </div>
              )}
            </>
          )}
          {useKhata && selectedAccount && (
            <>
              {totalPaidNow > 0 && (
                <div className="flex justify-between text-xs text-green-shop">
                  <span>Paying now</span><span className="font-mono">₹{totalPaidNow.toFixed(0)}</span>
                </div>
              )}
              {addedToKhata > 0 && (
                <div className="flex justify-between text-xs text-amber-shop">
                  <span>To Khata</span><span className="font-mono">₹{addedToKhata.toFixed(0)}</span>
                </div>
              )}
              <div className="flex justify-between text-xs text-stone-400">
                <span>Prev due</span>
                <span className="font-mono">₹{Number(selectedAccount.currentDue || 0).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-xs font-bold text-amber-shop border-t border-stone-200 pt-1">
                <span>New Total Due</span>
                <span className="font-mono">₹{(Number(selectedAccount.currentDue || 0) + addedToKhata).toLocaleString('en-IN')}</span>
              </div>
            </>
          )}
          <div className="flex justify-between items-center pt-1 border-t border-stone-200">
            <span className="text-sm font-bold text-stone-800">Total</span>
            <span className="text-xl font-bold text-brand-500 font-mono">₹{grandTotal.toFixed(0)}</span>
          </div>
          <div className="text-[10px] text-stone-400 flex justify-between">
            <span>{customerName || 'Walk-in'}</span>
            <span className={clsx('font-semibold text-right max-w-[150px] truncate', !payState.mode && 'text-red-400')}>
              {billLabel}
            </span>
          </div>
        </div>

        <div className="p-3 flex-shrink-0">
          <button onClick={handleSubmit}
            disabled={saleMutation.isLoading || grandTotal === 0}
            className="w-full flex items-center justify-center gap-2 bg-brand-500 hover:bg-brand-600 text-white rounded-xl py-3 text-sm font-bold transition disabled:opacity-50 shadow-brand">
            {saleMutation.isLoading
              ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              : <><ShoppingBag size={15} /> Complete Sale</>}
          </button>
        </div>
      </div>

      {receipt && (
        <ReceiptModal order={receipt} khataInfo={receiptKhata}
          onClose={() => { setReceipt(null); setReceiptKhata(null); }} />
      )}
    </div>
  );
}