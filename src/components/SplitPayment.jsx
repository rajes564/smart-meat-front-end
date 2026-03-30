/**
 * SplitPayment — reusable payment mode selector with split support.
 * computeSplit(value, total) → { cashDelta, accountDelta, isValid, error }
 */
import React from 'react';
import { Banknote, Smartphone, AlertTriangle, CheckCircle } from 'lucide-react';
import { clsx } from 'clsx';

export function computeSplit(value, total) {
  const { mode, cashAmt, upiAmt } = value || {};
  const t = Number(total || 0);
  if (mode === 'CASH')
    return { cashDelta: t, accountDelta: 0, isValid: true, error: null };
  if (mode === 'UPI' || mode === 'CARD')
    return { cashDelta: 0, accountDelta: t, isValid: true, error: null };
  if (mode === 'SPLIT') {
    const c = Number(cashAmt || 0);
    const u = Number(upiAmt  || 0);
    const sum = c + u;
    if (c < 0 || u < 0)
      return { cashDelta: c, accountDelta: u, isValid: false, error: 'Amounts cannot be negative' };
    if (Math.abs(sum - t) > 0.5)
      return { cashDelta: c, accountDelta: u, isValid: false,
               error: `Split total ₹${sum.toFixed(0)} must equal ₹${t.toFixed(0)}` };
    return { cashDelta: c, accountDelta: u, isValid: true, error: null };
  }
  return { cashDelta: t, accountDelta: 0, isValid: true, error: null };
}

const MODES = [
  { value: 'CASH',  emoji: '💵', label: 'Cash'  },
  { value: 'UPI',   emoji: '📱', label: 'UPI'   },
  { value: 'CARD',  emoji: '💳', label: 'Card'  },
  { value: 'SPLIT', emoji: '🔀', label: 'Split' },
];

export default function SplitPayment({ total, value = {}, onChange, label, disabled }) {
  const { mode = 'CASH', cashAmt = '', upiAmt = '' } = value;
  const t = Number(total || 0);
  const { isValid, error } = computeSplit(value, total);
  const c = Number(cashAmt || 0);
  const u = Number(upiAmt  || 0);
  const sum = c + u;

  const setMode = (m) => onChange({ mode: m, cashAmt: '', upiAmt: '' });

  return (
    <div className="space-y-2">
      {label && (
        <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">{label}</p>
      )}

      {/* Mode selector buttons */}
      <div className="grid grid-cols-4 gap-1.5">
        {MODES.map(opt => (
          <button key={opt.value} type="button" disabled={disabled}
            onClick={() => setMode(opt.value)}
            className={clsx(
              'border-2 rounded-xl py-2 text-[10px] font-bold transition flex flex-col items-center gap-0.5',
              disabled && 'opacity-50 cursor-not-allowed',
              mode === opt.value
                ? 'border-brand-500 bg-brand-50 text-brand-700'
                : 'border-stone-200 text-stone-500 hover:border-stone-300'
            )}>
            <span className="text-sm leading-none">{opt.emoji}</span>
            <span>{opt.label}</span>
          </button>
        ))}
      </div>

      {/* Split inputs */}
      {mode === 'SPLIT' && (
        <div className="space-y-2 pt-0.5">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] font-semibold text-green-shop mb-1 flex items-center gap-1">
                <Banknote size={10} /> Cash (₹)
              </label>
              <input type="number" min="0" step="1"
                value={cashAmt} placeholder="0"
                disabled={disabled}
                onChange={e => onChange({ ...value, cashAmt: e.target.value })}
                className="w-full border border-green-300 rounded-lg px-2.5 py-2 text-sm font-mono focus:outline-none focus:border-green-500" />
            </div>
            <div>
              <label className="text-[10px] font-semibold text-blue-500 mb-1 flex items-center gap-1">
                <Smartphone size={10} /> UPI / Card (₹)
              </label>
              <input type="number" min="0" step="1"
                value={upiAmt} placeholder="0"
                disabled={disabled}
                onChange={e => onChange({ ...value, upiAmt: e.target.value })}
                className="w-full border border-blue-300 rounded-lg px-2.5 py-2 text-sm font-mono focus:outline-none focus:border-blue-500" />
            </div>
          </div>

          {/* Validation row */}
          {sum > 0 && (
            <div className={clsx(
              'flex items-center justify-between rounded-lg px-3 py-2 text-xs border',
              !isValid
                ? 'bg-red-50 border-red-200 text-red-600'
                : Math.abs(sum - t) < 0.5
                  ? 'bg-green-light border-green-200 text-green-shop'
                  : 'bg-amber-light border-amber-200 text-amber-shop'
            )}>
              <span>
                <span className="text-green-shop font-bold">₹{c.toFixed(0)}</span>
                <span className="mx-1 text-stone-400">+</span>
                <span className="text-blue-500 font-bold">₹{u.toFixed(0)}</span>
                <span className="mx-1 text-stone-400">=</span>
                <span className="font-bold">₹{sum.toFixed(0)}</span>
              </span>
              <span className="flex items-center gap-1 font-bold text-xs">
                {error
                  ? <><AlertTriangle size={11} /> {error}</>
                  : <><CheckCircle size={11} /> Exact</>
                }
              </span>
            </div>
          )}
          {sum === 0 && t > 0 && (
            <p className="text-[10px] text-stone-400">
              Must total <span className="font-bold text-stone-600">₹{t.toFixed(0)}</span>
            </p>
          )}
        </div>
      )}
    </div>
  );
}