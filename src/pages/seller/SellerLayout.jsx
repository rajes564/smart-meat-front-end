import React, { useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { LogOut, Store } from 'lucide-react';
import { useAuthStore, useShopStore } from '../../store';
import { shopApi } from '../../services/api';
import toast from 'react-hot-toast';
import { clsx } from 'clsx';

export function SellerLayout() {
  const { user, logout } = useAuthStore();
  const { settings, updateStatus } = useShopStore();
  const navigate = useNavigate();

  // Lock body scroll — same as AdminLayout, only the content area scrolls
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
      document.documentElement.style.overflow = '';
    };
  }, []);

  return (
    // Full viewport height, no body scroll
    <div
      className="flex flex-col bg-[#faf6f1] font-sans"
      style={{ height: '100vh', overflow: 'hidden' }}
    >
      {/* Fixed-height header */}
      <header className="flex-shrink-0 bg-white border-b border-stone-200 px-4 py-3 flex items-center justify-between shadow-sm z-40">
        <div className="flex items-center gap-3" >
          <div className="w-9 h-9 bg-brand-500 rounded-xl flex items-center justify-center text-lg">
          <img src="/images/meat_logo.jpg" alt="Shop Logo" className="w-full h-full object-cover rounded-xl" />
          </div>
         
          <div>
            <p className="text-sm font-bold text-stone-800">RS ROYAL SMART MEAT</p>
            <p className="text-xs text-stone-400">Seller · {user?.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={async () => {
              const next = settings?.status === 'OPEN' ? 'CLOSED' : 'OPEN';
              await shopApi.toggleStatus(next);
              updateStatus(next);
              toast.success(`Shop marked ${next}`);
            }}
            className={clsx(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition',
              settings?.status === 'OPEN'
                ? 'bg-green-light text-green-shop'
                : 'bg-red-50 text-red-500'
            )}
          >
            <Store size={13} /> {settings?.status || 'OPEN'}
          </button>
          <button
            onClick={() => { logout(); navigate('/'); }}
            className="p-2 rounded-lg hover:bg-stone-100 text-stone-400 hover:text-brand-500 transition"
          >
            <LogOut size={16} />
          </button>
        </div>
      </header>

      {/*
       * Content area — flex-1 fills remaining height after header.
       * overflow:hidden here so the NewSale component's two-column layout
       * fills exactly this space with its own internal scroll logic.
       * p-4 gives breathing room on all sides.
       */}
      <main
        className="flex-1 p-4"
        style={{ overflow: 'hidden', minHeight: 0 }}
      >
        <Outlet />
      </main>
    </div>
  );
}

export default SellerLayout;