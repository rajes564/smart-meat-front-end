// ── INVENTORY PAGE ─────────────────────────────────────────────────────────────
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { inventoryApi, productsApi } from '../../services/api';
import { useForm } from 'react-hook-form';
import { Plus, Package } from 'lucide-react';
import toast from 'react-hot-toast';
import { clsx } from 'clsx';

export function InventoryAdmin() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const { register, handleSubmit, reset, watch } = useForm();
  const qty = watch('qty', 0);
  const cost = watch('costPerKg', 0);

  const { data: purchases = [] } = useQuery('inventory', () => inventoryApi.getAll({}));
  const { data: products = [] } = useQuery('products', () => productsApi.getAll({}));
  const { data: supplierBalances = [] } = useQuery('supplier-balances', inventoryApi.supplierBalances);

  const addMutation = useMutation(inventoryApi.addPurchase, {
    onSuccess: () => { qc.invalidateQueries('inventory'); qc.invalidateQueries('products'); reset(); setShowForm(false); toast.success('Stock purchase recorded!'); },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed'),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-stone-800">Inventory</h1>
        <button onClick={() => setShowForm(s => !s)}
          className="flex items-center gap-2 bg-brand-500 text-white px-4 py-2 rounded-xl text-sm font-semibold shadow-brand">
          <Plus size={15} /> Add Purchase
        </button>
      </div>

      {/* Add purchase form */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-stone-200 shadow-card p-5 animate-slide-up">
          <p className="text-sm font-bold text-stone-700 mb-4">Record Stock Purchase</p>
          <form onSubmit={handleSubmit(d => addMutation.mutate(d))} className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div><label className="block text-xs font-semibold text-stone-500 mb-1">Product *</label>
                <select {...register('productId', { required: true, valueAsNumber: true })} className="w-full border border-stone-200 rounded-lg px-2 py-2 text-sm focus:outline-none focus:border-brand-400">
                  <option value="">Select…</option>
                  {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div><label className="block text-xs font-semibold text-stone-500 mb-1">Supplier *</label>
                <input {...register('supplierName', { required: true })} placeholder="Supplier name" className="w-full border border-stone-200 rounded-lg px-2 py-2 text-sm focus:outline-none focus:border-brand-400" />
              </div>
              <div><label className="block text-xs font-semibold text-stone-500 mb-1">Qty (kg) *</label>
                <input type="number" step="0.5" {...register('qty', { required: true, valueAsNumber: true })} className="w-full border border-stone-200 rounded-lg px-2 py-2 text-sm focus:outline-none focus:border-brand-400" />
              </div>
              <div><label className="block text-xs font-semibold text-stone-500 mb-1">Cost/kg (₹) *</label>
                <input type="number" step="0.01" {...register('costPerKg', { required: true, valueAsNumber: true })} className="w-full border border-stone-200 rounded-lg px-2 py-2 text-sm focus:outline-none focus:border-brand-400" />
              </div>
              <div><label className="block text-xs font-semibold text-stone-500 mb-1">Paid Now (₹)</label>
                <input type="number" step="0.01" {...register('amountPaid', { valueAsNumber: true })} placeholder="0" className="w-full border border-stone-200 rounded-lg px-2 py-2 text-sm focus:outline-none focus:border-brand-400" />
              </div>
              <div><label className="block text-xs font-semibold text-stone-500 mb-1">Invoice No.</label>
                <input {...register('invoiceNo')} placeholder="Optional" className="w-full border border-stone-200 rounded-lg px-2 py-2 text-sm focus:outline-none focus:border-brand-400" />
              </div>
            </div>
            <div className="flex items-center justify-between bg-stone-50 rounded-xl p-3">
              <span className="text-sm text-stone-600">Total Cost:</span>
              <span className="text-base font-bold text-brand-500">₹{(qty * cost).toFixed(0)}</span>
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={() => setShowForm(false)} className="flex-1 border border-stone-200 rounded-xl py-2.5 text-sm text-stone-600 hover:bg-stone-50">Cancel</button>
              <button type="submit" disabled={addMutation.isLoading} className="flex-1 bg-brand-500 text-white rounded-xl py-2.5 text-sm font-semibold disabled:opacity-60">
                {addMutation.isLoading ? 'Saving…' : 'Save Purchase'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Supplier balances */}
      {supplierBalances.length > 0 && (
        <div className="bg-white rounded-2xl border border-stone-200 shadow-card p-5">
          <p className="text-sm font-bold text-stone-700 mb-3">Supplier Payables</p>
          <div className="space-y-2">
            {supplierBalances.map((s, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-stone-100 last:border-0">
                <span className="text-sm text-stone-700 font-medium">{s.supplierName}</span>
                <div className="text-right">
                  <span className="text-sm font-bold text-brand-500">₹{Number(s.due).toLocaleString('en-IN')} due</span>
                  <span className="text-xs text-stone-400 ml-2">of ₹{Number(s.total).toLocaleString('en-IN')}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Purchase history */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-card overflow-hidden">
        <div className="px-5 py-4 border-b border-stone-100"><p className="text-sm font-bold text-stone-700">Purchase History</p></div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="bg-stone-50 border-b border-stone-200">
              <th className="px-4 py-3 text-left text-xs font-semibold text-stone-400 uppercase">Date</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-stone-400 uppercase">Product</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-stone-400 uppercase">Supplier</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-stone-400 uppercase">Qty</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-stone-400 uppercase">Total</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-stone-400 uppercase">Due</th>
            </tr></thead>
            <tbody>
              {purchases.map(p => (
                <tr key={p.id} className="border-t border-stone-100 hover:bg-stone-50">
                  <td className="px-4 py-3 text-xs font-mono text-stone-400">{p.purchaseDate}</td>
                  <td className="px-4 py-3 font-medium text-stone-800">{p.productName}</td>
                  <td className="px-4 py-3 text-stone-600">{p.supplierName}</td>
                  <td className="px-4 py-3 text-right font-mono">{p.qty}kg</td>
                  <td className="px-4 py-3 text-right font-bold text-stone-800">₹{Number(p.totalCost).toLocaleString('en-IN')}</td>
                  <td className="px-4 py-3 text-right">
                    {Number(p.amountDue) > 0
                      ? <span className="text-xs font-bold text-brand-500">₹{Number(p.amountDue).toLocaleString('en-IN')}</span>
                      : <span className="text-xs text-green-shop font-semibold">Paid ✓</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {purchases.length === 0 && <div className="py-8 text-center text-xs text-stone-400">No purchases yet</div>}
        </div>
      </div>
    </div>
  );
}

// ── EXPENSES PAGE ──────────────────────────────────────────────────────────────
import { expensesApi } from '../../services/api';
import { Trash2 } from 'lucide-react';

export function ExpensesAdmin() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const { register, handleSubmit, reset } = useForm({ defaultValues: { expenseDate: new Date().toISOString().slice(0, 10) } });

  const { data: expenses = [] } = useQuery('expenses', () => expensesApi.getAll({}));

  const addMutation = useMutation(expensesApi.add, {
    onSuccess: () => { qc.invalidateQueries('expenses'); reset(); setShowForm(false); toast.success('Expense recorded!'); },
  });
  const deleteMutation = useMutation(expensesApi.delete, {
    onSuccess: () => { qc.invalidateQueries('expenses'); toast.success('Expense deleted'); },
  });

  const CATEGORIES = ['ICE_PURCHASE','TRANSPORT','WORKER_WAGES','SHOP_RENT','ELECTRICITY','PACKAGING','OTHER'];
  const totalMonth = expenses.reduce((s, e) => s + Number(e.amount), 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-stone-800">Expenses</h1>
          <p className="text-sm text-stone-400">Month total: <strong className="text-stone-700">₹{totalMonth.toLocaleString('en-IN')}</strong></p>
        </div>
        <button onClick={() => setShowForm(s => !s)} className="flex items-center gap-2 bg-brand-500 text-white px-4 py-2 rounded-xl text-sm font-semibold shadow-brand">
          <Plus size={15} /> Add Expense
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-2xl border border-stone-200 shadow-card p-5 animate-slide-up">
          <form onSubmit={handleSubmit(d => addMutation.mutate(d))} className="grid grid-cols-2 sm:grid-cols-4 gap-3 items-end">
            <div><label className="block text-xs font-semibold text-stone-500 mb-1">Category *</label>
              <select {...register('category', { required: true })} className="w-full border border-stone-200 rounded-lg px-2 py-2 text-sm focus:outline-none focus:border-brand-400">
                {CATEGORIES.map(c => <option key={c} value={c}>{c.replace('_',' ')}</option>)}
              </select>
            </div>
            <div><label className="block text-xs font-semibold text-stone-500 mb-1">Amount (₹) *</label>
              <input type="number" step="0.01" {...register('amount', { required: true, valueAsNumber: true })} placeholder="0.00"
                className="w-full border border-stone-200 rounded-lg px-2 py-2 text-sm focus:outline-none focus:border-brand-400" />
            </div>
            <div><label className="block text-xs font-semibold text-stone-500 mb-1">Note</label>
              <input {...register('description')} placeholder="Optional description"
                className="w-full border border-stone-200 rounded-lg px-2 py-2 text-sm focus:outline-none focus:border-brand-400" />
            </div>
            <div className="flex gap-2">
              <button type="submit" disabled={addMutation.isLoading} className="flex-1 bg-brand-500 text-white rounded-lg py-2 text-sm font-semibold">
                {addMutation.isLoading ? '…' : 'Save'}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="px-3 border border-stone-200 rounded-lg text-sm text-stone-500">✕</button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-stone-200 shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="bg-stone-50 border-b border-stone-200">
              <th className="px-4 py-3 text-left text-xs font-semibold text-stone-400 uppercase">Date</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-stone-400 uppercase">Category</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-stone-400 uppercase">Description</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-stone-400 uppercase">Amount</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-stone-400 uppercase">Staff</th>
              <th className="px-4 py-3"></th>
            </tr></thead>
            <tbody>
              {expenses.map(e => (
                <tr key={e.id} className="border-t border-stone-100 hover:bg-stone-50">
                  <td className="px-4 py-3 text-xs font-mono text-stone-400">{e.expenseDate}</td>
                  <td className="px-4 py-3"><span className="text-xs font-semibold bg-amber-light text-amber-shop px-2 py-0.5 rounded-full">{e.category.replace('_',' ')}</span></td>
                  <td className="px-4 py-3 text-stone-600 text-xs">{e.description || '—'}</td>
                  <td className="px-4 py-3 text-right font-bold text-stone-800">₹{Number(e.amount).toLocaleString('en-IN')}</td>
                  <td className="px-4 py-3 text-xs text-stone-400">{e.enteredByName}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => { if(confirm('Delete this expense?')) deleteMutation.mutate(e.id); }}
                      className="p-1.5 rounded-lg hover:bg-red-50 text-stone-300 hover:text-red-500 transition"><Trash2 size={13} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {expenses.length === 0 && <div className="py-8 text-center text-xs text-stone-400">No expenses recorded</div>}
        </div>
      </div>
    </div>
  );
}

// ── REVIEWS ADMIN PAGE ────────────────────────────────────────────────────────
import { reviewsApi } from '../../services/api';
import { Star, Trash2 as T2, CheckCircle as CC } from 'lucide-react';

export function ReviewsAdmin() {
  const qc = useQueryClient();
  const { data: reviews = [] } = useQuery('reviews-admin', reviewsApi.getAll);

  const approveMutation = useMutation(reviewsApi.approve, { onSuccess: () => qc.invalidateQueries('reviews-admin') });
  const deleteMutation  = useMutation(reviewsApi.delete,  { onSuccess: () => { qc.invalidateQueries('reviews-admin'); toast.success('Review deleted'); } });

  const avg = reviews.length ? (reviews.filter(r=>r.approved).reduce((s,r)=>s+r.rating,0) / Math.max(1, reviews.filter(r=>r.approved).length)).toFixed(1) : '—';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-stone-800">Customer Reviews</h1>
          <p className="text-sm text-stone-400">{reviews.length} total · avg {avg} ⭐</p>
        </div>
        <div className="text-center bg-white rounded-xl border border-stone-200 shadow-card px-4 py-2">
          <p className="text-2xl font-bold text-stone-900 font-display">{avg}</p>
          <p className="text-brand-400 text-sm">{'★'.repeat(Math.round(Number(avg) || 0))}</p>
        </div>
      </div>

      <div className="space-y-3">
        {reviews.map(r => (
          <div key={r.id} className={clsx('bg-white rounded-2xl border shadow-card p-4',
            r.rating >= 4 ? 'border-green-200' : r.rating <= 2 ? 'border-brand-200' : 'border-stone-200')}>
            <div className="flex items-start justify-between mb-2">
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold text-stone-800">{r.name}</p>
                  {!r.approved && <span className="text-[10px] bg-amber-light text-amber-shop px-2 py-0.5 rounded-full font-bold">Pending approval</span>}
                </div>
                <div className="text-brand-400 text-sm mt-0.5">{'★'.repeat(r.rating)}{'☆'.repeat(5-r.rating)}</div>
              </div>
              <div className="flex gap-2">
                {!r.approved && (
                  <button onClick={() => approveMutation.mutate(r.id)}
                    className="p-1.5 rounded-lg bg-green-light hover:bg-green-100 text-green-shop transition"><CC size={14} /></button>
                )}
                <button onClick={() => { if(confirm('Delete review?')) deleteMutation.mutate(r.id); }}
                  className="p-1.5 rounded-lg hover:bg-red-50 text-stone-300 hover:text-red-500 transition"><T2 size={14} /></button>
              </div>
            </div>
            {r.comment && <p className="text-sm text-stone-600 italic mb-2">"{r.comment}"</p>}
            {r.tags?.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {r.tags.map((t,i) => <span key={i} className="text-[10px] bg-brand-50 text-brand-600 px-2 py-0.5 rounded-full">{t}</span>)}
              </div>
            )}
          </div>
        ))}
        {reviews.length === 0 && <div className="text-center py-10 text-stone-400"><Star size={32} className="mx-auto mb-2 opacity-30" /><p className="text-sm">No reviews yet</p></div>}
      </div>
    </div>
  );
}

// ── REPORTS PAGE ──────────────────────────────────────────────────────────────
import { reportsApi } from '../../services/api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export function ReportsAdmin() {
  const { data: dash } = useQuery('dashboard-reports', reportsApi.dashboard, { staleTime: 60000 });
  const fmt = n => '₹' + Number(n||0).toLocaleString('en-IN');
  const weeklyData = (dash?.weeklyChart||[]).map(d=>({day:new Date(d.day).toLocaleDateString('en-IN',{weekday:'short'}),sales:Number(d.total)}));

  return (
    <div className="space-y-5">
      <h1 className="text-lg font-bold text-stone-800">Reports</h1>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          {label:'Month Revenue', value:fmt(dash?.monthSales), color:'text-stone-800'},
          {label:'Purchase Cost', value:'—', color:'text-stone-800'},
          {label:'Month Expenses', value:'—', color:'text-stone-800'},
          {label:'Net Profit', value:fmt(dash?.netProfit), color:'text-green-shop'},
        ].map(({label,value,color})=>(
          <div key={label} className="bg-white rounded-xl border border-stone-200 shadow-card p-4">
            <p className="text-xs text-stone-400 mb-1">{label}</p>
            <p className={clsx('text-xl font-bold font-mono', color)}>{value}</p>
          </div>
        ))}
      </div>
      <div className="bg-white rounded-2xl border border-stone-200 shadow-card p-5">
        <p className="text-sm font-bold text-stone-700 mb-4">Weekly Sales</p>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={weeklyData} barSize={32}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0ece8" vertical={false} />
            <XAxis dataKey="day" tick={{fontSize:11,fill:'#a08060'}} axisLine={false} tickLine={false} />
            <YAxis tick={{fontSize:11,fill:'#a08060'}} axisLine={false} tickLine={false} tickFormatter={v=>v>=1000?`₹${(v/1000).toFixed(0)}k`:`₹${v}`} />
            <Tooltip formatter={(v)=>[`₹${v.toLocaleString('en-IN')}`,'Sales']} contentStyle={{borderRadius:'8px',fontSize:'12px',border:'1px solid #ede3d6'}} />
            <Bar dataKey="sales" fill="#e05528" radius={[4,4,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5">
        <p className="text-sm font-bold text-blue-700 mb-1">📊 Full Cash Sheet</p>
        <p className="text-xs text-blue-600">For detailed credit/debit day book with expandable transactions, use the <strong>Cash Sheet</strong> section in the sidebar.</p>
      </div>
    </div>
  );
}
