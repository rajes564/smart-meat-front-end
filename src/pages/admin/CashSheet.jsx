import React, { useState, useRef, useEffect } from 'react';
import { useQuery } from 'react-query';
import { reportsApi } from '../../services/api';
import { gsap } from 'gsap';
import { Download, ChevronDown, ChevronUp, ExpandIcon, Search } from 'lucide-react';
import { clsx } from 'clsx';

const COL = 'grid grid-cols-[130px_1fr_110px_110px_110px_36px]';

function fmt(n) { return '₹' + Math.abs(Number(n || 0)).toLocaleString('en-IN'); }
function fmtDate(d) {
  try { return new Date(d + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' }); }
  catch { return d; }
}

export default function CashSheet() {
  const today = new Date().toISOString().slice(0, 10);
  const sevenAgo = new Date(Date.now() - 6 * 86400000).toISOString().slice(0, 10);

  const [from, setFrom] = useState(sevenAgo);
  const [to, setTo] = useState(today);
  const [typeFilter, setTypeFilter] = useState('all');
  const [catFilter, setCatFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [expandedRows, setExpandedRows] = useState({});
  const [allExpanded, setAllExpanded] = useState(false);
  const [view, setView] = useState('daybook'); // daybook | summary
  const tableRef = useRef();

  const { data, isLoading, refetch } = useQuery(
    ['cash-sheet', from, to, typeFilter, catFilter],
    () => reportsApi.cashSheet({ from, to, type: typeFilter !== 'all' ? typeFilter : undefined, category: catFilter !== 'all' ? catFilter : undefined }),
    { enabled: !!from && !!to }
  );

  useEffect(() => {
    if (!isLoading && tableRef.current) {
      gsap.from(tableRef.current.querySelectorAll('.cs-row-anim'), {
        opacity: 0, x: -8, duration: 0.3, stagger: 0.02, ease: 'power1.out',
      });
    }
  }, [isLoading, data]);

  const toggleRow = (key) => setExpandedRows(prev => ({ ...prev, [key]: !prev[key] }));

  const toggleAll = () => {
    const hasExpandable = (data?.entries || []).filter(e => e.subEntries?.length > 0);
    const newState = {};
    hasExpandable.forEach(e => { newState[e.date + e.category] = !allExpanded; });
    setExpandedRows(newState);
    setAllExpanded(a => !a);
  };

  const exportCSV = () => {
    const entries = data?.entries || [];
    const header = ['Date', 'Type', 'Category', 'Description', 'Credit (₹)', 'Debit (₹)', 'Balance (₹)', 'Staff'];
    const rows = entries.map(e => [
      e.date, e.type, e.category, e.description,
      e.type === 'CREDIT' ? e.amount : '',
      e.type === 'DEBIT' ? e.amount : '',
      e.runningBalance, e.staff || ''
    ]);
    const csv = [header, ...rows].map(r => r.join(',')).join('\n');
    const a = document.createElement('a');
    a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
    a.download = `cash_sheet_${from}_to_${to}.csv`;
    a.click();
  };

  // Group entries by date for day-view
  const entriesByDate = {};
  (data?.entries || []).forEach(e => {
    if (!entriesByDate[e.date]) entriesByDate[e.date] = { credits: [], debits: [] };
    if (e.type === 'CREDIT') entriesByDate[e.date].credits.push(e);
    else entriesByDate[e.date].debits.push(e);
  });

  const filteredDates = Object.keys(entriesByDate).filter(date => {
    const day = entriesByDate[date];
    const allEntries = [...day.credits, ...day.debits];
    if (search) return allEntries.some(e => e.description?.toLowerCase().includes(search.toLowerCase()));
    return true;
  }).sort();

  const SUMMARY_CARDS = [
    { label: 'Total Credit',    value: fmt(data?.totalCredit),    sub: 'Sales + Khata received',  color: 'green', bar: 'bg-green-shop' },
    { label: 'Total Debit',     value: fmt(data?.totalDebit),     sub: 'Stock + Expenses',         color: 'brand', bar: 'bg-brand-500' },
    { label: 'Opening Balance', value: fmt(data?.openingBalance), sub: 'Cash at period start',     color: 'blue',  bar: 'bg-blue-500' },
    { label: 'Closing Balance', value: fmt(data?.closingBalance), sub: Number(data?.closingBalance) >= 0 ? 'Surplus' : 'Deficit', color: Number(data?.closingBalance) >= 0 ? 'green' : 'brand', bar: Number(data?.closingBalance) >= 0 ? 'bg-green-shop' : 'bg-brand-500' },
  ];

  const colorMap = {
    green: { bg: 'bg-green-light', text: 'text-green-shop', border: 'border-green-200' },
    brand: { bg: 'bg-brand-50',    text: 'text-brand-500',  border: 'border-brand-200' },
    blue:  { bg: 'bg-blue-50',     text: 'text-blue-600',   border: 'border-blue-200' },
  };

  return (
    <div className="flex flex-col h-full space-y-3">
      {/* Top bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 flex-shrink-0">
        <div>
          <h1 className="text-lg font-bold text-stone-800">Cash Sheet — Day Book</h1>
          <p className="text-sm text-stone-400">{fmtDate(from)} → {fmtDate(to)}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={exportCSV} className="flex items-center gap-1.5 border border-stone-200 rounded-xl px-3 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-50 transition">
            <Download size={13} /> CSV
          </button>
          <button onClick={() => window.print()} className="flex items-center gap-1.5 border border-stone-200 rounded-xl px-3 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-50 transition">
            🖨 Print
          </button>
        </div>
      </div>

      {/* Filter bar */}
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
        <select value={catFilter} onChange={e => setCatFilter(e.target.value)}
          className="border border-stone-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-brand-400">
          <option value="all">All Categories</option>
          <option value="SALES">Sales</option>
          <option value="STOCK_PURCHASE">Stock Purchase</option>
          <option value="EXPENSE">Expense</option>
          <option value="KHATA_PAYMENT">Khata Payment</option>
        </select>
        <div className="flex items-center gap-1.5 flex-1 min-w-28">
          <Search size={12} className="text-stone-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search entries…"
            className="flex-1 text-xs outline-none placeholder:text-stone-300 bg-transparent" />
        </div>
        <button onClick={() => refetch()} className="px-3 py-1.5 bg-brand-500 hover:bg-brand-600 text-white rounded-lg text-xs font-semibold transition">
          Apply
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 flex-shrink-0">
        {SUMMARY_CARDS.map(({ label, value, sub, color, bar }) => {
          const c = colorMap[color] || colorMap.brand;
          return (
            <div key={label} className={clsx('bg-white rounded-xl border shadow-card p-4 relative overflow-hidden', c.border)}>
              <div className={clsx('absolute top-0 left-0 right-0 h-0.5', bar)} />
              <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wide mb-1">{label}</p>
              <p className={clsx('text-xl font-bold font-mono', c.text)}>{value}</p>
              <p className="text-[10px] text-stone-400 mt-1">{sub}</p>
            </div>
          );
        })}
      </div>

      {/* View toggle + expand all */}
      <div className="flex items-center justify-between flex-shrink-0">
        <div className="flex bg-stone-100 rounded-lg p-0.5 gap-0.5">
          {[['daybook', 'Day Book'], ['summary', 'Day Summary']].map(([v, l]) => (
            <button key={v} onClick={() => setView(v)}
              className={clsx('px-3 py-1.5 rounded-md text-xs font-semibold transition',
                view === v ? 'bg-white text-stone-800 shadow-sm' : 'text-stone-500 hover:text-stone-700')}>
              {l}
            </button>
          ))}
        </div>
        {view === 'daybook' && (
          <button onClick={toggleAll}
            className="flex items-center gap-1.5 text-xs font-semibold text-stone-500 hover:text-stone-800 border border-stone-200 rounded-lg px-3 py-1.5 transition">
            {allExpanded ? <><ChevronUp size={12} /> Collapse All</> : <><ExpandIcon size={12} /> Expand All</>}
          </button>
        )}
      </div>

      {/* Sheet table — scrollable */}
      <div className="flex-1 overflow-auto bg-white rounded-2xl border border-stone-200 shadow-card" ref={tableRef}>
        {isLoading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-6 h-6 border-2 border-brand-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : view === 'daybook' ? (
          <>
            {/* Column header */}
            <div className={clsx(COL, 'sticky top-0 bg-stone-50 border-b border-stone-200 z-10')}>
              {['Date', 'Description', 'Credit (₹)', 'Debit (₹)', 'Balance (₹)', ''].map((h, i) => (
                <div key={i} className={clsx('px-3 py-2.5 text-[10px] font-bold text-stone-400 uppercase tracking-wide', i > 1 ? 'text-right' : '')}>{h}</div>
              ))}
            </div>

            {/* Opening balance */}
            <div className={clsx(COL, 'border-b border-blue-100 bg-blue-50')}>
              <div className="px-3 py-2.5 text-xs font-bold text-blue-700">{fmtDate(from)}</div>
              <div className="px-3 py-2.5 text-xs font-semibold text-blue-700">Opening Balance</div>
              <div className="px-3 py-2.5 text-xs text-blue-400 text-right">—</div>
              <div className="px-3 py-2.5 text-xs text-blue-400 text-right">—</div>
              <div className="px-3 py-2.5 text-xs font-bold text-blue-700 text-right font-mono">{fmt(data?.openingBalance)}</div>
              <div />
            </div>

            {filteredDates.length === 0 && (
              <div className="py-16 text-center text-stone-400">
                <p className="text-3xl mb-2">🔍</p>
                <p className="text-sm">No entries found for the selected filters</p>
              </div>
            )}

            {filteredDates.map(date => {
              const { credits, debits } = entriesByDate[date];
              return (
                <div key={date}>
                  {/* CREDIT section label */}
                  {credits.length > 0 && typeFilter !== 'debit' && (
                    <>
                      <div className="px-3 py-1.5 bg-green-light/60 border-y border-green-200">
                        <span className="text-[10px] font-bold text-green-shop uppercase tracking-wider">▲ Credit — {fmtDate(date)}</span>
                      </div>
                      {credits.map((entry, ci) => {
                        const rowKey = date + entry.category + ci;
                        const isExpanded = expandedRows[rowKey];
                        const hasSubs = entry.subEntries?.length > 0;
                        const isCr = true;
                        return (
                          <div key={rowKey} className="cs-row-anim border-b border-stone-100 last:border-0">
                            <div className={clsx(COL, 'hover:bg-green-light/30 transition cursor-pointer')}
                              onClick={() => hasSubs && toggleRow(rowKey)}>
                              <div className="px-3 py-2.5 text-xs font-semibold text-stone-700">{ci === 0 ? fmtDate(date) : ''}</div>
                              <div className="px-3 py-2.5 text-xs text-stone-600 flex items-center gap-2">
                                <span className={clsx('text-[9px] font-bold px-1.5 py-0.5 rounded-full',
                                  entry.category === 'SALES' ? 'bg-green-light text-green-shop' :
                                  entry.category === 'KHATA_PAYMENT' ? 'bg-blue-50 text-blue-600' : 'bg-stone-100 text-stone-500')}>
                                  {entry.category === 'KHATA_PAYMENT' ? 'Khata' : 'Sales'}
                                </span>
                                {entry.description}
                                {entry.staff && <span className="text-[9px] text-stone-400">· {entry.staff}</span>}
                              </div>
                              <div className="px-3 py-2.5 text-xs font-bold text-green-shop text-right font-mono">{fmt(entry.amount)}</div>
                              <div className="px-3 py-2.5 text-xs text-stone-300 text-right">—</div>
                              <div className={clsx('px-3 py-2.5 text-xs font-bold text-right font-mono',
                                Number(entry.runningBalance) >= 0 ? 'text-green-shop' : 'text-brand-500')}>
                                {fmt(entry.runningBalance)}
                              </div>
                              <div className="flex items-center justify-center py-2">
                                {hasSubs && (
                                  <button className={clsx('w-5 h-5 rounded flex items-center justify-center border text-[10px] font-bold transition',
                                    isExpanded ? 'bg-green-light border-green-300 text-green-shop' : 'border-stone-200 text-stone-400 hover:border-green-300 hover:text-green-shop')}>
                                    {isExpanded ? '−' : '+'}
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* Sub-transactions */}
                            {hasSubs && isExpanded && (
                              <div className="bg-green-light/20 border-t border-green-100">
                                <div className={clsx(COL, 'bg-green-light/40 border-b border-green-100')}>
                                  {['Time', 'Customer & Items', 'Amount', '', 'Payment', ''].map((h, i) => (
                                    <div key={i} className={clsx('px-3 py-1.5 text-[9px] font-bold text-green-700 uppercase tracking-wide', i > 1 ? 'text-right' : '')}>{h}</div>
                                  ))}
                                </div>
                                {entry.subEntries.map((sub, si) => (
                                  <div key={si} className={clsx(COL, 'border-b border-green-100/60 last:border-0 hover:bg-green-light/30')}>
                                    <div className="px-3 py-2 text-[10px] font-mono text-stone-400">{sub.time}</div>
                                    <div className="px-3 py-2 text-xs text-stone-600">{sub.label} <span className="text-stone-400">— {sub.detail}</span></div>
                                    <div className="px-3 py-2 text-xs font-bold text-green-shop text-right font-mono">{fmt(sub.amount)}</div>
                                    <div />
                                    <div className="px-3 py-2 text-right">
                                      <span className={clsx('text-[9px] font-bold px-2 py-0.5 rounded-full',
                                        sub.paymentMethod === 'CASH' ? 'bg-green-light text-green-shop' :
                                        sub.paymentMethod === 'UPI' ? 'bg-blue-50 text-blue-600' :
                                        sub.paymentMethod === 'KHATA' ? 'bg-amber-light text-amber-shop' :
                                        'bg-stone-100 text-stone-500')}>
                                        {sub.paymentMethod}
                                      </span>
                                    </div>
                                    <div />
                                  </div>
                                ))}
                                {/* Day total */}
                                <div className={clsx(COL, 'bg-green-light border-t border-green-200')}>
                                  <div />
                                  <div className="px-3 py-2 text-[10px] font-bold text-green-700">{entry.subEntries.length} transactions</div>
                                  <div className="px-3 py-2 text-xs font-bold text-green-shop text-right font-mono">{fmt(entry.amount)}</div>
                                  <div /><div /><div />
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </>
                  )}

                  {/* DEBIT section label */}
                  {debits.length > 0 && typeFilter !== 'credit' && (
                    <>
                      <div className="px-3 py-1.5 bg-brand-50 border-y border-brand-100">
                        <span className="text-[10px] font-bold text-brand-500 uppercase tracking-wider">▼ Debit — {fmtDate(date)}</span>
                      </div>
                      {debits.map((entry, di) => {
                        const rowKey = 'dr_' + date + entry.category + di;
                        const isExpanded = expandedRows[rowKey];
                        const hasSubs = entry.subEntries?.length > 0;
                        return (
                          <div key={rowKey} className="cs-row-anim border-b border-stone-100 last:border-0">
                            <div className={clsx(COL, 'hover:bg-brand-50/40 transition', hasSubs ? 'cursor-pointer' : '')}
                              onClick={() => hasSubs && toggleRow(rowKey)}>
                              <div className="px-3 py-2.5 text-xs font-semibold text-stone-700">{di === 0 && credits.length === 0 ? fmtDate(date) : ''}</div>
                              <div className="px-3 py-2.5 text-xs text-stone-600 flex items-center gap-2">
                                <span className={clsx('text-[9px] font-bold px-1.5 py-0.5 rounded-full',
                                  entry.category === 'STOCK_PURCHASE' ? 'bg-amber-light text-amber-shop' : 'bg-red-50 text-red-500')}>
                                  {entry.category === 'STOCK_PURCHASE' ? 'Stock' : 'Expense'}
                                </span>
                                {entry.description}
                                {entry.staff && <span className="text-[9px] text-stone-400">· {entry.staff}</span>}
                              </div>
                              <div className="px-3 py-2.5 text-xs text-stone-300 text-right">—</div>
                              <div className="px-3 py-2.5 text-xs font-bold text-brand-500 text-right font-mono">{fmt(entry.amount)}</div>
                              <div className={clsx('px-3 py-2.5 text-xs font-bold text-right font-mono',
                                Number(entry.runningBalance) >= 0 ? 'text-green-shop' : 'text-brand-500')}>
                                {fmt(entry.runningBalance)}
                              </div>
                              <div className="flex items-center justify-center py-2">
                                {hasSubs && (
                                  <button className={clsx('w-5 h-5 rounded flex items-center justify-center border text-[10px] font-bold transition',
                                    isExpanded ? 'bg-brand-50 border-brand-300 text-brand-500' : 'border-stone-200 text-stone-400 hover:border-brand-300 hover:text-brand-500')}>
                                    {isExpanded ? '−' : '+'}
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* Debit sub-entries */}
                            {hasSubs && isExpanded && (
                              <div className="bg-brand-50/20 border-t border-brand-100">
                                <div className={clsx(COL, 'bg-brand-50/60 border-b border-brand-100')}>
                                  {['Ref', 'Description', 'Amount', 'Paid', 'Due / Status', ''].map((h, i) => (
                                    <div key={i} className={clsx('px-3 py-1.5 text-[9px] font-bold text-brand-600 uppercase tracking-wide', i > 1 ? 'text-right' : '')}>{h}</div>
                                  ))}
                                </div>
                                {entry.subEntries.map((sub, si) => (
                                  <div key={si} className={clsx(COL, 'border-b border-brand-100/60 last:border-0 hover:bg-brand-50/30')}>
                                    <div className="px-3 py-2 text-[10px] font-mono text-stone-400">{sub.label}</div>
                                    <div className="px-3 py-2 text-xs text-stone-600">{sub.detail}</div>
                                    <div className="px-3 py-2 text-xs font-bold text-brand-500 text-right font-mono">{fmt(sub.amount)}</div>
                                    <div className="px-3 py-2 text-xs text-green-shop text-right font-mono font-semibold">
                                      {sub.paymentMethod ? fmt(sub.paymentMethod) : '—'}
                                    </div>
                                    <div className="px-3 py-2 text-right">
                                      <span className="text-[9px] font-bold">{sub.time || '—'}</span>
                                    </div>
                                    <div />
                                  </div>
                                ))}
                                <div className={clsx(COL, 'bg-brand-50 border-t border-brand-200')}>
                                  <div />
                                  <div className="px-3 py-2 text-[10px] font-bold text-brand-600">{entry.subEntries.length} entries</div>
                                  <div className="px-3 py-2 text-xs font-bold text-brand-500 text-right font-mono">{fmt(entry.amount)}</div>
                                  <div /><div /><div />
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </>
                  )}
                </div>
              );
            })}

            {/* Closing balance */}
            {filteredDates.length > 0 && (
              <div className={clsx(COL, 'border-t-2 border-stone-300 bg-stone-50 sticky bottom-0')}>
                <div className="px-3 py-3 text-xs font-bold text-stone-600">{fmtDate(to)}</div>
                <div className="px-3 py-3 text-xs font-bold text-stone-700">Closing Balance</div>
                <div className="px-3 py-3 text-xs text-stone-300 text-right">—</div>
                <div className="px-3 py-3 text-xs text-stone-300 text-right">—</div>
                <div className={clsx('px-3 py-3 text-sm font-bold text-right font-mono',
                  Number(data?.closingBalance) >= 0 ? 'text-green-shop' : 'text-brand-500')}>
                  {fmt(data?.closingBalance)}
                </div>
                <div />
              </div>
            )}
          </>
        ) : (
          /* ── DAY SUMMARY VIEW ── */
          <>
            <div className={clsx('grid grid-cols-[130px_1fr_110px_110px_110px_36px]', 'sticky top-0 bg-stone-50 border-b border-stone-200 z-10')}>
              {['Date', 'Summary', 'Sales Credit', 'Debit', 'Net Day', ''].map((h, i) => (
                <div key={i} className={clsx('px-3 py-2.5 text-[10px] font-bold text-stone-400 uppercase tracking-wide', i > 1 ? 'text-right' : '')}>{h}</div>
              ))}
            </div>
            {filteredDates.map(date => {
              const { credits, debits } = entriesByDate[date];
              const totalCr = credits.reduce((s, e) => s + Number(e.amount), 0);
              const totalDr = debits.reduce((s, e) => s + Number(e.amount), 0);
              const net = totalCr - totalDr;
              const txCount = credits.reduce((s, e) => s + (e.subEntries?.length || 0), 0);
              return (
                <div key={date} className="cs-row-anim grid grid-cols-[130px_1fr_110px_110px_110px_36px] border-b border-stone-100 hover:bg-stone-50 transition">
                  <div className="px-3 py-3 text-xs font-semibold text-stone-700">{fmtDate(date)}</div>
                  <div className="px-3 py-3 text-xs text-stone-500">
                    {txCount > 0 && <span>{txCount} sale txns · </span>}
                    {debits.length > 0 && <span>{debits.length} debit entries</span>}
                  </div>
                  <div className="px-3 py-3 text-xs font-bold text-green-shop text-right font-mono">{totalCr > 0 ? fmt(totalCr) : '—'}</div>
                  <div className="px-3 py-3 text-xs font-bold text-brand-500 text-right font-mono">{totalDr > 0 ? fmt(totalDr) : '—'}</div>
                  <div className={clsx('px-3 py-3 text-xs font-bold text-right font-mono', net >= 0 ? 'text-green-shop' : 'text-brand-500')}>
                    {net >= 0 ? '+' : '-'}{fmt(Math.abs(net))}
                  </div>
                  <div />
                </div>
              );
            })}
            {/* Totals */}
            {filteredDates.length > 0 && (() => {
              const grandCr = (data?.entries || []).filter(e => e.type === 'CREDIT').reduce((s, e) => s + Number(e.amount), 0);
              const grandDr = (data?.entries || []).filter(e => e.type === 'DEBIT').reduce((s, e) => s + Number(e.amount), 0);
              const net = grandCr - grandDr;
              return (
                <div className="grid grid-cols-[130px_1fr_110px_110px_110px_36px] border-t-2 border-stone-300 bg-stone-100">
                  <div className="px-3 py-3 text-xs font-bold text-stone-700">Total</div>
                  <div />
                  <div className="px-3 py-3 text-sm font-bold text-green-shop text-right font-mono">{fmt(grandCr)}</div>
                  <div className="px-3 py-3 text-sm font-bold text-brand-500 text-right font-mono">{fmt(grandDr)}</div>
                  <div className={clsx('px-3 py-3 text-sm font-bold text-right font-mono', net >= 0 ? 'text-green-shop' : 'text-brand-500')}>
                    {fmt(Math.abs(net))}
                  </div>
                  <div />
                </div>
              );
            })()}
            {filteredDates.length === 0 && (
              <div className="py-16 text-center text-stone-400"><p className="text-sm">No entries for selected period</p></div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
