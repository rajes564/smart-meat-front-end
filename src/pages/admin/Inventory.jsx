import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useLocation } from 'react-router-dom';
import { inventoryApi, supplierApi, productsApi } from '../../services/api';
import { useForm } from 'react-hook-form';
import {
  Plus, X, BookOpen, Truck, Package, TrendingDown,
  TrendingUp, AlertTriangle, ChevronDown, ChevronUp,
  DollarSign, Banknote, CreditCard, BarChart3
} from 'lucide-react';
import { clsx } from 'clsx';
import toast from 'react-hot-toast';

// ─────────────────────────────────────────────────────────────────────────────
// SUPPLIER LEDGER MODAL
// ─────────────────────────────────────────────────────────────────────────────
function SupplierLedgerModal({ supplier, onClose }) {
  const qc = useQueryClient();
  const { register, handleSubmit, reset, watch, setValue } = useForm({
    defaultValues: { entryType: 'CREDIT', cashAmount: '', accountAmount: '' }
  });
  const entryType   = watch('entryType');
  const cashAmt     = Number(watch('cashAmount')    || 0);
  const accountAmt  = Number(watch('accountAmount') || 0);
  const totalEntry  = cashAmt + accountAmt;

  const { data: ledgerData, isLoading } = useQuery(
    ['supplier-ledger', supplier.id],
    () => supplierApi.getLedger(supplier.id),
    { staleTime: 10000 }
  );

  const entryMutation = useMutation(
    (data) => supplierApi.addEntry({ ...data, supplierId: supplier.id }),
    {
      onSuccess: () => {
        qc.invalidateQueries(['supplier-ledger', supplier.id]);
        qc.invalidateQueries('suppliers');
        qc.invalidateQueries('shop-balances');
        reset({ entryType, cashAmount: '', accountAmount: '' });
        toast.success('Ledger entry recorded!');
      },
      onError: (e) => toast.error(e.response?.data?.message || 'Failed'),
    }
  );

  const onSubmit = (data) => {
    const total = Number(data.cashAmount || 0) + Number(data.accountAmount || 0);
    if (total <= 0) { toast.error('Enter cash or account amount'); return; }
    entryMutation.mutate({
      entryType:     data.entryType,
      amount:        total,
      cashAmount:    Number(data.cashAmount   || 0),
      accountAmount: Number(data.accountAmount || 0),
      description:   data.description,
    });
  };

  const entries = ledgerData?.entries || [];
  const s       = ledgerData?.supplier || supplier;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-2xl my-6 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-stone-200">
          <div>
            <h2 className="text-base font-bold text-stone-800">
              {s.name} — Supplier Ledger
            </h2>
            <p className="text-xs text-stone-400">{s.mobile || 'No mobile'}</p>
          </div>
          <div className="text-right mr-4">
            <p className="text-xl font-bold text-brand-500">
              ₹{Number(s.currentDue || 0).toLocaleString('en-IN')}
            </p>
            <p className="text-xs text-stone-400">outstanding</p>
          </div>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-700">
            <X size={20} />
          </button>
        </div>

        {/* Ledger table */}
        <div className="max-h-64 overflow-y-auto">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 border-2 border-brand-400 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-stone-50 border-b border-stone-200">
                <tr>
                  {['Date','Description','Debit','Cash Paid','A/C Paid','Balance'].map((h,i) => (
                    <th key={h} className={clsx(
                      'px-3 py-2.5 text-xs font-semibold',
                      i >= 2 ? 'text-right' : 'text-left',
                      i === 2 ? 'text-brand-400' : i === 3 ? 'text-green-shop' : i === 4 ? 'text-blue-500' : 'text-stone-400'
                    )}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {entries.map(e => (
                  <tr key={e.id} className="border-b border-stone-100 hover:bg-stone-50">
                    <td className="px-3 py-2.5 text-xs font-mono text-stone-400 whitespace-nowrap">
                      {e.entryDate}
                    </td>
                    <td className="px-3 py-2.5 text-xs text-stone-600 max-w-[160px] truncate">
                      {e.description || '—'}
                    </td>
                    <td className="px-3 py-2.5 text-right text-xs font-bold text-brand-500">
                      {e.entryType === 'DEBIT' ? `₹${Number(e.amount).toLocaleString('en-IN')}` : '—'}
                    </td>
                    <td className="px-3 py-2.5 text-right text-xs font-semibold text-green-shop">
                      {Number(e.cashAmount) > 0 ? `₹${Number(e.cashAmount).toLocaleString('en-IN')}` : '—'}
                    </td>
                    <td className="px-3 py-2.5 text-right text-xs font-semibold text-blue-500">
                      {Number(e.accountAmount) > 0 ? `₹${Number(e.accountAmount).toLocaleString('en-IN')}` : '—'}
                    </td>
                    <td className={clsx(
                      'px-3 py-2.5 text-right text-xs font-bold font-mono',
                      Number(e.runningBalance) > 0 ? 'text-brand-500' : 'text-green-shop'
                    )}>
                      ₹{Math.abs(Number(e.runningBalance)).toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))}
                {entries.length === 0 && (
                  <tr><td colSpan={6} className="py-8 text-center text-xs text-stone-400">
                    No entries yet
                  </td></tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Add entry form */}
        <form onSubmit={handleSubmit(onSubmit)}
          className="p-5 border-t border-stone-200 bg-stone-50 space-y-3">
          <p className="text-xs font-bold text-stone-500 uppercase tracking-wide">Add Entry</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {/* Type */}
            <div>
              <label className="block text-xs font-semibold text-stone-400 mb-1">Type</label>
              <select {...register('entryType')}
                className="w-full border border-stone-200 rounded-lg px-2 py-2 text-sm focus:outline-none bg-white">
                <option value="CREDIT">💰 Payment Made (to supplier)</option>
                <option value="DEBIT">🛒 New Purchase</option>
              </select>
            </div>
            {/* Description */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-stone-400 mb-1">Description</label>
              <input {...register('description')} placeholder="e.g. Paid via GPay"
                className="w-full border border-stone-200 rounded-lg px-2 py-2 text-sm focus:outline-none focus:border-brand-400" />
            </div>
          </div>
          {/* Cash / Account split */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-stone-400 mb-1 flex items-center gap-1">
                <Banknote size={11} className="text-green-shop" />
                Cash Amount (₹)
              </label>
              <input type="number" step="0.01" min="0" {...register('cashAmount')}
                placeholder="0"
                className="w-full border border-stone-200 rounded-lg px-2 py-2 text-sm focus:outline-none focus:border-green-400" />
            </div>
            <div>
              <label className="text-xs font-semibold text-stone-400 mb-1 flex items-center gap-1">
                <CreditCard size={11} className="text-blue-500" />
                Account / UPI (₹)
              </label>
              <input type="number" step="0.01" min="0" {...register('accountAmount')}
                placeholder="0"
                className="w-full border border-stone-200 rounded-lg px-2 py-2 text-sm focus:outline-none focus:border-blue-400" />
            </div>
          </div>
          {totalEntry > 0 && (
            <div className="text-xs text-stone-500 bg-white rounded-lg px-3 py-2 border border-stone-200">
              Total: <span className="font-bold text-stone-800">₹{totalEntry.toLocaleString('en-IN')}</span>
              {cashAmt > 0 && <span className="ml-3 text-green-shop">Cash ₹{cashAmt.toLocaleString('en-IN')}</span>}
              {accountAmt > 0 && <span className="ml-3 text-blue-500">A/C ₹{accountAmt.toLocaleString('en-IN')}</span>}
            </div>
          )}
          <button type="submit" disabled={entryMutation.isLoading}
            className={clsx('w-full py-2.5 rounded-xl text-sm font-bold transition disabled:opacity-60',
              entryType === 'CREDIT'
                ? 'bg-green-shop hover:bg-green-700 text-white'
                : 'bg-brand-500 hover:bg-brand-600 text-white')}>
            {entryMutation.isLoading ? 'Saving…'
              : entryType === 'CREDIT' ? '+ Record Payment to Supplier' : '+ Add Purchase Entry'}
          </button>
        </form>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// NEW SUPPLIER MODAL
// ─────────────────────────────────────────────────────────────────────────────
function NewSupplierModal({ onClose, products }) {
  const qc = useQueryClient();
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: { creditLimit: 0 }
  });

  const mutation = useMutation(supplierApi.create, {
    onSuccess: () => {
      qc.invalidateQueries('suppliers');
      toast.success('Supplier created!');
      onClose();
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed'),
  });

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden"
        style={{ animation: 'modalFade 0.3s ease both' }}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-200 bg-stone-50">
          <div className="flex items-center gap-2">
            <Truck size={16} className="text-brand-500" />
            <h3 className="text-sm font-bold text-stone-800">New Supplier</h3>
          </div>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-700">
            <X size={18} />
          </button>
        </div>
        <form onSubmit={handleSubmit(d => mutation.mutate(d))} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-stone-500 mb-1.5">Supplier Name *</label>
              <input {...register('name', { required: 'Name is required' })}
                placeholder="e.g. Raju Fish Market"
                className={clsx('w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-100',
                  errors.name ? 'border-red-400' : 'border-stone-200 focus:border-brand-400')} />
              {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-500 mb-1.5">Mobile</label>
              <input {...register('mobile')} type="tel" maxLength={10} placeholder="10-digit"
                className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-brand-400" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-500 mb-1.5">Credit Limit (₹)</label>
              <input {...register('creditLimit', { valueAsNumber: true })} type="number" min="0" placeholder="0"
                className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-brand-400" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-stone-500 mb-1.5">Products Supplied</label>
              <input {...register('products')} placeholder="e.g. Rohu, Catla, Chicken"
                className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-brand-400" />
              <p className="text-[10px] text-stone-400 mt-1">Comma-separated product names for reference</p>
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-stone-500 mb-1.5">Address</label>
              <textarea {...register('address')} rows={2} placeholder="Supplier address"
                className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-brand-400 resize-none" />
            </div>
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={onClose}
              className="flex-1 border border-stone-200 rounded-xl py-2.5 text-sm font-medium text-stone-600 hover:bg-stone-50">
              Cancel
            </button>
            <button type="submit" disabled={mutation.isLoading}
              className="flex-1 bg-brand-500 hover:bg-brand-600 text-white rounded-xl py-2.5 text-sm font-bold shadow-brand transition disabled:opacity-60 flex items-center justify-center gap-2">
              {mutation.isLoading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              {mutation.isLoading ? 'Creating…' : 'Create Supplier'}
            </button>
          </div>
        </form>
        <style>{`@keyframes modalFade { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }`}</style>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ADD PURCHASE MODAL
// ─────────────────────────────────────────────────────────────────────────────
function AddPurchaseModal({ onClose, suppliers, products }) {
  const qc = useQueryClient();
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm({
    defaultValues: { paymentMode: 'CASH', amountPaid: 0, cashPaid: 0, accountPaid: 0 }
  });

  const qty          = Number(watch('qty')          || 0);
  const costPerKg    = Number(watch('costPerKg')     || 0);
  const paymentMode  = watch('paymentMode');
  const amountPaid   = Number(watch('amountPaid')    || 0);
  const cashPaid     = Number(watch('cashPaid')      || 0);
  const accountPaid  = Number(watch('accountPaid')   || 0);
  const totalCost    = qty * costPerKg;
  const effectivePaid = paymentMode === 'SPLIT' ? cashPaid + accountPaid : amountPaid;
  const due          = Math.max(0, totalCost - effectivePaid);

  const mutation = useMutation(inventoryApi.addPurchase, {
    onSuccess: () => {
      qc.invalidateQueries('inventory');
      qc.invalidateQueries('suppliers');
      qc.invalidateQueries('shop-balances');
      qc.invalidateQueries('products-pos');
      toast.success('Purchase recorded!');
      onClose();
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const onSubmit = (data) => {
    const total     = Number(data.qty) * Number(data.costPerKg);
    const paid      = data.paymentMode === 'SPLIT'
      ? Number(data.cashPaid || 0) + Number(data.accountPaid || 0)
      : Number(data.amountPaid || 0);
    const cashPd    = data.paymentMode === 'CASH'  ? paid
                    : data.paymentMode === 'SPLIT' ? Number(data.cashPaid || 0) : 0;
    const acctPd    = data.paymentMode === 'UPI' || data.paymentMode === 'CARD' ? paid
                    : data.paymentMode === 'SPLIT' ? Number(data.accountPaid || 0) : 0;
    mutation.mutate({
      productId:     Number(data.productId),
      supplierId:    data.supplierId ? Number(data.supplierId) : undefined,
      supplierName:  data.supplierName,
      qty:           Number(data.qty),
      costPerKg:     Number(data.costPerKg),
      amountPaid:    paid,
      cashPaid:      cashPd,
      accountPaid:   acctPd,
      paymentMode:   data.paymentMode,
      invoiceNo:     data.invoiceNo,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-lg my-6 shadow-2xl overflow-hidden"
        style={{ animation: 'modalFade 0.3s ease both' }}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-200 bg-stone-50">
          <div className="flex items-center gap-2">
            <Package size={16} className="text-brand-500" />
            <h3 className="text-sm font-bold text-stone-800">Record Stock Purchase</h3>
          </div>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-700"><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {/* Product */}
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-stone-500 mb-1.5">Product *</label>
              <select {...register('productId', { required: 'Product required' })}
                className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none bg-white">
                <option value="">Select product…</option>
                {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              {errors.productId && <p className="text-xs text-red-500 mt-1">{errors.productId.message}</p>}
            </div>

            {/* Supplier */}
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-stone-500 mb-1.5">Supplier</label>
              <select {...register('supplierId')}
                onChange={e => {
                  const s = suppliers.find(s => String(s.id) === e.target.value);
                  setValue('supplierId', e.target.value);
                  if (s) setValue('supplierName', s.name);
                }}
                className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none bg-white">
                <option value="">— Select or type below —</option>
                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name} (Due: ₹{Number(s.currentDue).toLocaleString('en-IN')})</option>)}
              </select>
              <input {...register('supplierName')} placeholder="Or type supplier name manually"
                className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-brand-400 mt-1.5" />
            </div>

            {/* Qty + Cost */}
            <div>
              <label className="block text-xs font-semibold text-stone-500 mb-1.5">Qty (kg) *</label>
              <input {...register('qty', { required: true, valueAsNumber: true, min: 0.1 })}
                type="number" step="0.5" placeholder="0"
                className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-brand-400" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-500 mb-1.5">Cost/kg (₹) *</label>
              <input {...register('costPerKg', { required: true, valueAsNumber: true, min: 0.01 })}
                type="number" step="0.01" placeholder="0.00"
                className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-brand-400" />
            </div>

            {/* Invoice */}
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-stone-500 mb-1.5">Invoice No.</label>
              <input {...register('invoiceNo')} placeholder="Optional"
                className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-brand-400" />
            </div>
          </div>

          {/* Total cost display */}
          {totalCost > 0 && (
            <div className="bg-stone-50 rounded-xl px-4 py-2.5 flex justify-between items-center border border-stone-200">
              <span className="text-sm text-stone-600 font-medium">Total Cost</span>
              <span className="text-lg font-bold text-brand-500 font-mono">₹{totalCost.toFixed(0)}</span>
            </div>
          )}

          {/* Payment mode */}
          <div>
            <label className="block text-xs font-semibold text-stone-500 mb-2">Payment Mode</label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { value: 'CASH',  label: '💵 Cash'   },
                { value: 'UPI',   label: '📱 UPI'    },
                { value: 'CARD',  label: '💳 Card'   },
                { value: 'SPLIT', label: '🔀 Split'  },
              ].map(opt => (
                <button key={opt.value} type="button"
                  onClick={() => setValue('paymentMode', opt.value)}
                  className={clsx('border-2 rounded-xl py-2 text-xs font-semibold transition',
                    paymentMode === opt.value
                      ? 'border-brand-500 bg-brand-50 text-brand-700'
                      : 'border-stone-200 text-stone-500 hover:border-stone-300')}>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Payment amounts */}
          {paymentMode === 'SPLIT' ? (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-stone-500 mb-1.5 flex items-center gap-1">
                  <Banknote size={11} className="text-green-shop" /> Cash (₹)
                </label>
                <input {...register('cashPaid', { valueAsNumber: true })}
                  type="number" step="0.01" min="0" placeholder="0"
                  className="w-full border border-green-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-green-400" />
              </div>
              <div>
                <label className="text-xs font-semibold text-stone-500 mb-1.5 flex items-center gap-1">
                  <CreditCard size={11} className="text-blue-500" /> UPI / Account (₹)
                </label>
                <input {...register('accountPaid', { valueAsNumber: true })}
                  type="number" step="0.01" min="0" placeholder="0"
                  className="w-full border border-blue-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400" />
              </div>
              {(cashPaid + accountPaid) > 0 && (
                <div className="col-span-2 text-xs text-stone-500 bg-white border border-stone-200 rounded-lg px-3 py-2">
                  Paid: <span className="text-green-shop font-bold">Cash ₹{cashPaid}</span>
                  <span className="mx-2">+</span>
                  <span className="text-blue-500 font-bold">A/C ₹{accountPaid}</span>
                  <span className="mx-2">=</span>
                  <span className="font-bold text-stone-800">₹{(cashPaid + accountPaid).toFixed(0)}</span>
                </div>
              )}
            </div>
          ) : (
            <div>
              <label className="block text-xs font-semibold text-stone-500 mb-1.5">
                Amount Paid Now (₹)
                <span className="text-stone-400 font-normal ml-1">(0 = full credit)</span>
              </label>
              <input {...register('amountPaid', { valueAsNumber: true })}
                type="number" step="0.01" min="0" placeholder="0"
                className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-brand-400" />
            </div>
          )}

          {/* Due summary */}
          {totalCost > 0 && (
            <div className={clsx('rounded-xl px-4 py-3 grid grid-cols-3 gap-3 text-center border',
              due > 0 ? 'bg-amber-light border-amber-200' : 'bg-green-light border-green-200')}>
              <div>
                <p className="text-[10px] text-stone-400">Total</p>
                <p className="text-sm font-bold font-mono">₹{totalCost.toFixed(0)}</p>
              </div>
              <div>
                <p className="text-[10px] text-stone-400">Paid</p>
                <p className="text-sm font-bold font-mono text-green-shop">₹{effectivePaid.toFixed(0)}</p>
              </div>
              <div>
                <p className="text-[10px] text-stone-400">Due to Supplier</p>
                <p className={clsx('text-sm font-bold font-mono', due > 0 ? 'text-amber-shop' : 'text-green-shop')}>
                  ₹{due.toFixed(0)}
                </p>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 border border-stone-200 rounded-xl py-2.5 text-sm font-medium text-stone-600 hover:bg-stone-50">
              Cancel
            </button>
            <button type="submit" disabled={mutation.isLoading}
              className="flex-1 bg-brand-500 hover:bg-brand-600 text-white rounded-xl py-2.5 text-sm font-bold shadow-brand disabled:opacity-60 flex items-center justify-center gap-2">
              {mutation.isLoading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              {mutation.isLoading ? 'Saving…' : 'Record Purchase'}
            </button>
          </div>
        </form>
        <style>{`@keyframes modalFade { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }`}</style>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// BALANCE ADJUST MODAL
// ─────────────────────────────────────────────────────────────────────────────
function BalanceAdjustModal({ onClose, currentCash, currentAccount }) {
  const qc = useQueryClient();
  const [type,   setType]   = useState('cash');
  const [amount, setAmount] = useState('');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!amount || isNaN(amount)) { toast.error('Enter a valid amount'); return; }
    setSaving(true);
    try {
      await supplierApi.adjustBalance(type, Number(amount));
      qc.invalidateQueries('shop-balances');
      qc.invalidateQueries('shop-settings');
      toast.success('Balance updated!');
      onClose();
    } catch (e) {
      toast.error('Failed to update balance');
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-6"
        style={{ animation: 'modalFade 0.3s ease both' }}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-stone-800">Adjust Opening Balance</h3>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-700"><X size={18} /></button>
        </div>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={() => setType('cash')}
              className={clsx('border-2 rounded-xl py-3 text-xs font-bold transition',
                type === 'cash' ? 'border-green-400 bg-green-light text-green-shop' : 'border-stone-200 text-stone-500')}>
              <Banknote size={16} className="mx-auto mb-1" />
              Cash
              <p className="text-[10px] font-normal mt-0.5">Current: ₹{Number(currentCash).toLocaleString('en-IN')}</p>
            </button>
            <button type="button" onClick={() => setType('account')}
              className={clsx('border-2 rounded-xl py-3 text-xs font-bold transition',
                type === 'account' ? 'border-blue-400 bg-blue-50 text-blue-600' : 'border-stone-200 text-stone-500')}>
              <CreditCard size={16} className="mx-auto mb-1" />
              Account
              <p className="text-[10px] font-normal mt-0.5">Current: ₹{Number(currentAccount).toLocaleString('en-IN')}</p>
            </button>
          </div>
          <div>
            <label className="block text-xs font-semibold text-stone-500 mb-1.5">
              Set {type === 'cash' ? 'Cash' : 'Account'} Balance to (₹)
            </label>
            <input type="number" value={amount} onChange={e => setAmount(e.target.value)}
              placeholder="Enter actual balance"
              className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-brand-400" />
          </div>
          <div className="flex gap-3">
            <button onClick={onClose}
              className="flex-1 border border-stone-200 rounded-xl py-2.5 text-sm font-medium text-stone-600">
              Cancel
            </button>
            <button onClick={save} disabled={saving}
              className="flex-1 bg-brand-500 hover:bg-brand-600 text-white rounded-xl py-2.5 text-sm font-bold disabled:opacity-60">
              {saving ? 'Saving…' : 'Update Balance'}
            </button>
          </div>
        </div>
        <style>{`@keyframes modalFade { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }`}</style>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN INVENTORY PAGE
// ─────────────────────────────────────────────────────────────────────────────
export default function InventoryAdmin() {
  const location = useLocation();
  const [tab, setTab] = useState(
    location.pathname.includes('suppliers') ? 'suppliers' : 'dashboard'
  );
  const [ledgerFor,      setLedgerFor]      = useState(null);
  const [showNewSupplier,setShowNewSupplier] = useState(false);
  const [showAddPurchase,setShowAddPurchase] = useState(false);
  const [showAdjustBal,  setShowAdjustBal]  = useState(false);

  const { data: suppliers  = [] } = useQuery('suppliers',    supplierApi.getAll,      { staleTime: 30000 });
  const { data: purchases  = [] } = useQuery('inventory',    () => inventoryApi.getAll({}), { staleTime: 15000 });
  const { data: products   = [] } = useQuery('products-all', () => import('../../services/api').then(m => m.productsApi.getAll({})), { staleTime: 60000 });
  const { data: balances }        = useQuery('shop-balances', supplierApi.getBalances, { staleTime: 10000 });

  const cashBalance    = Number(balances?.cashBalance    || 0);
  const accountBalance = Number(balances?.accountBalance || 0);
  const totalBalance   = cashBalance + accountBalance;

  const totalDue = suppliers.reduce((s, a) => s + Number(a.currentDue || 0), 0);
  const recentPurchases = purchases.slice(0, 5);

  const TABS = [
    { key: 'dashboard',  label: 'Dashboard',  icon: BarChart3  },
    { key: 'suppliers',  label: 'Suppliers',   icon: Truck      },
    { key: 'purchases',  label: 'Purchases',   icon: Package    },
  ];

  return (
    <div className="space-y-4">
      {/* Page header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-lg font-bold text-stone-800">Inventory</h1>
          <p className="text-sm text-stone-400">
            {suppliers.length} suppliers · {purchases.length} purchases
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowNewSupplier(true)}
            className="flex items-center gap-1.5 border border-stone-200 bg-white text-stone-600 hover:bg-stone-50 px-3 py-2 rounded-xl text-xs font-semibold transition">
            <Truck size={13} /> New Supplier
          </button>
          <button onClick={() => setShowAddPurchase(true)}
            className="flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white px-4 py-2 rounded-xl text-sm font-semibold shadow-brand transition">
            <Plus size={15} /> Add Purchase
          </button>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 bg-stone-100 p-1 rounded-xl w-fit">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={clsx('flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition',
              tab === t.key ? 'bg-white shadow text-stone-800' : 'text-stone-500 hover:text-stone-700')}>
            <t.icon size={13} /> {t.label}
          </button>
        ))}
      </div>

      {/* ── DASHBOARD TAB ── */}
      {tab === 'dashboard' && (
        <div className="space-y-4">
          {/* Balance cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Cash */}
            <div className="bg-white rounded-2xl border border-green-200 shadow-card p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-green-light rounded-lg flex items-center justify-center">
                    <Banknote size={15} className="text-green-shop" />
                  </div>
                  <p className="text-xs font-semibold text-stone-500">Cash Balance</p>
                </div>
                <button onClick={() => setShowAdjustBal(true)}
                  className="text-[10px] text-stone-400 hover:text-brand-500 border border-stone-200 rounded-lg px-2 py-0.5">
                  Adjust
                </button>
              </div>
              <p className="text-2xl font-bold text-green-shop font-mono">
                ₹{cashBalance.toLocaleString('en-IN')}
              </p>
              <p className="text-[10px] text-stone-400 mt-1">Cash drawer</p>
            </div>

            {/* Account */}
            <div className="bg-white rounded-2xl border border-blue-200 shadow-card p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                    <CreditCard size={15} className="text-blue-500" />
                  </div>
                  <p className="text-xs font-semibold text-stone-500">Account Balance</p>
                </div>
                <button onClick={() => setShowAdjustBal(true)}
                  className="text-[10px] text-stone-400 hover:text-brand-500 border border-stone-200 rounded-lg px-2 py-0.5">
                  Adjust
                </button>
              </div>
              <p className="text-2xl font-bold text-blue-500 font-mono">
                ₹{accountBalance.toLocaleString('en-IN')}
              </p>
              <p className="text-[10px] text-stone-400 mt-1">UPI / Bank account</p>
            </div>

            {/* Supplier dues */}
            <div className="bg-white rounded-2xl border border-amber-200 shadow-card p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-amber-light rounded-lg flex items-center justify-center">
                  <TrendingDown size={15} className="text-amber-shop" />
                </div>
                <p className="text-xs font-semibold text-stone-500">Supplier Dues</p>
              </div>
              <p className="text-2xl font-bold text-amber-shop font-mono">
                ₹{totalDue.toLocaleString('en-IN')}
              </p>
              <p className="text-[10px] text-stone-400 mt-1">{suppliers.filter(s => Number(s.currentDue) > 0).length} suppliers pending</p>
            </div>
          </div>

          {/* Total balance */}
          <div className="bg-gradient-to-r from-stone-800 to-stone-700 rounded-2xl p-5 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-white/60 mb-1">Total Available Balance</p>
                <p className="text-3xl font-bold font-mono">₹{totalBalance.toLocaleString('en-IN')}</p>
                <p className="text-xs text-white/50 mt-1">
                  Cash ₹{cashBalance.toLocaleString('en-IN')} + Account ₹{accountBalance.toLocaleString('en-IN')}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-white/60 mb-1">Net After Dues</p>
                <p className={clsx('text-2xl font-bold font-mono',
                  (totalBalance - totalDue) >= 0 ? 'text-green-400' : 'text-red-400')}>
                  ₹{(totalBalance - totalDue).toLocaleString('en-IN')}
                </p>
              </div>
            </div>
          </div>

          {/* Supplier due list */}
          {suppliers.filter(s => Number(s.currentDue) > 0).length > 0 && (
            <div className="bg-white rounded-2xl border border-stone-200 shadow-card overflow-hidden">
              <div className="px-5 py-4 border-b border-stone-100 flex items-center justify-between">
                <p className="text-sm font-bold text-stone-700">Pending Supplier Payments</p>
              </div>
              <div className="divide-y divide-stone-100">
                {suppliers.filter(s => Number(s.currentDue) > 0).map(s => (
                  <div key={s.id} className="flex items-center justify-between px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-amber-light flex items-center justify-center text-amber-shop font-bold text-sm">
                        {s.name[0]}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-stone-800">{s.name}</p>
                        <p className="text-xs text-stone-400">{s.products || 'Supplier'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <p className="text-sm font-bold text-amber-shop font-mono">
                        ₹{Number(s.currentDue).toLocaleString('en-IN')}
                      </p>
                      <button onClick={() => setLedgerFor(s)}
                        className="text-xs bg-stone-50 hover:bg-stone-100 border border-stone-200 rounded-lg px-2.5 py-1 font-medium transition">
                        Pay / View
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent purchases */}
          <div className="bg-white rounded-2xl border border-stone-200 shadow-card overflow-hidden">
            <div className="px-5 py-4 border-b border-stone-100 flex items-center justify-between">
              <p className="text-sm font-bold text-stone-700">Recent Purchases</p>
              <button onClick={() => setTab('purchases')}
                className="text-xs text-brand-500 hover:text-brand-700 font-medium">
                View all →
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="bg-stone-50 border-b border-stone-200">
                  {['Date','Product','Supplier','Total','Paid','Due'].map(h => (
                    <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-stone-400 uppercase">{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {recentPurchases.map(p => (
                    <tr key={p.id} className="border-t border-stone-100 hover:bg-stone-50">
                      <td className="px-4 py-2.5 text-xs font-mono text-stone-400">{p.purchaseDate}</td>
                      <td className="px-4 py-2.5 font-medium text-stone-800">{p.productName}</td>
                      <td className="px-4 py-2.5 text-stone-600 text-xs">{p.supplierName || '—'}</td>
                      <td className="px-4 py-2.5 font-bold text-stone-800">₹{Number(p.totalCost).toLocaleString('en-IN')}</td>
                      <td className="px-4 py-2.5 text-green-shop font-semibold">₹{Number(p.amountPaid).toLocaleString('en-IN')}</td>
                      <td className="px-4 py-2.5">
                        {Number(p.amountDue) > 0
                          ? <span className="text-xs font-bold text-amber-shop">₹{Number(p.amountDue).toLocaleString('en-IN')}</span>
                          : <span className="text-xs text-green-shop font-semibold">✓ Paid</span>}
                      </td>
                    </tr>
                  ))}
                  {recentPurchases.length === 0 && (
                    <tr><td colSpan={6} className="py-8 text-center text-xs text-stone-400">No purchases yet</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── SUPPLIERS TAB ── */}
      {tab === 'suppliers' && (
        <div className="space-y-3">
          {suppliers.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-stone-200">
              <Truck size={36} className="text-stone-300 mx-auto mb-3" />
              <p className="text-sm font-semibold text-stone-500 mb-5">No suppliers yet</p>
              <button onClick={() => setShowNewSupplier(true)}
                className="bg-brand-500 hover:bg-brand-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-brand">
                <Plus size={14} className="inline mr-1" /> Add First Supplier
              </button>
            </div>
          ) : suppliers.map(s => {
            const usagePct = Number(s.creditLimit) > 0
              ? Math.min((Number(s.currentDue) / Number(s.creditLimit)) * 100, 100) : 0;
            return (
              <div key={s.id} className="bg-white rounded-2xl border border-stone-200 shadow-card p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center text-brand-600 font-bold">
                      {s.name[0]}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-stone-800">{s.name}</p>
                      <p className="text-xs text-stone-400">
                        {s.mobile || 'No mobile'} {s.products ? `· ${s.products}` : ''}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-amber-shop font-mono">
                      ₹{Number(s.currentDue).toLocaleString('en-IN')}
                    </p>
                    <p className="text-xs text-stone-400">
                      of ₹{Number(s.creditLimit).toLocaleString('en-IN')} limit
                    </p>
                  </div>
                </div>
                {Number(s.creditLimit) > 0 && (
                  <div className="h-1.5 bg-stone-100 rounded-full overflow-hidden mb-3">
                    <div className="h-full rounded-full transition-all"
                      style={{
                        width: `${usagePct}%`,
                        background: usagePct > 85 ? '#b83a12' : usagePct > 60 ? '#9a5c00' : '#16713f'
                      }} />
                  </div>
                )}
                <div className="flex gap-2">
                  <button onClick={() => setLedgerFor(s)}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-stone-50 hover:bg-stone-100 border border-stone-200 rounded-xl py-2 text-xs font-semibold text-stone-600 transition">
                    <BookOpen size={12} /> View Ledger
                  </button>
                  <button onClick={() => setLedgerFor(s)}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-green-light hover:bg-green-100 border border-green-200 rounded-xl py-2 text-xs font-semibold text-green-shop transition">
                    <TrendingUp size={12} /> Record Payment
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── PURCHASES TAB ── */}
      {tab === 'purchases' && (
        <div className="bg-white rounded-2xl border border-stone-200 shadow-card overflow-hidden">
          <div className="px-5 py-4 border-b border-stone-100">
            <p className="text-sm font-bold text-stone-700">All Purchases</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="bg-stone-50 border-b border-stone-200">
                {['Date','Product','Supplier','Qty','Cost/kg','Total','Paid','Due'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-stone-400 uppercase">{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {purchases.map(p => (
                  <tr key={p.id} className="border-t border-stone-100 hover:bg-stone-50">
                    <td className="px-4 py-3 text-xs font-mono text-stone-400">{p.purchaseDate}</td>
                    <td className="px-4 py-3 font-medium text-stone-800">{p.productName}</td>
                    <td className="px-4 py-3 text-stone-600 text-xs">{p.supplierName || '—'}</td>
                    <td className="px-4 py-3 font-mono">{p.qty}kg</td>
                    <td className="px-4 py-3 text-stone-500 font-mono">₹{Number(p.costPerKg).toLocaleString('en-IN')}</td>
                    <td className="px-4 py-3 font-bold text-stone-800">₹{Number(p.totalCost).toLocaleString('en-IN')}</td>
                    <td className="px-4 py-3 text-green-shop font-semibold">₹{Number(p.amountPaid).toLocaleString('en-IN')}</td>
                    <td className="px-4 py-3">
                      {Number(p.amountDue) > 0
                        ? <span className="text-xs font-bold text-amber-shop">₹{Number(p.amountDue).toLocaleString('en-IN')}</span>
                        : <span className="text-xs text-green-shop font-semibold">✓ Paid</span>}
                    </td>
                  </tr>
                ))}
                {purchases.length === 0 && (
                  <tr><td colSpan={8} className="py-8 text-center text-xs text-stone-400">No purchases yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modals */}
      {showNewSupplier  && <NewSupplierModal   onClose={() => setShowNewSupplier(false)}  products={products} />}
      {showAddPurchase  && <AddPurchaseModal   onClose={() => setShowAddPurchase(false)}  suppliers={suppliers} products={products} />}
      {showAdjustBal    && <BalanceAdjustModal onClose={() => setShowAdjustBal(false)}    currentCash={cashBalance} currentAccount={accountBalance} />}
      {ledgerFor        && <SupplierLedgerModal supplier={ledgerFor} onClose={() => setLedgerFor(null)} />}
    </div>
  );
}