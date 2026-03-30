import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { khataApi } from '../../services/api';
import api from '../../services/api';
import { useForm } from 'react-hook-form';
import {
  BookOpen, Plus, TrendingUp, X,
  User, Phone, Mail, CreditCard, AlertTriangle, CheckCircle
} from 'lucide-react';
import { clsx } from 'clsx';
import toast from 'react-hot-toast';
import SplitPayment, { computeSplit } from '../../components/SplitPayment';

// ── New Account Modal ─────────────────────────────────────────────────────────
function NewAccountModal({ onClose }) {
  const qc = useQueryClient();
  const {
    register, handleSubmit, formState: { errors }, watch, setValue,
  } = useForm({
    defaultValues: { customerName: '', customerMobile: '', email: '', creditLimit: 10000 },
  });
  const creditLimit = watch('creditLimit');

  const mutation = useMutation(
    (payload) => api.post('/khata/accounts/direct', payload).then(r => r.data),
    {
    onSuccess: (account) => {
      qc.invalidateQueries('khata');
      toast.success(`Khata account created for ${account.customerName}!`);
      onClose();
    },
    onError: (e) =>
      toast.error(e.response?.data?.message || 'Failed to create account'),
  });

  const onSubmit = (data) => {
    mutation.mutate({
      customerName:   data.customerName.trim(),
      customerMobile: data.customerMobile.trim(),
      email:          data.email?.trim() || null,
      creditLimit:    Number(data.creditLimit),
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div
        className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden"
        style={{ animation: 'modalFade 0.3s ease both' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-200 bg-stone-50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-brand-50 rounded-lg flex items-center justify-center">
              <BookOpen size={16} className="text-brand-500" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-stone-800">New Khata Account</h3>
              <p className="text-[10px] text-stone-400">Create a credit account for a customer</p>
            </div>
          </div>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-700 transition">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-4">

          {/* Customer Name */}
          <div>
            <label className="block text-xs font-semibold text-stone-500 mb-1.5">
              <span className="flex items-center gap-1"><User size={11} /> Customer Name *</span>
            </label>
            <input
              {...register('customerName', {
                required: 'Name is required',
                minLength: { value: 2, message: 'Min 2 characters' },
              })}
              placeholder="e.g. Ravi Kumar"
              className={clsx(
                'w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-100 transition',
                errors.customerName
                  ? 'border-red-400 focus:border-red-400'
                  : 'border-stone-200 focus:border-brand-400'
              )}
            />
            {errors.customerName && (
              <p className="text-xs text-red-500 mt-1">{errors.customerName.message}</p>
            )}
          </div>

          {/* Mobile */}
          <div>
            <label className="block text-xs font-semibold text-stone-500 mb-1.5">
              <span className="flex items-center gap-1"><Phone size={11} /> Mobile Number *</span>
            </label>
            <input
              {...register('customerMobile', {
                required: 'Mobile is required',
                pattern: { value: /^\d{10}$/, message: 'Enter valid 10-digit mobile' },
              })}
              type="tel"
              maxLength={10}
              placeholder="10-digit mobile number"
              className={clsx(
                'w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-100 transition',
                errors.customerMobile
                  ? 'border-red-400 focus:border-red-400'
                  : 'border-stone-200 focus:border-brand-400'
              )}
            />
            {errors.customerMobile && (
              <p className="text-xs text-red-500 mt-1">{errors.customerMobile.message}</p>
            )}
            <p className="text-[10px] text-stone-400 mt-1">
              If this mobile is already registered, the account will be linked to that customer.
            </p>
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-semibold text-stone-500 mb-1.5">
              <span className="flex items-center gap-1"><Mail size={11} /> Email (optional)</span>
            </label>
            <input
              {...register('email')}
              type="email"
              placeholder="customer@email.com"
              className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 transition"
            />
          </div>

          {/* Credit Limit */}
          <div>
            <label className="block text-xs font-semibold text-stone-500 mb-1.5">
              <span className="flex items-center gap-1"><CreditCard size={11} /> Credit Limit (₹) *</span>
            </label>
            <input
              {...register('creditLimit', {
                required: 'Credit limit is required',
                min: { value: 100, message: 'Minimum limit is ₹100' },
                valueAsNumber: true,
              })}
              type="number"
              min="100"
              step="500"
              placeholder="10000"
              className={clsx(
                'w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-100 transition font-mono',
                errors.creditLimit
                  ? 'border-red-400 focus:border-red-400'
                  : 'border-stone-200 focus:border-brand-400'
              )}
            />
            {errors.creditLimit && (
              <p className="text-xs text-red-500 mt-1">{errors.creditLimit.message}</p>
            )}

            {/* Quick preset buttons — use RHF setValue, NOT DOM manipulation */}
            <div className="flex gap-2 mt-2 flex-wrap">
              {[2000, 5000, 10000, 25000, 50000].map(v => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setValue('creditLimit', v, { shouldValidate: true })}
                  className={clsx(
                    'px-2.5 py-1 rounded-lg text-[10px] font-semibold border transition',
                    Number(creditLimit) === v
                      ? 'bg-brand-500 text-white border-brand-500'
                      : 'bg-stone-50 text-stone-500 border-stone-200 hover:border-brand-300 hover:text-brand-500'
                  )}
                >
                  ₹{v >= 1000 ? `${v / 1000}k` : v}
                </button>
              ))}
            </div>
          </div>

          {/* Info box */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex gap-2">
            <CheckCircle size={14} className="text-blue-500 flex-shrink-0 mt-0.5" />
            <p className="text-[10px] text-blue-700 leading-relaxed">
              This creates a Khata credit account. The customer can receive goods on credit
              up to the set limit. All purchases and payments are tracked in the ledger.
            </p>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-stone-200 rounded-xl py-2.5 text-sm font-medium text-stone-600 hover:bg-stone-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={mutation.isLoading}
              className="flex-1 bg-brand-500 hover:bg-brand-600 text-white rounded-xl py-2.5 text-sm font-bold shadow-brand transition disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {mutation.isLoading && (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              )}
              {mutation.isLoading ? 'Creating…' : 'Create Account'}
            </button>
          </div>
        </form>
      </div>
      <style>{`
        @keyframes modalFade {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

// ── Ledger Modal ──────────────────────────────────────────────────────────────
function LedgerModal({ accountId, onClose }) {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery(
    ['khata-ledger', accountId],
    () => khataApi.getLedger(accountId)
  );
  const { register, handleSubmit, reset, watch } = useForm({
    defaultValues: { entryType: 'CREDIT' },
  });
  const entryType = watch('entryType');
  const amount    = Number(watch('amount') || 0);

  // Payment split state — only relevant for CREDIT entries (payment received)
  const [payState, setPayState] = useState({ mode: 'CASH', cashAmt: '', upiAmt: '' });

  const entryMutation = useMutation(
    (data) => khataApi.addEntry(data),
    {
      onSuccess: () => {
        qc.invalidateQueries(['khata-ledger', accountId]);
        qc.invalidateQueries('khata');
        qc.invalidateQueries('shop-settings-admin');
        qc.invalidateQueries('shop-balances');
        reset({ entryType });
        setPayState({ mode: 'CASH', cashAmt: '', upiAmt: '' });
        toast.success('Entry recorded!');
      },
      onError: (e) => toast.error(e.response?.data?.message || 'Failed'),
    }
  );

  const onSubmit = (formData) => {
    // For CREDIT (payment received), validate and include split info
    if (formData.entryType === 'CREDIT') {
      const { isValid, error, cashDelta, accountDelta } = computeSplit(payState, amount);
      if (!isValid) { toast.error(error); return; }
      entryMutation.mutate({
        accountId,
        entryType:     formData.entryType,
        amount:        formData.amount,
        paymentMode:   payState.mode,
        cashAmount:    cashDelta,
        accountAmount: accountDelta,
        description:   formData.description,
        referenceNote: formData.referenceNote,
      });
    } else {
      // DEBIT (new purchase on Khata) — no cash movement
      entryMutation.mutate({
        accountId,
        entryType:   formData.entryType,
        amount:      formData.amount,
        description: formData.description,
      });
    }
  };

  if (isLoading) return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl p-8">
        <div className="w-6 h-6 border-2 border-brand-400 border-t-transparent rounded-full animate-spin mx-auto" />
      </div>
    </div>
  );

  const account = data?.account;
  const entries = data?.entries || [];

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-2xl my-6 shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-stone-200">
          <div>
            <h2 className="text-base font-bold text-stone-800">
              {account?.customerName} — Khata
            </h2>
            <p className="text-xs text-stone-400">{account?.customerMobile}</p>
          </div>
          <div className="text-right mr-4">
            <p className="text-xl font-bold text-brand-500">
              ₹{Number(account?.currentDue || 0).toLocaleString('en-IN')}
            </p>
            <p className="text-xs text-stone-400">outstanding</p>
          </div>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-700">
            <X size={20} />
          </button>
        </div>

        {/* Credit usage bar */}
        <div className="px-5 py-3 border-b border-stone-100 bg-stone-50">
          <div className="flex justify-between text-xs text-stone-400 mb-1">
            <span>Credit used</span>
            <span>
              {account?.usagePercent?.toFixed(0)}% of ₹{Number(account?.creditLimit || 0).toLocaleString('en-IN')} limit
            </span>
          </div>
          <div className="h-2 bg-stone-200 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${Math.min(account?.usagePercent || 0, 100)}%`,
                background:
                  account?.usagePercent > 80 ? '#b83a12'
                  : account?.usagePercent > 50 ? '#9a5c00'
                  : '#16713f',
              }}
            />
          </div>
        </div>

        {/* Ledger table */}
        <div className="max-h-64 overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-stone-50 border-b border-stone-200">
              <tr>
                {['Date', 'Description', 'Debit', 'Credit', 'Balance'].map((h, i) => (
                  <th key={h} className={clsx(
                    'px-4 py-2.5 text-xs font-semibold',
                    i >= 2 ? 'text-right' : 'text-left',
                    i === 2 ? 'text-brand-400' : i === 3 ? 'text-green-shop' : 'text-stone-400'
                  )}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {entries.map(e => (
                <tr key={e.id} className="border-b border-stone-100 hover:bg-stone-50">
                  <td className="px-4 py-2.5 text-xs text-stone-400 font-mono whitespace-nowrap">
                    {e.entryDate}
                  </td>
                  <td className="px-4 py-2.5 text-xs text-stone-600 max-w-[180px] truncate">
                    {e.description || e.referenceNote || '—'}
                  </td>
                  <td className="px-4 py-2.5 text-right text-xs font-bold text-brand-500">
                    {e.entryType === 'DEBIT' ? `₹${Number(e.amount).toLocaleString('en-IN')}` : '—'}
                  </td>
                  <td className="px-4 py-2.5 text-right text-xs font-bold text-green-shop">
                    {e.entryType === 'CREDIT' ? `₹${Number(e.amount).toLocaleString('en-IN')}` : '—'}
                  </td>
                  <td className={clsx(
                    'px-4 py-2.5 text-right text-xs font-bold font-mono',
                    Number(e.runningBalance) > 0 ? 'text-brand-500' : 'text-green-shop'
                  )}>
                    ₹{Math.abs(Number(e.runningBalance)).toLocaleString('en-IN')}
                  </td>
                </tr>
              ))}
              {entries.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-xs text-stone-400">
                    No entries yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Add entry form */}
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="p-5 border-t border-stone-200 bg-stone-50 space-y-3"
        >
          <p className="text-xs font-bold text-stone-500 uppercase tracking-wide">Add Entry</p>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-stone-400 mb-1">Type</label>
              <select
                {...register('entryType')}
                onChange={() => setPayState({ mode: 'CASH', cashAmt: '', upiAmt: '' })}
                className="w-full border border-stone-200 rounded-lg px-2 py-2 text-sm focus:outline-none focus:border-brand-400 bg-white"
              >
                <option value="CREDIT">💰 Payment Received</option>
                <option value="DEBIT">🛒 New Purchase (Khata)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-400 mb-1">Amount (₹) *</label>
              <input
                type="number" step="0.01"
                {...register('amount', { required: true, valueAsNumber: true, min: 0.01 })}
                placeholder="0.00"
                onChange={() => setPayState(p => ({ ...p, cashAmt: '', upiAmt: '' }))}
                className="w-full border border-stone-200 rounded-lg px-2 py-2 text-sm focus:outline-none focus:border-brand-400"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-400 mb-1">Note</label>
              <input
                {...register('description')}
                placeholder="e.g. Cash payment"
                className="w-full border border-stone-200 rounded-lg px-2 py-2 text-sm focus:outline-none focus:border-brand-400"
              />
            </div>
          </div>

          {/* Payment mode — only for CREDIT (money being received) */}
          
            <SplitPayment
              total={amount}
              value={payState}
              onChange={setPayState}
              label="How is the payment being received?"
            />
          

          {/* For DEBIT — informational note */}
          {entryType === 'DEBIT' && (
            <p className="text-[10px] text-stone-400 bg-amber-light border border-amber-200 rounded-lg px-3 py-2">
              📖 This adds to the customer's Khata balance. No cash/account movement until payment is received.
            </p>
          )}

          <button
            type="submit"
            disabled={entryMutation.isLoading}
            className={clsx(
              'w-full py-2.5 rounded-xl text-sm font-bold transition disabled:opacity-60',
              entryType === 'CREDIT'
                ? 'bg-green-shop hover:bg-green-700 text-white'
                : 'bg-brand-500 hover:bg-brand-600 text-white'
            )}
          >
            {entryMutation.isLoading
              ? 'Saving…'
              : entryType === 'CREDIT'
              ? '+ Record Payment Received'
              : '+ Add Purchase to Khata'}
          </button>
        </form>
      </div>
    </div>
  );
}

// ── Main Khata Page ───────────────────────────────────────────────────────────
export function KhataAdmin() {
  const [ledgerFor,      setLedgerFor]      = useState(null);
  const [showNewAccount, setShowNewAccount] = useState(false);

  const { data: summary, isLoading } = useQuery('khata', khataApi.summary, {
    staleTime: 30000,
  });
  const accounts = summary?.accounts || [];

  return (
    <div className="space-y-4">

      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-stone-800">Khata — Credit Ledger</h1>
          <p className="text-sm text-stone-400">Manage customer credit accounts</p>
        </div>
        <button
          onClick={() => setShowNewAccount(true)}
          className="flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold shadow-brand transition"
        >
          <Plus size={15} /> New Account
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-xl border border-stone-200 shadow-card p-4 text-center">
          <p className="text-xs text-stone-400 mb-1">Total Outstanding</p>
          <p className="text-2xl font-bold text-brand-500">
            ₹{Number(summary?.totalOutstanding || 0).toLocaleString('en-IN')}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-stone-200 shadow-card p-4 text-center">
          <p className="text-xs text-stone-400 mb-1">Active Accounts</p>
          <p className="text-2xl font-bold text-stone-800">{accounts.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-stone-200 shadow-card p-4 text-center">
          <p className="text-xs text-stone-400 mb-1">Total Received</p>
          <p className="text-2xl font-bold text-green-shop">
            ₹{Number(
              accounts.reduce((s, a) => s + Number(a.totalCredit || 0), 0)
            ).toLocaleString('en-IN')}
          </p>
        </div>
      </div>

      {/* Account cards */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-stone-100 rounded-2xl h-32 animate-pulse" />
          ))}
        </div>
      ) : accounts.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-stone-200">
          <BookOpen size={36} className="text-stone-300 mx-auto mb-3" />
          <p className="text-sm font-semibold text-stone-500 mb-1">No Khata accounts yet</p>
          <p className="text-xs text-stone-400 mb-5">
            Create an account to start tracking credit for customers
          </p>
          <button
            onClick={() => setShowNewAccount(true)}
            className="bg-brand-500 hover:bg-brand-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-brand transition"
          >
            <Plus size={14} className="inline mr-1" /> Create First Account
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {accounts.map(acc => {
            const usagePct  = Math.min(acc.usagePercent || 0, 100);
            const overLimit = usagePct >= 100;
            const barColor  = usagePct > 80 ? '#b83a12' : usagePct > 50 ? '#9a5c00' : '#16713f';

            return (
              <div
                key={acc.id}
                className={clsx(
                  'bg-white rounded-2xl border shadow-card hover:shadow-card-hover transition-all p-4',
                  overLimit ? 'border-red-200' : 'border-stone-200'
                )}
              >
                <div className="flex items-center justify-between mb-3">
                  {/* Avatar + name */}
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center text-brand-600 font-bold text-sm flex-shrink-0">
                      {acc.customerName?.[0]?.toUpperCase() || 'C'}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-stone-800">{acc.customerName}</p>
                      <p className="text-xs text-stone-400">{acc.customerMobile}</p>
                    </div>
                  </div>

                  {/* Due amount */}
                  <div className="text-right">
                    <p className={clsx(
                      'text-lg font-bold',
                      overLimit ? 'text-red-500' : 'text-brand-500'
                    )}>
                      ₹{Number(acc.currentDue).toLocaleString('en-IN')}
                    </p>
                    <p className="text-xs text-stone-400">
                      of ₹{Number(acc.creditLimit).toLocaleString('en-IN')} limit
                    </p>
                  </div>
                </div>

                {/* Credit bar */}
                <div className="mb-1.5">
                  <div className="h-1.5 bg-stone-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${usagePct}%`, background: barColor }}
                    />
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className={clsx(
                      'text-[10px] font-semibold',
                      overLimit ? 'text-red-500' : 'text-stone-400'
                    )}>
                      {overLimit ? '⚠ Over limit' : `${usagePct.toFixed(0)}% used`}
                    </span>
                    <span className="text-[10px] text-green-shop">
                      Received: ₹{Number(acc.totalCredit || 0).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => setLedgerFor(acc.id)}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-stone-50 hover:bg-stone-100 border border-stone-200 rounded-xl py-2 text-xs font-semibold text-stone-600 transition"
                  >
                    <BookOpen size={13} /> View Ledger
                  </button>
                  <button
                    onClick={() => setLedgerFor(acc.id)}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-green-light hover:bg-green-100 border border-green-200 rounded-xl py-2 text-xs font-semibold text-green-shop transition"
                  >
                    <TrendingUp size={13} /> Record Payment
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modals */}
      {showNewAccount && (
        <NewAccountModal onClose={() => setShowNewAccount(false)} />
      )}
      {ledgerFor && (
        <LedgerModal accountId={ledgerFor} onClose={() => setLedgerFor(null)} />
      )}
    </div>
  );
}

export default KhataAdmin;