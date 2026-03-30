import React, { useState, useEffect } from 'react';
import { useQuery } from 'react-query';
import { reportsApi, shopApi } from '../../services/api';
import { Download, ChevronDown, ChevronRight, Banknote, CreditCard } from 'lucide-react';
import { clsx } from 'clsx';

// ── helpers ───────────────────────────────────────────────────────────────────
const fmt  = (n) => '₹' + Number(n || 0).toLocaleString('en-IN');
const fmtD = (d) => {
  try { return new Date(d + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' }); }
  catch { return d; }
};

// ── Payment badge ─────────────────────────────────────────────────────────────
function PayBadge({ cashAmt, accountAmt, method }) {
  const c = Number(cashAmt    || 0);
  const u = Number(accountAmt || 0);

  if (method === 'KHATA') return (
    <span className="text-[9px] font-bold bg-amber-light text-amber-shop px-1.5 py-0.5 rounded-full">📖 Khata</span>
  );
  if (c > 0 && u > 0) return (
    <span className="flex items-center gap-1 text-[9px] font-semibold">
      <span className="bg-green-light text-green-shop px-1 py-0.5 rounded">💵 ₹{c.toLocaleString('en-IN')}</span>
      <span className="bg-blue-50 text-blue-500 px-1 py-0.5 rounded">📱 ₹{u.toLocaleString('en-IN')}</span>
    </span>
  );
  if (c > 0) return <span className="text-[9px] font-bold bg-green-light text-green-shop px-1.5 py-0.5 rounded-full">💵 Cash</span>;
  if (u > 0) return <span className="text-[9px] font-bold bg-blue-50 text-blue-500 px-1.5 py-0.5 rounded-full">📱 UPI/Card</span>;
  return <span className="text-[9px] text-stone-400">{method || '—'}</span>;
}

// ── Main component ────────────────────────────────────────────────────────────
export default function CashSheet() {
  const today    = new Date().toISOString().slice(0, 10);
  const sevenAgo = new Date(Date.now() - 6 * 86400000).toISOString().slice(0, 10);

  const [from,         setFrom]         = useState(sevenAgo);
  const [to,           setTo]           = useState(today);
  const [typeFilter,   setTypeFilter]   = useState('all');
  const [search,       setSearch]       = useState('');
  const [expandedRows, setExpandedRows] = useState({});   // key → bool
  const [view,         setView]         = useState('daybook'); // daybook | summary

  // ── Data ── staleTime=0 so navigating TO cash-sheet always re-fetches
  const { data, isLoading, isFetching } = useQuery(
    ['cash-sheet', from, to, typeFilter],
    () => reportsApi.cashSheet({ from, to, type: typeFilter !== 'all' ? typeFilter : undefined }),
    { staleTime: 0, refetchOnMount: true, enabled: !!from && !!to }
  );

  // Shop settings for opening balance labels
  const { data: settings } = useQuery('shop-settings-admin', shopApi.getSettings, {
    staleTime: 30000,
  });

  const entries      = data?.entries || [];
  const openingCash  = Number(data?.openingCash    ?? settings?.cashBalance    ?? 0);
  const openingAcct  = Number(data?.openingAccount ?? settings?.accountBalance ?? 0);

  // ── Group by date ──────────────────────────────────────────────────────────
  const byDate = {};
  entries.forEach(e => {
    if (!byDate[e.date]) byDate[e.date] = { credits: [], debits: [] };
    if (e.type === 'CREDIT') byDate[e.date].credits.push(e);
    else                      byDate[e.date].debits.push(e);
  });

  const allDates = Object.keys(byDate).sort();
  const filteredDates = allDates.filter(date => {
    if (!search) return true;
    const all = [...byDate[date].credits, ...byDate[date].debits];
    return all.some(e => e.description?.toLowerCase().includes(search.toLowerCase()));
  });

  // ── Expand / collapse ──────────────────────────────────────────────────────
  // key = entry.date + '|' + entry.category + '|' + entry.description
  const entryKey = (e) => `${e.date}|${e.category}|${e.description}`;

  const expandableKeys = entries
    .filter(e => e.subEntries?.length > 0)
    .map(entryKey);

  const allCurrentlyExpanded =
    expandableKeys.length > 0 &&
    expandableKeys.every(k => expandedRows[k]);

  const toggleAll = () => {
    if (allCurrentlyExpanded) {
      // collapse all
      setExpandedRows({});
    } else {
      // expand all
      const next = {};
      expandableKeys.forEach(k => { next[k] = true; });
      setExpandedRows(next);
    }
  };

  const toggleRow = (e) => {
    const k = entryKey(e);
    setExpandedRows(prev => ({ ...prev, [k]: !prev[k] }));
  };

  // ── CSV export ─────────────────────────────────────────────────────────────
  const exportCSV = () => {
    const header = ['Date', 'Type', 'Category', 'Description', 'Cash (₹)', 'Account (₹)', 'Total (₹)', 'Balance (₹)', 'Staff'];
    const rows = entries.map(e => [
      e.date, e.type, e.category, `"${e.description}"`,
      Number(e.cashAmount    || 0).toFixed(2),
      Number(e.accountAmount || 0).toFixed(2),
      Number(e.amount        || 0).toFixed(2),
      Number(e.runningBalance|| 0).toFixed(2),
      e.staff || ''
    ]);
    const csv = [header, ...rows].map(r => r.join(',')).join('\n');
    const a = document.createElement('a');
    a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
    a.download = `cash_sheet_${from}_to_${to}.csv`;
    a.click();
  };

  // ── Grid column definition ─────────────────────────────────────────────────
  // Date | Description | Cash Credit | Acct Credit | Cash Debit | Acct Debit | Balance | ▸
  const COL = 'grid grid-cols-[110px_1fr_90px_90px_90px_90px_100px_28px]';

  const loading = isLoading || isFetching;

  return (
    <div className="flex flex-col h-full space-y-3">

      {/* ── Top bar ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 flex-shrink-0">
        <div>
          <h1 className="text-lg font-bold text-stone-800">Cash Sheet — Day Book</h1>
          <p className="text-xs text-stone-400">{fmtD(from)} → {fmtD(to)}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={exportCSV}
            className="flex items-center gap-1.5 border border-stone-200 rounded-xl px-3 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-50 transition">
            <Download size={13} /> CSV
          </button>
          <button onClick={() => window.print()}
            className="flex items-center gap-1.5 border border-stone-200 rounded-xl px-3 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-50 transition">
            🖨 Print
          </button>
        </div>
      </div>

      {/* ── Filters ── */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-card px-4 py-3 flex flex-wrap items-center gap-3 flex-shrink-0">
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-stone-400">From</label>
          <input type="date" value={from} onChange={e => setFrom(e.target.value)}
            className="border border-stone-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-brand-400" />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-stone-400">To</label>
          <input type="date" value={to} onChange={e => setTo(e.target.value)}
            className="border border-stone-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-brand-400" />
        </div>
        <div className="w-px h-5 bg-stone-200" />
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
          className="border border-stone-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-brand-400">
          <option value="all">All Types</option>
          <option value="credit">Credit Only</option>
          <option value="debit">Debit Only</option>
        </select>
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search entries…"
          className="border border-stone-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-brand-400 w-40" />
        <div className="w-px h-5 bg-stone-200" />
        {/* View toggle */}
        <div className="flex bg-stone-100 rounded-lg p-0.5">
          {['daybook', 'summary'].map(v => (
            <button key={v} onClick={() => setView(v)}
              className={clsx('px-3 py-1 rounded-md text-xs font-semibold transition',
                view === v ? 'bg-white shadow text-stone-800' : 'text-stone-400 hover:text-stone-600')}>
              {v === 'daybook' ? 'Day Book' : 'Summary'}
            </button>
          ))}
        </div>
        {/* Expand/Collapse All — only in daybook */}
        {view === 'daybook' && expandableKeys.length > 0 && (
          <button onClick={toggleAll}
            className="flex items-center gap-1 text-xs font-semibold text-brand-500 hover:text-brand-700 border border-brand-200 rounded-lg px-2.5 py-1.5 transition">
            {allCurrentlyExpanded ? '− Collapse All' : '+ Expand All'}
          </button>
        )}
      </div>

      {/* ── Summary cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 flex-shrink-0">
        {/* Opening cash */}
        <div className="bg-white rounded-xl border border-green-200 shadow-card p-3">
          <div className="flex items-center gap-2 mb-1">
            <Banknote size={13} className="text-green-shop" />
            <p className="text-[10px] font-semibold text-stone-400 uppercase">Opening Cash</p>
          </div>
          <p className="text-lg font-bold text-green-shop font-mono">{fmt(openingCash)}</p>
        </div>
        {/* Opening account */}
        <div className="bg-white rounded-xl border border-blue-200 shadow-card p-3">
          <div className="flex items-center gap-2 mb-1">
            <CreditCard size={13} className="text-blue-500" />
            <p className="text-[10px] font-semibold text-stone-400 uppercase">Opening Account</p>
          </div>
          <p className="text-lg font-bold text-blue-500 font-mono">{fmt(openingAcct)}</p>
        </div>
        {/* Total credit */}
        <div className="bg-white rounded-xl border border-green-200 shadow-card p-3">
          <p className="text-[10px] font-semibold text-stone-400 uppercase mb-1">Period Credit</p>
          <p className="text-lg font-bold text-green-shop font-mono">{fmt(data?.totalCredit)}</p>
          <p className="text-[10px] text-stone-400">Sales + Received</p>
        </div>
        {/* Total debit */}
        <div className="bg-white rounded-xl border border-brand-200 shadow-card p-3">
          <p className="text-[10px] font-semibold text-stone-400 uppercase mb-1">Period Debit</p>
          <p className="text-lg font-bold text-brand-500 font-mono">{fmt(data?.totalDebit)}</p>
          <p className="text-[10px] text-stone-400">Stock + Expenses</p>
        </div>
      </div>

      {/* ── Table ── */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-card  flex-1 flex flex-col" >

        {loading && (
          <div className="flex items-center justify-center py-16 flex-1">
            <div className="w-7 h-7 border-2 border-brand-400 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {!loading && view === 'daybook' && (
          <div className="overflow-auto flex-1" style={{ minHeight: 0 }}>

            {/* Column headers */}
            <div className={clsx(COL, 'sticky top-0 bg-stone-50 border-b border-stone-200 z-20')}>
              {[
                { label: 'Date',         align: '' },
                { label: 'Description',  align: '' },
                { label: '💵 Cash In',   align: 'text-right text-green-shop' },
                { label: '📱 A/C In',    align: 'text-right text-blue-500' },
                { label: '💵 Cash Out',  align: 'text-right text-brand-400' },
                { label: '📱 A/C Out',   align: 'text-right text-brand-400' },
                { label: 'Balance',      align: 'text-right' },
                { label: '',             align: '' },
              ].map((h, i) => (
                <div key={i} className={clsx('px-2 py-2.5 text-[10px] font-bold text-stone-400 uppercase tracking-wide', h.align)}>
                  {h.label}
                </div>
              ))}
            </div>

            {/* Opening balance row */}
            <div className={clsx(COL, 'bg-stone-50 border-b border-stone-200')}>
              <div className="px-2 py-2 text-[10px] font-semibold text-stone-500">{fmtD(from)}</div>
              <div className="px-2 py-2 text-xs font-semibold text-stone-600">Opening Balance</div>
              <div className="px-2 py-2 text-xs text-right font-mono text-green-shop font-semibold">{fmt(openingCash)}</div>
              <div className="px-2 py-2 text-xs text-right font-mono text-blue-500 font-semibold">{fmt(openingAcct)}</div>
              <div className="px-2 py-2 text-xs text-right text-stone-300">—</div>
              <div className="px-2 py-2 text-xs text-right text-stone-300">—</div>
              <div className="px-2 py-2 text-xs text-right font-mono font-bold text-stone-600">{fmt(openingCash + openingAcct)}</div>
              <div />
            </div>

            {/* Date groups */}
            {filteredDates.length === 0 ? (
              <div className="py-16 text-center text-stone-400">
                <p className="text-sm font-medium">No entries for this period</p>
                <p className="text-xs mt-1">Try adjusting the date range or filters</p>
              </div>
            ) : filteredDates.map(date => {
              const { credits, debits } = byDate[date];
              const dayCredit = credits.reduce((s, e) => s + Number(e.amount || 0), 0);
              const dayDebit  = debits.reduce((s,  e) => s + Number(e.amount || 0), 0);

              return (
                <div key={date}>
                  {/* Date header row */}
                  <div className={clsx(COL, 'bg-stone-100/60 border-b border-stone-200 border-t border-t-stone-200')}>
                    <div className="px-2 py-1.5 text-[10px] font-bold text-stone-600 col-span-2 flex items-center gap-1.5">
                      {fmtD(date)}
                    </div>
                    <div className="px-2 py-1.5 text-[10px] font-bold text-green-shop text-right font-mono">
                      {dayCredit > 0 ? fmt(dayCredit) : ''}
                    </div>
                    <div className="px-2 py-1.5" />
                    <div className="px-2 py-1.5 text-[10px] font-bold text-brand-500 text-right font-mono">
                      {dayDebit > 0 ? fmt(dayDebit) : ''}
                    </div>
                    <div className="px-2 py-1.5" /><div /><div />
                  </div>

                  {/* Credit entries */}
                  {credits.map((entry, i) => {
                    const key        = entryKey(entry);
                    const hasSubs    = (entry.subEntries?.length || 0) > 0;
                    const isExpanded = !!expandedRows[key];
                    const cashIn     = Number(entry.cashAmount    || 0);
                    const acctIn     = Number(entry.accountAmount || 0);

                    return (
                      <div key={key + i}>
                        {/* Credit entry row */}
                        <div
                          className={clsx(COL,
                            'border-b border-stone-100 hover:bg-green-light/30 transition',
                            hasSubs && 'cursor-pointer'
                          )}
                          onClick={() => hasSubs && toggleRow(entry)}
                        >
                          <div className="px-2 py-2.5 text-[10px] text-stone-400" />
                          <div className="px-2 py-2.5 text-xs text-stone-700 flex items-center gap-1.5">
                            <span className="text-[9px] font-bold bg-green-light text-green-shop px-1.5 py-0.5 rounded-full whitespace-nowrap">
                              {entry.category === 'SALES' ? 'Sales' : entry.category}
                            </span>
                            <span className="truncate">{entry.description}</span>
                          </div>
                          <div className="px-2 py-2.5 text-xs text-right font-mono font-bold text-green-shop">
                            {cashIn > 0 ? fmt(cashIn) : '—'}
                          </div>
                          <div className="px-2 py-2.5 text-xs text-right font-mono font-semibold text-blue-500">
                            {acctIn > 0 ? fmt(acctIn) : '—'}
                          </div>
                          <div className="px-2 py-2.5 text-xs text-right text-stone-300">—</div>
                          <div className="px-2 py-2.5 text-xs text-right text-stone-300">—</div>
                          <div className={clsx('px-2 py-2.5 text-xs text-right font-mono font-bold',
                            Number(entry.runningBalance) >= 0 ? 'text-green-shop' : 'text-brand-500')}>
                            {fmt(entry.runningBalance)}
                          </div>
                          <div className="flex items-center justify-center">
                            {hasSubs && (
                              <span className="text-stone-400">
                                {isExpanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Expanded sub-entries (individual transactions) */}
                        {hasSubs && isExpanded && (
                          <div className="border-b border-green-200 bg-green-light/20">
                            {/* Sub-header */}
                            <div className="grid grid-cols-[28px_100px_1fr_90px_90px_90px]
                                            px-2 py-1.5 bg-green-light/50 border-b border-green-200">
                              {['', 'Time', 'Customer — Items', 'Cash', 'UPI/Card', 'Payment'].map((h, i) => (
                                <div key={i} className={clsx('text-[9px] font-bold text-green-shop uppercase tracking-wide',
                                  i >= 3 ? 'text-right' : '')}>{h}</div>
                              ))}
                            </div>
                            {entry.subEntries.map((sub, si) => (
                              <div key={si} className="grid grid-cols-[28px_100px_1fr_90px_90px_90px]
                                                        px-2 py-2 border-b border-green-100 last:border-0 hover:bg-green-light/30">
                                <div />
                                <div className="text-[10px] font-mono text-stone-400">{sub.time}</div>
                                <div className="text-xs text-stone-600 truncate pr-2">
                                  <span className="font-semibold text-stone-700">{sub.label}</span>
                                  {sub.detail && <span className="text-stone-400"> — {sub.detail}</span>}
                                </div>
                                <div className="text-right text-[10px] font-mono text-green-shop font-semibold">
                                  {Number(sub.cashAmount || 0) > 0 ? fmt(sub.cashAmount) : '—'}
                                </div>
                                <div className="text-right text-[10px] font-mono text-blue-500 font-semibold">
                                  {Number(sub.accountAmount || 0) > 0 ? fmt(sub.accountAmount) : '—'}
                                </div>
                                <div className="flex justify-end items-center pr-1">
                                  <PayBadge
                                    cashAmt={sub.cashAmount}
                                    accountAmt={sub.accountAmount}
                                    method={sub.paymentMethod}
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* Debit entries */}
                  {debits.map((entry, i) => {
                    const key        = entryKey(entry);
                    const hasSubs    = (entry.subEntries?.length || 0) > 0;
                    const isExpanded = !!expandedRows[key];
                    const cashOut    = Number(entry.cashAmount    || 0);
                    const acctOut    = Number(entry.accountAmount || 0);

                    return (
                      <div key={key + i}>
                        <div
                          className={clsx(COL,
                            'border-b border-stone-100 hover:bg-red-50/30 transition',
                            hasSubs && 'cursor-pointer'
                          )}
                          onClick={() => hasSubs && toggleRow(entry)}
                        >
                          <div className="px-2 py-2.5" />
                          <div className="px-2 py-2.5 text-xs text-stone-700 flex items-center gap-1.5">
                            <span className={clsx('text-[9px] font-bold px-1.5 py-0.5 rounded-full whitespace-nowrap',
                              entry.category === 'STOCK_PURCHASE'
                                ? 'bg-amber-light text-amber-shop'
                                : 'bg-red-50 text-red-500')}>
                              {entry.category === 'STOCK_PURCHASE' ? 'Stock' : 'Expense'}
                            </span>
                            <span className="truncate">{entry.description}</span>
                            {entry.staff && <span className="text-[9px] text-stone-300 whitespace-nowrap">· {entry.staff}</span>}
                          </div>
                          <div className="px-2 py-2.5 text-xs text-right text-stone-300">—</div>
                          <div className="px-2 py-2.5 text-xs text-right text-stone-300">—</div>
                          <div className="px-2 py-2.5 text-xs text-right font-mono font-bold text-brand-500">
                            {cashOut > 0 ? fmt(cashOut) : '—'}
                          </div>
                          <div className="px-2 py-2.5 text-xs text-right font-mono font-semibold text-brand-400">
                            {acctOut > 0 ? fmt(acctOut) : '—'}
                          </div>
                          <div className={clsx('px-2 py-2.5 text-xs text-right font-mono font-bold',
                            Number(entry.runningBalance) >= 0 ? 'text-green-shop' : 'text-brand-500')}>
                            {fmt(entry.runningBalance)}
                          </div>
                          <div className="flex items-center justify-center">
                            {hasSubs && (
                              <span className="text-stone-400">
                                {isExpanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}

            {/* Closing balance */}
            {filteredDates.length > 0 && (
              <div className={clsx(COL, 'border-t-2 border-stone-300 bg-stone-50 sticky bottom-0')}>
                <div className="px-2 py-3 text-[10px] font-bold text-stone-500">{fmtD(to)}</div>
                <div className="px-2 py-3 text-xs font-bold text-stone-700">Closing Balance</div>
                <div className="px-2 py-3 text-xs text-right text-stone-300">—</div>
                <div className="px-2 py-3 text-xs text-right text-stone-300">—</div>
                <div className="px-2 py-3 text-xs text-right text-stone-300">—</div>
                <div className="px-2 py-3 text-xs text-right text-stone-300">—</div>
                <div className={clsx('px-2 py-3 text-sm font-bold text-right font-mono',
                  Number(data?.closingBalance) >= 0 ? 'text-green-shop' : 'text-brand-500')}>
                  {fmt(data?.closingBalance)}
                </div>
                <div />
              </div>
            )}
          </div>
        )}

        {/* ── SUMMARY VIEW ── */}
        {!loading && view === 'summary' && (
          <div className="overflow-auto flex-1" style={{ minHeight: 0 }}>
            <div className="grid grid-cols-[120px_1fr_110px_110px_110px] sticky top-0 bg-stone-50 border-b border-stone-200">
              {['Date', 'Summary', 'Sales (Credit)', 'Debits', 'Net Day'].map((h, i) => (
                <div key={h} className={clsx('px-3 py-2.5 text-[10px] font-bold text-stone-400 uppercase tracking-wide', i > 1 ? 'text-right' : '')}>{h}</div>
              ))}
            </div>
            {filteredDates.map(date => {
              const { credits, debits } = byDate[date];
              const cr  = credits.reduce((s, e) => s + Number(e.amount), 0);
              const dr  = debits.reduce((s,  e) => s + Number(e.amount), 0);
              const net = cr - dr;
              return (
                <div key={date} className="grid grid-cols-[120px_1fr_110px_110px_110px] border-b border-stone-100 hover:bg-stone-50">
                  <div className="px-3 py-3 text-xs font-semibold text-stone-700">{fmtD(date)}</div>
                  <div className="px-3 py-3 text-xs text-stone-500">
                    {credits.reduce((s, e) => s + (e.subEntries?.length || 0), 0)} sales
                    {debits.length > 0 && ` · ${debits.length} debit entries`}
                  </div>
                  <div className="px-3 py-3 text-xs font-bold text-right font-mono text-green-shop">{cr > 0 ? fmt(cr) : '—'}</div>
                  <div className="px-3 py-3 text-xs font-bold text-right font-mono text-brand-500">{dr > 0 ? fmt(dr) : '—'}</div>
                  <div className={clsx('px-3 py-3 text-xs font-bold text-right font-mono', net >= 0 ? 'text-green-shop' : 'text-brand-500')}>
                    {net >= 0 ? '+' : '−'}{fmt(Math.abs(net))}
                  </div>
                </div>
              );
            })}
            {filteredDates.length === 0 && (
              <div className="py-16 text-center text-stone-400"><p className="text-sm">No entries for selected period</p></div>
            )}
            {/* Totals row */}
            {filteredDates.length > 0 && (() => {
              const grandCr  = entries.filter(e => e.type === 'CREDIT').reduce((s, e) => s + Number(e.amount), 0);
              const grandDr  = entries.filter(e => e.type === 'DEBIT').reduce((s,  e) => s + Number(e.amount), 0);
              const grandNet = grandCr - grandDr;
              return (
                <div className="grid grid-cols-[120px_1fr_110px_110px_110px] border-t-2 border-stone-300 bg-stone-100">
                  <div className="px-3 py-3 text-xs font-bold text-stone-700">Total</div>
                  <div />
                  <div className="px-3 py-3 text-sm font-bold text-right font-mono text-green-shop">{fmt(grandCr)}</div>
                  <div className="px-3 py-3 text-sm font-bold text-right font-mono text-brand-500">{fmt(grandDr)}</div>
                  <div className={clsx('px-3 py-3 text-sm font-bold text-right font-mono', grandNet >= 0 ? 'text-green-shop' : 'text-brand-500')}>
                    {grandNet >= 0 ? '+' : '−'}{fmt(Math.abs(grandNet))}
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </div>
    </div>
  );
}