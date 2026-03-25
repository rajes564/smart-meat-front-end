import React, { useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from 'react-query';
import { ordersApi } from '../services/api';
import { gsap } from 'gsap';
import { CheckCircle, Clock, Package, Truck, ArrowLeft } from 'lucide-react';
import { clsx } from 'clsx';

const STEPS = [
  { status: 'PENDING',  label: 'Order Placed',   icon: Clock,        desc: 'Your order has been received' },
  { status: 'ACCEPTED', label: 'Order Accepted',  icon: CheckCircle,  desc: 'Shop has accepted your order' },
  { status: 'PREPARING',label: 'Being Prepared',  icon: Package,      desc: 'Your order is being prepared' },
  { status: 'READY',    label: 'Ready to Collect',icon: Truck,        desc: 'Head to the Dispatch Counter!' },
  { status: 'COLLECTED',label: 'Collected',        icon: CheckCircle,  desc: 'Order complete. Enjoy!' },
];

function getStepIndex(status) {
  return STEPS.findIndex(s => s.status === status);
}

export default function OrderStatusPage() {
  const { id } = useParams();
  const containerRef = useRef();

  const { data: order, isLoading, error } = useQuery(
    ['order', id], () => ordersApi.getById(id), { refetchInterval: 10000 }
  );

  useEffect(() => {
    if (!isLoading && containerRef.current) {
      gsap.from(containerRef.current.querySelectorAll('.anim-step'), {
        opacity: 0, x: -20, stagger: 0.12, duration: 0.5, ease: 'power2.out',
      });
    }
  }, [isLoading]);

  if (isLoading) return (
    <div className="min-h-screen bg-[#faf6f1] flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-brand-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm text-stone-400">Loading order status…</p>
      </div>
    </div>
  );

  if (error || !order) return (
    <div className="min-h-screen bg-[#faf6f1] flex items-center justify-center p-4">
      <div className="text-center max-w-sm">
        <p className="text-4xl mb-3">🔍</p>
        <h2 className="font-display text-xl font-bold text-stone-800 mb-2">Order not found</h2>
        <p className="text-sm text-stone-400 mb-5">The order ID may be incorrect or has expired.</p>
        <Link to="/" className="text-brand-500 font-semibold hover:underline flex items-center gap-1.5 justify-center">
          <ArrowLeft size={14} /> Go home
        </Link>
      </div>
    </div>
  );

  const activeStep = getStepIndex(order.status);
  const isCancelled = order.status === 'CANCELLED';

  return (
    <div className="min-h-screen bg-[#faf6f1] font-sans">
      {/* Header */}
      <div className="bg-white border-b border-stone-200 px-4 py-3 flex items-center gap-3 sticky top-0 z-10 shadow-sm">
        <Link to="/" className="text-stone-400 hover:text-stone-700"><ArrowLeft size={18} /></Link>
        <div>
          <p className="text-sm font-bold text-stone-800">Order Status</p>
          <p className="text-xs text-stone-400 font-mono">{order.orderNumber}</p>
        </div>
      </div>

      <div ref={containerRef} className="max-w-lg mx-auto p-4 space-y-4 py-6">
        {/* Status hero */}
        <div className={clsx(
          'rounded-2xl p-6 text-center text-white',
          isCancelled ? 'bg-red-500' :
          order.status === 'COLLECTED' ? 'bg-green-shop' :
          'bg-gradient-to-br from-brand-500 to-brand-400'
        )}>
          <p className="text-4xl mb-2">
            {isCancelled ? '❌' : order.status === 'COLLECTED' ? '✅' : order.status === 'READY' ? '🏪' : '🕐'}
          </p>
          <h2 className="font-display text-xl font-bold mb-1">
            {isCancelled ? 'Order Cancelled' : STEPS[activeStep]?.label || order.status}
          </h2>
          <p className="text-sm opacity-85">
            {isCancelled ? 'Your order was cancelled. Contact us for help.' : STEPS[activeStep]?.desc}
          </p>
          {order.status === 'READY' && (
            <div className="mt-3 bg-white/20 rounded-xl p-3">
              <p className="font-bold text-sm">Head to the Dispatch Counter</p>
              <p className="text-xs opacity-80 mt-0.5">Show this screen to collect your order</p>
            </div>
          )}
        </div>

        {/* Progress steps */}
        {!isCancelled && (
          <div className="bg-white rounded-2xl border border-stone-200 shadow-card p-5">
            <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-4">Order Progress</p>
            <div className="space-y-0">
              {STEPS.slice(0, -1).map((step, idx) => {
                const isDone    = idx < activeStep;
                const isActive  = idx === activeStep;
                const isPending = idx > activeStep;
                const Icon = step.icon;
                return (
                  <div key={step.status} className="anim-step flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className={clsx(
                        'w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-all',
                        isDone   ? 'bg-green-shop text-white' :
                        isActive ? 'bg-brand-500 text-white ring-4 ring-brand-100' :
                        'bg-stone-100 text-stone-300'
                      )}>
                        <Icon size={16} />
                      </div>
                      {idx < STEPS.length - 2 && (
                        <div className={clsx('w-0.5 flex-1 my-1 min-h-6', isDone ? 'bg-green-shop' : 'bg-stone-200')} />
                      )}
                    </div>
                    <div className="pb-5 pt-1.5">
                      <p className={clsx('text-sm font-semibold', isDone ? 'text-green-shop' : isActive ? 'text-stone-900' : 'text-stone-400')}>{step.label}</p>
                      {(isDone || isActive) && <p className="text-xs text-stone-400 mt-0.5">{step.desc}</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Order details */}
        <div className="bg-white rounded-2xl border border-stone-200 shadow-card p-5">
          <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-4">Order Details</p>
          <div className="space-y-2 mb-4">
            {order.items?.map((item, i) => (
              <div key={i} className="flex justify-between text-sm">
                <span className="text-stone-600">{item.productName} × {item.qty}kg</span>
                <span className="font-semibold text-stone-800">₹{Number(item.total).toLocaleString('en-IN')}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-stone-100 pt-3 flex justify-between">
            <span className="font-bold text-stone-800">Total</span>
            <span className="font-bold text-brand-500 text-base">₹{Number(order.total).toLocaleString('en-IN')}</span>
          </div>
          <div className="mt-3 text-xs text-stone-400 grid grid-cols-2 gap-1">
            <span>Customer: {order.customerName}</span>
            <span>Payment: {order.paymentMethod}</span>
            <span className="col-span-2">Order: {new Date(order.createdAt).toLocaleString('en-IN')}</span>
          </div>
        </div>

        {/* Contact */}
        <div className="bg-brand-50 rounded-2xl p-4 text-center border border-brand-100">
          <p className="text-sm text-brand-700 font-medium">Need help with your order?</p>
          <a href="tel:+919121200123" className="text-brand-600 font-bold text-sm hover:underline mt-1 block">📞 +91 91212 00123</a>
        </div>
      </div>
    </div>
  );
}
