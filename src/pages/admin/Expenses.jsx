import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { expensesApi } from '../../services/api';
import { useForm } from 'react-hook-form';
import { Plus, Trash2, X } from 'lucide-react';
import { clsx } from 'clsx';
import toast from 'react-hot-toast';
import SplitPayment, { computeSplit } from '../../components/SplitPayment';

const CATEGORIES = [
  'ICE_PURCHASE','TRANSPORT','WORKER_WAGES',
  'SHOP_RENT','ELECTRICITY','PACKAGING','OTHER'
];

export default function ExpensesAdmin() {
  const qc = useQueryClient();
  const [showForm, setShowForm]   = useState(false);
  const [payState, setPayState]   = useState({ mode: 'CASH', cashAmt: '', upiAmt: '' });

  const { register, handleSubmit, reset, watch } = useForm({
    defaultValues: { expenseDate: new Date().toISOString().slice(0,10) },
  });
  const amount = Number(watch('amount') || 0);

  const { data: expenses = [] } = useQuery('expenses', () => expensesApi.getAll({}), {
    staleTime: 0, refetchOnMount: true,
  });

  const addMutation = useMutation(expensesApi.add, {
    onSuccess: () => {
      qc.invalidateQueries('expenses');
      qc.invalidateQueries('shop-settings-admin');
      qc.invalidateQueries('shop-balances');
      reset({ expenseDate: new Date().toISOString().slice(0,10) });
      setPayState({ mode: 'CASH', cashAmt: '', upiAmt: '' });
      setShowForm(false);
      toast.success('Expense recorded!');
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const deleteMutation = useMutation(expensesApi.delete, {
    onSuccess: () => {
      qc.invalidateQueries('expenses');
      qc.invalidateQueries('shop-settings-admin');
      toast.success('Expense deleted');
    },
  });

  const onSubmit = (formData) => {
    if (!formData.amount || formData.amount <= 0) {
      toast.error('Enter a valid amount'); return;
    }
    const { isValid, error, cashDelta, accountDelta } = computeSplit(payState, amount);
    if (!isValid) { toast.error(error); return; }

    addMutation.mutate({
      category:      formData.category,
      amount:        formData.amount,
      description:   formData.description,
      expenseDate:   formData.expenseDate,
      paymentMode:   payState.mode,
      cashAmount:    cashDelta,
      accountAmount: accountDelta,
    });
  };

  const totalMonth = expenses.reduce((s, e) => s + Number(e.amount), 0);

  // Payment mode badge helper
  const modeBadge = (e) => {
    if (!e.paymentMode || e.paymentMode === 'CASH') return '💵';
    if (e.paymentMode === 'UPI' || e.paymentMode === 'CARD') return '📱';
    if (e.paymentMode === 'SPLIT') return '🔀';
    return '';
  };

  return (
    <div className="space-y-4">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-stone-800">Expenses</h1>
          <p className="text-sm text-stone-400">
            Month total: <strong className="text-stone-700">₹{totalMonth.toLocaleString('en-IN')}</strong>
          </p>
        </div>
        <button
          onClick={() => setShowForm(s => !s)}
          className="flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white px-4 py-2 rounded-xl text-sm font-semibold shadow-brand transition"
        >
          <Plus size={15} /> Add Expense
        </button>
      </div>

      {/* Add expense form */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-stone-200 shadow-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-stone-700">Record Expense</p>
            <button onClick={() => setShowForm(false)} className="text-stone-400 hover:text-stone-700">
              <X size={16} />
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {/* Category */}
              <div>
                <label className="block text-xs font-semibold text-stone-500 mb-1">Category *</label>
                <select
                  {...register('category', { required: true })}
                  className="w-full border border-stone-200 rounded-lg px-2 py-2 text-sm focus:outline-none focus:border-brand-400 bg-white"
                >
                  {CATEGORIES.map(c => (
                    <option key={c} value={c}>{c.replace(/_/g,' ')}</option>
                  ))}
                </select>
              </div>

              {/* Amount */}
              <div>
                <label className="block text-xs font-semibold text-stone-500 mb-1">Amount (₹) *</label>
                <input
                  type="number" step="0.01"
                  {...register('amount', { required: true, valueAsNumber: true, min: 0.01 })}
                  placeholder="0.00"
                  onChange={() => setPayState(p => ({ ...p, cashAmt: '', upiAmt: '' }))}
                  className="w-full border border-stone-200 rounded-lg px-2 py-2 text-sm focus:outline-none focus:border-brand-400"
                />
              </div>

              {/* Note */}
              <div>
                <label className="block text-xs font-semibold text-stone-500 mb-1">Note</label>
                <input
                  {...register('description')}
                  placeholder="Optional description"
                  className="w-full border border-stone-200 rounded-lg px-2 py-2 text-sm focus:outline-none focus:border-brand-400"
                />
              </div>

              {/* Date */}
              <div>
                <label className="block text-xs font-semibold text-stone-500 mb-1">Date</label>
                <input
                  type="date"
                  {...register('expenseDate')}
                  className="w-full border border-stone-200 rounded-lg px-2 py-2 text-sm focus:outline-none focus:border-brand-400"
                />
              </div>
            </div>

            {/* Payment mode — always shown */}
            <div className="border-t border-stone-100 pt-3">
              <SplitPayment
                total={amount}
                value={payState}
                onChange={setPayState}
                label="Paid from"
              />
              {/* Friendly hint when no amount yet */}
              {amount <= 0 && (
                <p className="text-[10px] text-stone-400 mt-1">Enter amount above to see split validation</p>
              )}
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => { setShowForm(false); setPayState({ mode: 'CASH', cashAmt: '', upiAmt: '' }); }}
                className="flex-1 border border-stone-200 rounded-xl py-2.5 text-sm text-stone-600 hover:bg-stone-50 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={addMutation.isLoading}
                className="flex-1 bg-brand-500 hover:bg-brand-600 text-white rounded-xl py-2.5 text-sm font-semibold shadow-brand transition disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {addMutation.isLoading && (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                )}
                {addMutation.isLoading ? 'Saving…' : 'Save Expense'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Expense list */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-stone-50 border-b border-stone-200">
                {['Date','Category','Description','Paid via','Amount','Staff',''].map((h, i) => (
                  <th key={i} className={clsx(
                    'px-4 py-3 text-xs font-semibold text-stone-400 uppercase',
                    i >= 4 ? 'text-right' : 'text-left'
                  )}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {expenses.map(e => (
                <tr key={e.id} className="border-t border-stone-100 hover:bg-stone-50 transition">
                  <td className="px-4 py-3 text-xs font-mono text-stone-400">{e.expenseDate}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-semibold bg-amber-light text-amber-shop px-2 py-0.5 rounded-full">
                      {e.category.replace(/_/g,' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-stone-600 text-xs max-w-[180px] truncate">{e.description || '—'}</td>
                  <td className="px-4 py-3 text-xs text-stone-500">{modeBadge(e)} {e.paymentMode || 'CASH'}</td>
                  <td className="px-4 py-3 text-right font-bold text-stone-800">
                    ₹{Number(e.amount).toLocaleString('en-IN')}
                  </td>
                  <td className="px-4 py-3 text-xs text-stone-400">{e.enteredByName}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => { if (window.confirm('Delete this expense?')) deleteMutation.mutate(e.id); }}
                      className="p-1.5 rounded-lg hover:bg-red-50 text-stone-300 hover:text-red-500 transition"
                    >
                      <Trash2 size={13} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {expenses.length === 0 && (
            <div className="py-10 text-center text-xs text-stone-400">No expenses recorded</div>
          )}
        </div>
      </div>
    </div>
  );
}