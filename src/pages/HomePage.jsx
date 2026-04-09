import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useQuery, useMutation } from 'react-query';
import { useCartStore, useAuthStore } from '../store';
import { productsApi, categoriesApi, shopApi, reviewsApi, ordersApi } from '../services/api';
import {
  ShoppingCart, Star, Phone, Mail, MapPin, Clock,
  X, Minus, Plus, ChevronUp, ArrowRight, LogIn,
  ChevronLeft, ChevronRight, Play, Pause, Volume2, VolumeX,
  Instagram,
  Facebook,
  YoutubeIcon
} from 'lucide-react';
import { clsx } from 'clsx';
import toast from 'react-hot-toast';
import { Link, useNavigate } from 'react-router-dom';
import { useRazorpay } from '../components/useRazorpay';
import ShareSection from '../components/ShareSection';


// ═══════════════════════════════════════════════════════════════════════════════
// Scroll-reveal hook using IntersectionObserver
// ═══════════════════════════════════════════════════════════════════════════════
function useInView(options = {}) {
  const ref  = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setVisible(true);
        obs.disconnect();
      }
    }, { threshold: 0.1, rootMargin: '0px 0px -60px 0px', ...options });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return [ref, visible];
}

const reveal = (visible, delay = 0) => ({
  opacity:    visible ? 1 : 0,
  transform:  visible ? 'translateY(0)' : 'translateY(22px)',
  transition: `opacity 0.5s ease ${delay}ms, transform 0.5s ease ${delay}ms`,
});

// ═══════════════════════════════════════════════════════════════════════════════
// LOADER
// ═══════════════════════════════════════════════════════════════════════════════
function SiteLoader({ onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 1800);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div className="fixed inset-0 bg-[#f5eeea] z-[9999] flex flex-col items-center justify-center">
      <div className="flex gap-3 mb-5">
        {['🐟','🍗','🥩'].map((e, i) => (
          <span
            key={i}
            className="text-5xl sm:text-6xl"
            style={{ animation: `loaderBounce 0.75s ease ${i * 0.22}s infinite alternate` }}
          >
            {e}
          </span>
        ))}
      </div>
      <h1 className="font-display text-2xl sm:text-3xl font-bold text-stone-800 mb-1">
        RS ROYAL MEAT MART
      </h1>
      <p className="text-sm text-stone-400 mb-6">Fresh Fish · Chicken · Mutton · Daily</p>
      <div className="w-40 h-1 bg-stone-200 rounded-full overflow-hidden">
        <div style={{ animation: 'loaderBar 1.6s ease forwards' }}
          className="h-full bg-brand-500 rounded-full" />
      </div>
      <style>{`
        @keyframes loaderBounce {
          from { transform: translateY(0)   scale(1);    }
          to   { transform: translateY(-14px) scale(1.12); }
        }
        @keyframes loaderBar {
          from { width: 0%;   }
          to   { width: 100%; }
        }
      `}</style>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// NAVBAR
// ═══════════════════════════════════════════════════════════════════════════════
function Navbar({ cartCount, onOpenCart, settings }) {
  const [scrolled, setScrolled] = useState(false);
  const { user, token } = useAuthStore();

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  



  return (
    <nav className={clsx(
      'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
      scrolled ? 'bg-white/95 backdrop-blur-md shadow-sm border-b border-stone-200' : 'bg-transparent'
    )}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-brand-500 rounded-xl flex items-center justify-center text-lg">
            {settings?.logoUrl ? (
              <img src={settings.logoUrl} alt="Shop Logo" className="w-full h-full object-cover rounded-xl" />
            ) : (
              <span>🥩</span>
            )}
          </div>
          <div>
            <p className={clsx('font-display text-base font-bold leading-none transition', scrolled ? 'text-stone-900' : 'text-white')}>
              RS ROYAL MEAT MART
            </p>
            <p className={clsx('text-[10px] transition', scrolled ? 'text-stone-400' : 'text-white/70')}>
              Fresh · Quality · Daily
            </p>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-1">
          {[['shop','🛒 Shop'],['gallery','Gallery'],['reviews','Reviews'],['contact','Contact']].map(([id, label]) => (
            <button key={id} onClick={() => scrollTo(id)}
              className={clsx('px-3 py-1.5 rounded-lg text-sm font-medium transition',
                scrolled ? 'text-stone-600 hover:bg-stone-100' : 'text-white/90 hover:bg-white/10')}>
              {label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button onClick={onOpenCart}
            className="relative flex items-center gap-1.5 bg-brand-500 hover:bg-brand-600 text-white px-3 py-2 rounded-xl text-sm font-semibold transition shadow-brand">
            <ShoppingCart size={15} />
            <span className="hidden sm:block">Cart</span>
            {cartCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-white text-brand-600 text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-brand-500">
                {cartCount}
              </span>
            )}
          </button>

          {token ? (
            <Link
              to={user?.role === 'ADMIN' ? '/admin' : user?.role === 'SELLER' ? '/seller' : '/'}
              className={clsx('px-3 py-2 rounded-xl text-sm font-medium transition border',
                scrolled ? 'border-stone-200 text-stone-700 hover:bg-stone-50' : 'border-white/30 text-white hover:bg-white/10')}>
              {user?.role === 'ADMIN' || user?.role === 'SELLER' ? 'Dashboard' : 'My Orders'}
            </Link>
          ) : (
            <Link to="/login"
              className={clsx('px-3 py-2 rounded-xl text-sm font-medium transition border flex items-center gap-1',
                scrolled ? 'border-stone-200 text-stone-700 hover:bg-stone-50' : 'border-white/30 text-white hover:bg-white/10')}>
              <LogIn size={14} /> Login
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// HERO — Carousel Background with multiple images (admin-managed)
// ═══════════════════════════════════════════════════════════════════════════════
function Hero({ settings, products }) {
  const [slideIdx, setSlideIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const intervalRef = useRef(null);

  // Admin-managed carousel images from settings, fallback to defaults
  const carouselImages = settings?.heroImages?.length
    ? settings.heroImages
    : [
        'https://images.unsplash.com/photo-1534482421-64566f976cfa?w=1600&q=80',
        'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=1600&q=80',
        'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=1600&q=80',
        'https://images.unsplash.com/photo-1602491453631-e2a5ad90a131?w=1600&q=80',
      ];

  const startInterval = useCallback(() => {
    clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setSlideIdx(i => (i + 1) % carouselImages.length);
    }, 5000);
  }, [carouselImages.length]);

  useEffect(() => {
    if (isPlaying) startInterval();
    else clearInterval(intervalRef.current);
    return () => clearInterval(intervalRef.current);
  }, [isPlaying, startInterval]);

  const goTo = (idx) => {
    setSlideIdx(idx);
    startInterval();
  };
  const prev = () => goTo((slideIdx - 1 + carouselImages.length) % carouselImages.length);
  const next = () => goTo((slideIdx + 1) % carouselImages.length);

  return (
    <section className="relative min-h-[90vh] flex items-center overflow-hidden bg-stone-900">
      {/* Carousel Backgrounds */}
      {carouselImages.map((img, i) => (
        <div
          key={i}
          className="absolute inset-0 transition-opacity duration-1000"
          style={{ opacity: i === slideIdx ? 1 : 0, zIndex: 0 }}
        >
          <img
            src={img}
            alt={`hero-${i}`}
            className="w-full h-full object-cover opacity-80"
          />
        </div>
      ))}
      <div className="absolute inset-0 bg-gradient-to-r from-stone-900/90 via-stone-900/60 to-stone-900/20 z-[1]" />

      {/* Carousel Controls */}
      <div className="absolute inset-y-0 left-0 right-0 z-[3] flex items-center justify-between px-4 sm:px-6 pointer-events-none">
        <button
          onClick={prev}
          className="pointer-events-auto w-5 h-5 sm:w-10 sm:h-10 bg-white/10 hover:bg-white/25 backdrop-blur-sm border border-white/20 rounded-full flex items-center justify-center text-white transition"
          aria-label="Previous slide"
        >
          <ChevronLeft size={18} />
        </button>
        <button
          onClick={next}
          className="pointer-events-auto  w-5 h-5 sm:w-10 sm:h-10 bg-white/10 hover:bg-white/25 backdrop-blur-sm border border-white/20 rounded-full flex items-center justify-center text-white transition"
          aria-label="Next slide"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Slide Dots + Play/Pause */}
      <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-[3] flex items-center gap-3">
        <button
          onClick={() => setIsPlaying(p => !p)}
          className="text-white/60 hover:text-white transition"
          aria-label={isPlaying ? 'Pause slideshow' : 'Play slideshow'}
        >
          {isPlaying ? <Pause size={12} /> : <Play size={12} />}
        </button>
        <div className="flex gap-1.5">
          {carouselImages.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className={clsx(
                'rounded-full transition-all duration-300',
                i === slideIdx
                  ? 'bg-white w-6 h-2'
                  : 'bg-white/40 w-2 h-2 hover:bg-white/70'
              )}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      </div>

      <div className="relative z-[2] max-w-6xl mx-auto px-4 sm:px-6 pt-20 pb-12 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
        {/* Text */}
        <div>
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-1.5 mb-5"
            style={{ animation: 'heroFade 0.7s ease 0.2s both' }}>
            <span className="w-2 h-2 bg-green-400 rounded-full" style={{ animation: 'blink 2s infinite' }} />
            <span className="text-white/90 text-xs font-medium">
              {settings?.status || 'SHOP OPEN'} · {settings?.openTime || '8AM'} – {settings?.closeTime || '8PM'}
            </span>
          </div>
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight mb-4"
            style={{ animation: 'heroFade 0.7s ease 0.35s both' }}>
            The Freshest<br />
            <span className="text-brand-300">Fish, Chicken</span><br />
            &amp; Mutton in Town
          </h1>
          <p className="text-white/70 text-base mb-7 max-w-md leading-relaxed"
            style={{ animation: 'heroFade 0.7s ease 0.5s both' }}>
            Sourced fresh every morning. Order online, pay, and collect from our dedicated
            Dispatch Counter — skip the queue.
          </p>
          <div className="flex flex-wrap gap-3" style={{ animation: 'heroFade 0.7s ease 0.65s both' }}>
            <button
              onClick={() => document.getElementById('shop')?.scrollIntoView({ behavior: 'smooth' })}
              className="bg-brand-500 hover:bg-brand-400 text-white px-6 py-3 rounded-xl text-sm font-bold shadow-brand transition flex items-center gap-2">
              🛒 Order Now <ArrowRight size={15} />
            </button>
            <button
              onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}
              className="bg-white/10 hover:bg-white/20 text-white border border-white/25 px-6 py-3 rounded-xl text-sm font-medium transition backdrop-blur-sm">
              Find Us ↓
            </button>
          </div>
        </div>

        {/* Live price cards */}
        <div className="hidden lg:flex flex-col gap-3 max-w-sm">
          <p className="text-white/50 text-xs font-semibold uppercase tracking-wider mb-1">Today's Prices</p>
          {(products || []).slice(0, 5).map((p, i) => (
            <div key={p.id}
              style={{ animation: `heroFade 0.6s ease ${0.7 + i * 0.1}s both` }}
              className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl px-4 py-3 flex items-center gap-3">
              <span className="text-xl">{p.categoryIcon || '🥩'}</span>
              <span className="text-white text-sm font-medium flex-1">{p.name}</span>
              <span className="text-white font-bold font-mono">₹{p.pricePerKg}/kg</span>
              <span className={clsx('text-[9px] font-bold px-2 py-0.5 rounded-full',
                p.stockStatus === 'IN_STOCK'   ? 'bg-green-400/20 text-green-300' :
                p.stockStatus === 'LOW_STOCK'  ? 'bg-amber-400/20 text-amber-300' :
                'bg-red-400/20 text-red-300')}>
                {p.stockStatus?.replace('_', ' ')}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Scrolling price marquee */}
      <div className="absolute bottom-0 left-0 right-0 bg-brand-500/90 backdrop-blur-sm py-2.5 overflow-hidden whitespace-nowrap z-[2]">
        <div className="inline-flex" style={{ animation: 'marquee 25s linear infinite' }}>
          {[...(products || []), ...(products || [])].map((p, i) => (
            <span key={i} className="inline-flex items-center gap-2 text-white text-sm font-medium px-6">
              {p.categoryIcon} {p.name}
              <span className="opacity-60 text-xs">₹{p.pricePerKg}/kg</span>
              <span className="opacity-30 mx-2">·</span>
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}


// ═══════════════════════════════════════════════════════════════════════════════
// SHOP SECTION
// ═══════════════════════════════════════════════════════════════════════════════
function ShopSection({ products, categories }) {
  const [catFilter, setCatFilter] = useState('all');
  const { addItem, changeQty, setQty, items } = useCartStore();
  const [sectionRef, sectionVisible] = useInView();
  const [editingQty, setEditingQty] = useState({});

  const filtered = (products || []).filter(p =>
    (catFilter === 'all' || p.categoryId === Number(catFilter)) && p.available
  );

  const handleManualQtyBlur = (product) => {
    const raw = editingQty[product.id];
    const parsed = parseFloat(raw);

    if (!isNaN(parsed) && parsed > 0) {
      const final = parseFloat(parsed.toFixed(3));
      setQty(product.id, final);
      toast.success(`Qty set to ${final}kg`, { icon: product.categoryIcon || '🥩' });
    } else {
      toast.error('Enter a valid quantity greater than 0');
      setEditingQty(prev => {
        const n = { ...prev };
        delete n[product.id];
        return n;
      });
      return;
    }
    setEditingQty(prev => {
      const n = { ...prev };
      delete n[product.id];
      return n;
    });
  };

  return (
    <section ref={sectionRef} id="shop" className="py-16 bg-[#faf6f1]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="mb-8" style={reveal(sectionVisible, 0)}>
          <p className="text-xs font-bold text-brand-500 uppercase tracking-widest mb-2">Order Online</p>
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-stone-900 mb-3">
            Fresh items — order &amp; collect at dispatch
          </h2>
          <p className="text-stone-500 text-base max-w-xl">
            Add items to cart, pay online, and collect from our{' '}
            <strong>Dispatch Counter</strong> — no queue, no waiting.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 mb-6" style={reveal(sectionVisible, 80)}>
          {[{ id: 'all', name: 'All Items', icon: '🥩' }, ...(categories || [])].map(c => (
            <button
              key={c.id}
              onClick={() => setCatFilter(String(c.id))}
              className={clsx(
                'flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition',
                String(catFilter) === String(c.id)
                  ? 'bg-brand-500 text-white shadow-brand'
                  : 'bg-white text-stone-600 border border-stone-200 hover:border-brand-300 hover:text-brand-600'
              )}>
              {c.icon} {c.name}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map((product, i) => {
            const cartItem = items[product.id];
            const isOut = product.stockStatus === 'OUT_OF_STOCK';
            const step = product.orderStep || 0.5;
            const isEditing = editingQty[product.id] !== undefined;
            const liveCost = cartItem ? Math.round(product.pricePerKg * cartItem.qty) : null;

            return (
              <div
                key={product.id}
                style={reveal(sectionVisible, 120 + i * 40)}
                className="bg-white rounded-2xl border border-stone-100 shadow-card hover:shadow-card-hover transition-shadow overflow-hidden group">
                <div className="relative overflow-hidden h-36 sm:h-44 bg-brand-50">
                  {product.imageUrl ? (
                    <img src={product.imageUrl} alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-5xl">
                      {product.categoryIcon || '🥩'}
                    </div>
                  )}
                  <span className={clsx(
                    'absolute top-2 right-2 text-[9px] font-bold px-2 py-0.5 rounded-full',
                    isOut ? 'bg-stone-900/70 text-white' :
                    product.stockStatus === 'LOW_STOCK' ? 'bg-amber-400 text-amber-900' :
                    'bg-green-400/90 text-green-900'
                  )}>
                    {isOut ? 'Sold Out' : product.stockStatus === 'LOW_STOCK' ? 'Low Stock' : 'In Stock'}
                  </span>
                </div>

                <div className="p-3">
                  <p className="text-sm font-bold text-stone-800 leading-tight mb-0.5">{product.name}</p>
                  <p className="text-xs text-stone-400 mb-2 line-clamp-1">{product.description}</p>

                  <div className="flex items-baseline justify-between mb-3">
                    <span className="text-base font-bold text-brand-500">
                      ₹{product.pricePerKg}
                      <span className="text-xs text-stone-400 font-normal">/kg</span>
                    </span>
                    {liveCost && (
                      <span className="text-xs font-bold text-green-600">= ₹{liveCost}</span>
                    )}
                  </div>

                  {isOut ? (
                    <button disabled className="w-full bg-stone-100 text-stone-400 rounded-lg py-2 text-xs font-semibold cursor-not-allowed">
                      Out of Stock
                    </button>
                  ) : !cartItem ? (
                    <button
                      onClick={() => { addItem(product); toast.success(`${product.name} added!`, { icon: product.categoryIcon || '🥩' }); }}
                      className="w-full bg-brand-500 hover:bg-brand-600 text-white rounded-lg py-2 text-xs font-bold transition">
                      + Add to Cart
                    </button>
                  ) : (
                    <div className="space-y-1.5">
                      <div className="flex items-center border border-brand-300 rounded-lg overflow-hidden">
                        <button onClick={() => changeQty(product.id, -step)}
                          className="flex-none px-2.5 py-2 text-brand-600 hover:bg-brand-50 active:bg-brand-100 transition">
                          <Minus size={13} />
                        </button>
                        {isEditing ? (
                          <input
                            type="number" min="0.001" step="any"
                            value={editingQty[product.id]}
                            onChange={e => setEditingQty(prev => ({ ...prev, [product.id]: e.target.value }))}
                            onBlur={() => handleManualQtyBlur(product)}
                            onKeyDown={e => {
                              if (e.key === 'Enter') handleManualQtyBlur(product);
                              if (e.key === 'Escape') setEditingQty(prev => { const n = { ...prev }; delete n[product.id]; return n; });
                            }}
                            autoFocus
                            className="flex-1 text-center text-sm font-bold text-brand-700 font-mono bg-brand-50 outline-none border-0 w-0 min-w-0 py-1.5"
                          />
                        ) : (
                          <button
                            onClick={() => setEditingQty(prev => ({ ...prev, [product.id]: String(cartItem.qty) }))}
                            title="Tap to enter custom quantity"
                            className="flex-1 text-center text-sm font-bold text-stone-800 font-mono py-1.5 hover:bg-brand-50 transition cursor-text">
                            {cartItem.qty}kg
                          </button>
                        )}
                        <button onClick={() => changeQty(product.id, step)}
                          className="flex-none px-2.5 py-2 text-brand-600 hover:bg-brand-50 active:bg-brand-100 transition">
                          <Plus size={13} />
                        </button>
                      </div>
                      <div className="flex items-center justify-between px-0.5">
                        <p className="text-[10px] text-stone-400">
                          {isEditing ? '↵ Enter to confirm' : 'Tap qty to type custom'}
                        </p>
                        <p className="text-[10px] font-bold text-brand-400">step: {step}kg</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}


// ═══════════════════════════════════════════════════════════════════════════════
// CART DRAWER
// ═══════════════════════════════════════════════════════════════════════════════
function CartDrawer({ open, onClose, onCheckout }) {
  const { items, changeQty, setQty, removeItem, total, itemCount } = useCartStore();
  const [editingQty, setEditingQty] = useState({});
  const itemsList = Object.values(items);

  const handleManualQtyBlur = (product) => {
    const raw = editingQty[product.id];
    const parsed = parseFloat(raw);
    if (!isNaN(parsed) && parsed > 0) {
      const final = parseFloat(parsed.toFixed(3));
      setQty(product.id, final);
      toast.success(`Qty updated to ${final}kg`, { icon: '✓' });
    } else {
      toast.error('Enter a valid quantity greater than 0');
    }
    setEditingQty(prev => { const n = { ...prev }; delete n[product.id]; return n; });
  };

  return (
    <>
      {open && <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />}
      <div className={clsx(
        'fixed right-0 top-0 h-full w-full sm:w-96 bg-white z-50 shadow-2xl flex flex-col transition-transform duration-300',
        open ? 'translate-x-0' : 'translate-x-full'
      )}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-200">
          <div className="flex items-center gap-2">
            <ShoppingCart size={18} className="text-brand-500" />
            <h3 className="font-bold text-stone-800">Your Cart</h3>
            {itemCount() > 0 && (
              <span className="text-xs bg-brand-100 text-brand-600 font-bold rounded-full px-2 py-0.5">
                {itemCount()} items
              </span>
            )}
          </div>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-700"><X size={20} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {itemsList.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-stone-400 text-center">
              <ShoppingCart size={48} className="mb-3 opacity-30" />
              <p className="font-medium">Your cart is empty</p>
              <p className="text-sm mt-1">Add items from the shop</p>
              <button onClick={onClose} className="mt-4 text-brand-500 text-sm font-semibold hover:underline">
                Browse products →
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {itemsList.map(({ product, qty }) => {
                const step = product.orderStep || 0.5;
                const isEditing = editingQty[product.id] !== undefined;
                const liveCost = (product.pricePerKg * qty).toFixed(0);
                return (
                  <div key={product.id} className="flex items-center gap-3 p-3 rounded-xl bg-stone-50 border border-stone-100">
                    {product.imageUrl ? (
                      <img src={product.imageUrl} alt={product.name} className="w-14 h-14 rounded-lg object-cover flex-shrink-0" />
                    ) : (
                      <div className="w-14 h-14 rounded-lg bg-brand-50 flex items-center justify-center text-2xl flex-shrink-0">
                        {product.categoryIcon || '🥩'}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-stone-800 truncate">{product.name}</p>
                      <p className="text-xs text-stone-400 mb-1.5">₹{product.pricePerKg}/kg</p>
                      <div className="flex items-center gap-1">
                        <button onClick={() => changeQty(product.id, -step)}
                          className="w-7 h-7 border border-stone-200 rounded-lg flex items-center justify-center hover:bg-red-50 hover:border-red-200 hover:text-red-500 transition">
                          <Minus size={11} />
                        </button>
                        {isEditing ? (
                          <input
                            type="number" min="0.001" step="any"
                            value={editingQty[product.id]}
                            onChange={e => setEditingQty(prev => ({ ...prev, [product.id]: e.target.value }))}
                            onBlur={() => handleManualQtyBlur(product)}
                            onKeyDown={e => {
                              if (e.key === 'Enter') handleManualQtyBlur(product);
                              if (e.key === 'Escape') setEditingQty(prev => { const n = { ...prev }; delete n[product.id]; return n; });
                            }}
                            autoFocus
                            className="w-20 text-center text-xs font-bold font-mono border border-brand-400 rounded-lg bg-brand-50 text-brand-700 outline-none px-1 py-1"
                          />
                        ) : (
                          <button
                            onClick={() => setEditingQty(prev => ({ ...prev, [product.id]: String(qty) }))}
                            title="Tap to enter custom quantity"
                            className="w-20 text-center text-xs font-bold font-mono border border-stone-200 rounded-lg bg-white hover:border-brand-400 hover:bg-brand-50 hover:text-brand-700 transition py-1 cursor-text">
                            {qty}kg
                          </button>
                        )}
                        <button onClick={() => changeQty(product.id, step)}
                          className="w-7 h-7 border border-stone-200 rounded-lg flex items-center justify-center hover:bg-green-50 hover:border-green-200 hover:text-green-600 transition">
                          <Plus size={11} />
                        </button>
                      </div>
                      <p className="text-[10px] text-stone-400 mt-1">
                        {isEditing ? '↵ Enter to confirm · Esc to cancel' : 'Tap qty to type custom amount'}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0 flex flex-col items-end gap-1">
                      <p className="text-sm font-bold text-stone-800">₹{liveCost}</p>
                      <p className="text-[10px] text-stone-400">{qty}kg</p>
                      <button onClick={() => removeItem(product.id)} className="text-stone-300 hover:text-red-400 transition mt-0.5">
                        <X size={13} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {itemsList.length > 0 && (
          <div className="border-t border-stone-200 p-4 space-y-3">
            <div className="space-y-1 pb-2 border-b border-stone-100">
              {itemsList.map(({ product, qty }) => (
                <div key={product.id} className="flex justify-between text-xs text-stone-500">
                  <span>{product.name} × {qty}kg</span>
                  <span>₹{(product.pricePerKg * qty).toFixed(0)}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-between text-sm text-stone-600">
              <span>Subtotal</span><span>₹{total().toFixed(0)}</span>
            </div>
            <div className="flex justify-between font-bold text-base">
              <span>Total</span>
              <span className="text-brand-500">₹{total().toFixed(0)}</span>
            </div>
            <button onClick={onCheckout}
              className="w-full bg-brand-500 hover:bg-brand-600 text-white rounded-xl py-3 font-bold text-sm shadow-brand transition flex items-center justify-center gap-2">
              Proceed to Checkout <ArrowRight size={15} />
            </button>
          </div>
        )}
      </div>
    </>
  );
}


// ═══════════════════════════════════════════════════════════════════════════════
// GALLERY SECTION — Admin-managed images & videos, shown before Reviews
// ═══════════════════════════════════════════════════════════════════════════════
function GallerySection({ settings }) {
  const [sectionRef, visible] = useInView();
  const [lightbox, setLightbox] = useState(null); // { type: 'image'|'video', src, index }
  const videoRefs = useRef({});

  // Admin-managed gallery items from settings, fallback to defaults
  const galleryItems = settings?.galleryItems?.length
    ? settings.galleryItems
    : [
        { type: 'image', src: 'https://images.unsplash.com/photo-1567343483945-05af09de2e29?w=600&q=80', caption: 'Fresh Fish Daily' },
        { type: 'image', src: 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=600&q=80', caption: 'Premium Chicken' },
        { type: 'image', src: 'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=600&q=80', caption: 'Quality Mutton' },
        { type: 'image', src: 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=600&q=80', caption: 'Our Shop' },
        { type: 'image', src: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&q=80', caption: 'Fresh Catch' },
        { type: 'image', src: 'https://images.unsplash.com/photo-1615141982883-c7ad0e69fd62?w=600&q=80', caption: 'Daily Arrivals' },
      ];

  const handleLightboxNav = (dir) => {
    if (lightbox === null) return;
    const newIdx = (lightbox.index + dir + galleryItems.length) % galleryItems.length;
    const item = galleryItems[newIdx];
    setLightbox({ ...item, index: newIdx });
  };

  useEffect(() => {
    const handleKey = (e) => {
      if (lightbox === null) return;
      if (e.key === 'Escape') setLightbox(null);
      if (e.key === 'ArrowRight') handleLightboxNav(1);
      if (e.key === 'ArrowLeft') handleLightboxNav(-1);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [lightbox]);

  // Mosaic grid layout
  const gridClasses = [
    'col-span-2 row-span-2',
    'col-span-1 row-span-1',
    'col-span-1 row-span-1',
    'col-span-1 row-span-1',
    'col-span-1 row-span-1',
    'col-span-2 row-span-1',
  ];

  return (
    <section ref={sectionRef} id="gallery" className="py-16 bg-stone-900 overflow-hidden">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="mb-10 flex flex-col sm:flex-row sm:items-end justify-between gap-4" style={reveal(visible, 0)}>
          <div>
            <p className="text-xs font-bold text-brand-400 uppercase tracking-widest mb-2">Our Story</p>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-white">
              Fresh from the Source
            </h2>
            <p className="text-stone-400 text-sm mt-2 max-w-md">
              A glimpse inside our shop — the freshness, the quality, and the care that goes into every order.
            </p>
          </div>
          {/* <div className="flex items-center gap-2 text-xs text-stone-500 bg-stone-800 border border-stone-700 rounded-full px-4 py-2">
            <span className="w-2 h-2 bg-brand-500 rounded-full" />
            {galleryItems.length} photos &amp; videos
          </div> */}
        </div>

        {/* Mosaic Grid */}
        <div
          className="grid gap-2"
          style={{
            gridTemplateColumns: 'repeat(4, 1fr)',
            gridAutoRows: '160px',
            ...reveal(visible, 80),
          }}
        >
          {galleryItems.slice(0, 6).map((item, i) => (
            <div
              key={i}
              className={clsx(
                'relative overflow-hidden rounded-xl cursor-pointer group',
                gridClasses[i] || 'col-span-1 row-span-1'
              )}
              onClick={() => setLightbox({ ...item, index: i })}
              style={reveal(visible, 100 + i * 60)}
            >
              {item.type === 'video' ? (
                <>
                  <video
                    ref={el => videoRefs.current[i] = el}
                    src={item.src}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    muted
                    loop
                    playsInline
                    onMouseEnter={e => e.target.play()}
                    onMouseLeave={e => { e.target.pause(); e.target.currentTime = 0; }}
                  />
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-12 h-12 bg-white/20 backdrop-blur-sm border border-white/30 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Play size={18} className="text-white ml-0.5" />
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <img
                    src={item.src}
                    alt={item.caption || `Gallery ${i + 1}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </>
              )}

              {/* Caption overlay on hover */}
              {item.caption && (
                <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                  <p className="text-white text-xs font-semibold">{item.caption}</p>
                </div>
              )}

              {/* Type badge */}
              {item.type === 'video' && (
                <div className="absolute top-2 right-2 bg-brand-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                  VIDEO
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Show more items as a horizontal strip if more than 6 */}
        {galleryItems.length > 6 && (
          <div className="flex gap-2 mt-2 overflow-x-auto pb-1" style={reveal(visible, 500)}>
            {galleryItems.slice(6).map((item, i) => (
              <div
                key={i + 6}
                className="flex-none w-24 h-24 rounded-xl overflow-hidden cursor-pointer group relative"
                onClick={() => setLightbox({ ...item, index: i + 6 })}
              >
                {item.type === 'video' ? (
                  <video src={item.src} className="w-full h-full object-cover" muted />
                ) : (
                  <img src={item.src} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                )}
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors rounded-xl" />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 bg-black/90 z-[80] flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <button
            onClick={(e) => { e.stopPropagation(); handleLightboxNav(-1); }}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 hover:bg-white/25 backdrop-blur-sm border border-white/20 rounded-full flex items-center justify-center text-white transition z-10"
          >
            <ChevronLeft size={22} />
          </button>

          <div
            className="relative max-w-4xl max-h-[85vh] w-full flex items-center justify-center"
            onClick={e => e.stopPropagation()}
            style={{ animation: 'modalFade 0.2s ease both' }}
          >
            {lightbox.type === 'video' ? (
              <video
                src={lightbox.src}
                controls
                autoPlay
                className="max-w-full max-h-[80vh] rounded-xl"
              />
            ) : (
              <img
                src={lightbox.src}
                alt={lightbox.caption}
                className="max-w-full max-h-[80vh] rounded-xl object-contain"
              />
            )}
            {lightbox.caption && (
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent rounded-b-xl px-5 py-4">
                <p className="text-white font-semibold text-sm">{lightbox.caption}</p>
                <p className="text-white/50 text-xs">{lightbox.index + 1} / {galleryItems.length}</p>
              </div>
            )}
          </div>

          <button
            onClick={(e) => { e.stopPropagation(); handleLightboxNav(1); }}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 hover:bg-white/25 backdrop-blur-sm border border-white/20 rounded-full flex items-center justify-center text-white transition z-10"
          >
            <ChevronRight size={22} />
          </button>

          <button
            onClick={() => setLightbox(null)}
            className="absolute top-4 right-4 w-10 h-10 bg-white/10 hover:bg-white/25 rounded-full flex items-center justify-center text-white transition"
          >
            <X size={18} />
          </button>
        </div>
      )}
    </section>
  );
}


// ═══════════════════════════════════════════════════════════════════════════════
// REVIEWS SECTION
// ═══════════════════════════════════════════════════════════════════════════════
function ReviewsSection({ reviews, onRate }) {
  const [sectionRef, visible] = useInView();
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (!reviews?.length) return;
    const t = setInterval(() => setIdx(i => (i + 1) % reviews.length), 4000);
    return () => clearInterval(t);
  }, [reviews?.length]);

  const avg = reviews?.length
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : '—';

  return (
    <section ref={sectionRef} id="reviews" className="py-16 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10" style={reveal(visible, 0)}>
          <div>
            <p className="text-xs font-bold text-brand-500 uppercase tracking-widest mb-2">Happy Customers</p>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-stone-900">What our regulars say</h2>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-center">
              <p className="text-4xl font-display font-bold text-stone-900">{avg}</p>
              <p className="text-brand-400 text-lg">
                {'★'.repeat(Math.round(Number(avg) || 0))}{'☆'.repeat(5 - Math.round(Number(avg) || 0))}
              </p>
              <p className="text-xs text-stone-400">{reviews?.length || 0} reviews</p>
            </div>
            <button onClick={onRate}
              className="bg-brand-500 hover:bg-brand-600 text-white px-4 py-2.5 rounded-xl text-sm font-bold shadow-brand transition flex items-center gap-1.5">
              <Star size={14} /> Rate Us
            </button>
          </div>
        </div>

        <div className="relative overflow-hidden" style={reveal(visible, 120)}>
          <div className="flex gap-4 transition-transform duration-500"
            style={{ transform: `translateX(-${idx * (100 / 3)}%)` }}>
            {[...(reviews || []), ...(reviews || [])].map((r, i) => (
              <div key={i}
                className="flex-none w-full sm:w-[calc(50%-8px)] lg:w-[calc(33.33%-12px)] bg-[#faf6f1] rounded-2xl p-5 border border-stone-100">
                <div className="text-brand-400 text-lg mb-3">
                  {'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}
                </div>
                <p className="text-stone-600 text-sm leading-relaxed italic mb-4">
                  "{r.comment || 'Great experience!'}"
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-brand-100 flex items-center justify-center text-brand-600 text-sm font-bold">
                    {(r.name || 'C')[0]}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-stone-800">{r.name || 'Customer'}</p>
                    <div className="flex flex-wrap gap-1 mt-0.5">
                      {(r.tags || []).slice(0, 2).map((t, ti) => (
                        <span key={ti} className="text-[10px] bg-brand-50 text-brand-600 px-1.5 py-0.5 rounded-full">{t}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-center gap-1.5 mt-5">
          {(reviews || []).map((_, i) => (
            <button key={i} onClick={() => setIdx(i)}
              className={clsx('w-2 h-2 rounded-full transition',
                i === idx % Math.max(1, reviews?.length || 1) ? 'bg-brand-500' : 'bg-stone-200')} />
          ))}
        </div>
      </div>
    </section>
  );
}


// ═══════════════════════════════════════════════════════════════════════════════
// CONTACT + MAP
// ═══════════════════════════════════════════════════════════════════════════════
function ContactSection({ settings }) {
  const [sectionRef, visible] = useInView();

  const info = [
    { icon: MapPin, label: 'Address', color: 'brand', value: settings?.address || 'Fish Market Road, Hyderabad' },
    { icon: Phone, label: 'Phone', color: 'green', value: settings?.phone || '9121200123', href: `tel:+91${(settings?.phone || '9121200123').replace(/\s/g, '')}` },
    { icon: Mail, label: 'Email', color: 'blue', value: settings?.email || 'smartmeatshop@gmail.com', href: `mailto:${settings?.email || 'smartmeatshop@gmail.com'}` },
    { icon: Clock, label: 'Hours', color: 'amber', value: `Mon–Sat ${settings?.openTime || '7AM'}–${settings?.closeTime || '8PM'} · Sun till ${settings?.sundayClose || '2PM'}` },
  ];

  const colorMap = {
    brand: { bg: 'bg-brand-50', text: 'text-brand-600' },
    green: { bg: 'bg-green-light', text: 'text-green-shop' },
    blue:  { bg: 'bg-blue-50', text: 'text-blue-600' },
    amber: { bg: 'bg-amber-light', text: 'text-amber-shop' },
  };

  const lat = settings?.latitude  || 17.393227400000004;
  const lng = settings?.longitude || 78.53258851083984;
  const mapSrc = `https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d30459.09239759158!2d${lng}!3d${lat}!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bcb9f3ffd67281d%3A0xed87de4bbebe105e!2sRS%20ROYAL%20MEAT%20MART!5e0!3m2!1sen!2sin!4v1774320086093!5m2!1sen!2sin`;

  return (
    <section ref={sectionRef} id="contact" className="py-16 bg-[#faf6f1]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div style={reveal(visible, 0)}>
          <p className="text-xs font-bold text-brand-500 uppercase tracking-widest mb-2">Find Us</p>
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-stone-900 mb-10">Visit Our Shop</h2>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          <div className="space-y-3">
            {info.map(({ icon: Icon, label, value, href, color }, i) => {
              const c = colorMap[color];
              const Tag = href ? 'a' : 'div';
              return (
                <Tag key={label} href={href}
                  style={reveal(visible, 80 + i * 70)}
                  className="flex items-start gap-4 bg-white rounded-xl p-4 border border-stone-100 shadow-card hover:shadow-card-hover transition-shadow block">
                  <div className={clsx('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0', c.bg)}>
                    <Icon size={18} className={c.text} />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-stone-400 mb-0.5">{label}</p>
                    <p className={clsx('text-sm font-medium', href ? c.text : 'text-stone-700')}>{value}</p>
                  </div>
                </Tag>
              );
            })}
          </div>
          <div style={reveal(visible, 160)} className="rounded-2xl overflow-hidden border border-stone-200 shadow-card">
            <iframe src={mapSrc} width="100%" height="300" style={{ border: 0, display: 'block' }}
              allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
            <div className="bg-white px-4 py-3 flex items-center justify-between">
              <span className="text-xs text-stone-400">
                {settings?.address?.split(',')[0] || 'RS Royal Meat Mart'}, Bagayath, Uppal, Hyderabad
              </span>
              <a href={`https://maps.google.com?q=${encodeURIComponent(settings?.address || 'RS ROYAL MEAT MART , BAGAYATH, Uppal, Hyderabad')}`}
                target="_blank" rel="noreferrer" className="text-xs font-semibold text-brand-500 hover:text-brand-700">
                Get Directions →
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}


// ═══════════════════════════════════════════════════════════════════════════════
// CHECKOUT MODAL (3 steps)
// ═══════════════════════════════════════════════════════════════════════════════
function CheckoutModal({ open, onClose, onSuccess }) {
  const [step, setStep]       = useState(1);
  const [placing, setPlacing] = useState(false);
  const [form, setForm]       = useState({ name: '', mobile: '', email: '', notes: '' });
  const [errors, setErrors]   = useState({});
  const { itemsList, total, clearCart } = useCartStore();
  const { user } = useAuthStore();
  const { pay } = useRazorpay();

  useEffect(() => {
    if (user) setForm(f => ({ ...f, name: user.name || '', mobile: user.mobile || '' }));
  }, [user]);

  useEffect(() => {
    if (open) { setStep(1); setErrors({}); }
  }, [open]);

  if (!open) return null;

  const validate = () => {
    const e = {};
    if (!form.name.trim())                    e.name   = 'Name is required';
    if (!/^\d{10}$/.test(form.mobile.trim())) e.mobile = 'Enter valid 10-digit mobile';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleNext = () => {
    if (step === 1 && !validate()) return;
    setStep(s => s + 1);
  };

  const handlePlace = async () => {
    setPlacing(true);
    onClose();

    await pay({
      cartItems: itemsList(),
      customerDetails: form,
      onSuccess: (result) => {
        clearCart();
        const orderData = {
          orderNumber:    result.orderNumber,
          total:          result.total,
          customerName:   form.name,
          customerMobile: form.mobile,
          paymentMethod:  'UPI',
          items: itemsList().map(({ product, qty }) => ({
            productName: product.name,
            qty,
            total:      product.pricePerKg * qty,
            unitPrice:  product.pricePerKg,
          })),
        };
        onSuccess(orderData);
        // ── AUTO-PRINT: fire after a short delay so the receipt modal renders first
        setTimeout(() => {
          if (window.matchMedia('print').media !== 'not all' || navigator.userAgent) {
            printThermalReceipt(orderData, { autoPrint: true });
          }
        }, 800);
      },
    });

    setPlacing(false);
  };

  const STEPS = ['Your Details', 'Review Order', 'Pay'];

  return (
    <div className="fixed inset-0 bg-black/55 z-[60] flex items-start justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-md my-8 shadow-2xl overflow-hidden"
        style={{ animation: 'modalFade 0.3s ease both' }}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-200 bg-stone-50">
          <h3 className="text-base font-bold text-stone-800">Checkout</h3>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-700"><X size={20} /></button>
        </div>

        <div className="flex px-5 py-3 border-b border-stone-100">
          {STEPS.map((label, i) => {
            const n = i + 1;
            const done   = step > n;
            const active = step === n;
            return (
              <div key={n} className="flex-1 flex flex-col items-center relative">
                {i < STEPS.length - 1 && (
                  <div className={clsx('absolute top-3.5 left-1/2 right-0 h-0.5 -translate-y-1/2', done ? 'bg-brand-500' : 'bg-stone-200')} />
                )}
                <div className={clsx('w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold z-10 border-2 transition-all',
                  done ? 'bg-brand-500 border-brand-500 text-white' :
                  active ? 'bg-white border-brand-500 text-brand-500' :
                  'bg-white border-stone-200 text-stone-400')}>
                  {done ? '✓' : n}
                </div>
                <p className={clsx('text-[10px] mt-1 font-medium', active ? 'text-brand-500' : 'text-stone-400')}>
                  {label}
                </p>
              </div>
            );
          })}
        </div>

        <div className="p-5">
          {step === 1 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-semibold text-stone-500 mb-1.5">Full Name *</label>
                  <input value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="Your name"
                    className={clsx('w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-100 transition',
                      errors.name ? 'border-red-400' : 'border-stone-200 focus:border-brand-400')} />
                  {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-semibold text-stone-500 mb-1.5">Mobile *</label>
                  <input value={form.mobile}
                    onChange={e => setForm(f => ({ ...f, mobile: e.target.value.replace(/\D/,'').slice(0,10) }))}
                    placeholder="10-digit mobile" type="tel" maxLength={10}
                    className={clsx('w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-100 transition',
                      errors.mobile ? 'border-red-400' : 'border-stone-200 focus:border-brand-400')} />
                  {errors.mobile && <p className="text-xs text-red-500 mt-1">{errors.mobile}</p>}
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-stone-500 mb-1.5">Email (optional)</label>
                  <input value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    placeholder="For receipt via email" type="email"
                    className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 transition" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-stone-500 mb-1.5">Special Instructions (optional)</label>
                  <textarea value={form.notes}
                    onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                    placeholder="e.g. Clean and cut the fish" rows={2}
                    className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 transition resize-none" />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="bg-stone-50 rounded-xl p-3">
                <p className="font-semibold text-stone-800 text-sm">{form.name}</p>
                <p className="text-stone-500 text-xs">{form.mobile}{form.email ? ` · ${form.email}` : ''}</p>
                {form.notes && <p className="text-stone-400 text-xs mt-1">📝 {form.notes}</p>}
              </div>
              <div className="space-y-2">
                <p className="text-xs font-bold text-stone-500 uppercase tracking-wide">Your Items</p>
                {itemsList().map(({ product, qty }) => (
                  <div key={product.id} className="flex items-center justify-between py-2 border-b border-stone-100 last:border-0">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{product.categoryIcon || '🥩'}</span>
                      <div>
                        <p className="text-sm font-medium text-stone-800">{product.name}</p>
                        <p className="text-xs text-stone-400">{qty}kg × ₹{product.pricePerKg}/kg</p>
                      </div>
                    </div>
                    <p className="text-sm font-bold text-stone-800">₹{(product.pricePerKg * qty).toFixed(0)}</p>
                  </div>
                ))}
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-stone-200">
                <span className="font-bold text-stone-800">Total</span>
                <span className="text-xl font-bold text-brand-500">₹{total().toFixed(0)}</span>
              </div>
              <div className="bg-green-light border border-green-200 rounded-xl p-3 flex gap-2.5">
                <span className="text-lg flex-shrink-0">🏪</span>
                <div>
                  <p className="text-xs font-bold text-green-shop">Collect at Dispatch Counter</p>
                  <p className="text-xs text-stone-500 mt-0.5">Ready in 20–30 min. Skip the queue!</p>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="bg-brand-50 border border-brand-200 rounded-2xl p-5 text-center">
                <p className="text-xs font-semibold text-brand-400 uppercase tracking-widest mb-1">Amount to Pay</p>
                <p className="text-4xl font-bold text-brand-600 font-mono">₹{total().toFixed(0)}</p>
                <p className="text-xs text-stone-400 mt-1">
                  {itemsList().length} item{itemsList().length > 1 ? 's' : ''} · Verified at checkout
                </p>
              </div>
              <div className="flex items-center gap-3 bg-white border-2 border-brand-400 rounded-xl px-4 py-3">
                <span className="text-2xl">📱</span>
                <div className="flex-1">
                  <p className="text-sm font-bold text-brand-600">Pay via UPI</p>
                  <p className="text-xs text-stone-400">GPay · PhonePe · Paytm · Any UPI app</p>
                </div>
                <div className="w-5 h-5 rounded-full bg-brand-500 border-2 border-brand-500 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-white" />
                </div>
              </div>
              <div className="flex items-center justify-center gap-2 text-xs text-stone-400">
                <span>🔒</span>
                <span>Secured by Razorpay · 100% safe checkout</span>
              </div>
              <div className="bg-stone-50 rounded-xl p-3 space-y-1">
                <p className="text-xs font-bold text-stone-400 uppercase mb-2">Order Summary</p>
                {itemsList().map(({ product, qty }) => (
                  <div key={product.id} className="flex justify-between text-xs text-stone-600">
                    <span>{product.name} × {qty}kg</span>
                    <span className="font-semibold">₹{(product.pricePerKg * qty).toFixed(0)}</span>
                  </div>
                ))}
                <div className="flex justify-between text-xs font-bold text-stone-800 pt-2 border-t border-stone-200 mt-2">
                  <span>Total</span>
                  <span className="text-brand-500">₹{total().toFixed(0)}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-3 px-5 pb-5">
          {step > 1 && (
            <button onClick={() => setStep(s => s - 1)}
              className="flex-1 border border-stone-200 rounded-xl py-2.5 text-sm font-medium text-stone-600 hover:bg-stone-50 transition">
              ← Back
            </button>
          )}
          {step < 3 ? (
            <button onClick={handleNext}
              className="flex-1 bg-brand-500 hover:bg-brand-600 text-white rounded-xl py-2.5 text-sm font-bold transition flex items-center justify-center gap-2 shadow-brand">
              Continue →
            </button>
          ) : (
            <button onClick={handlePlace} disabled={placing}
              className="flex-1 bg-brand-500 hover:bg-brand-600 text-white rounded-xl py-2.5 text-sm font-bold transition flex items-center justify-center gap-2 shadow-brand disabled:opacity-60">
              {placing
                ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Opening Razorpay…</>
                : <>📱 Pay ₹{total().toFixed(0)} Now</>}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}


// ═══════════════════════════════════════════════════════════════════════════════
// RECEIPT MODAL
// ═══════════════════════════════════════════════════════════════════════════════
function ReceiptModal({ order, open, onClose, onRate, settings }) {
  if (!open || !order) return null;
  return (
    <div className="fixed inset-0 bg-black/60 z-[70] flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-sm my-8 shadow-2xl overflow-hidden"
        style={{ animation: 'modalFade 0.3s ease both' }}>
        <div className="bg-gradient-to-br from-brand-500 to-brand-400 px-6 pt-8 pb-6 text-white text-center">
          <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3 text-2xl">✓</div>
          <h2 className="font-display text-2xl font-bold mb-1">Order Confirmed!</h2>
          <p className="text-sm opacity-80">{settings?.shopName}</p>
          <div className="mt-3 bg-white/20 rounded-xl px-4 py-2 inline-block font-mono font-bold tracking-wide">
            {order.orderNumber}
          </div>
        </div>
        <div className="p-5">
          <div className="bg-green-light border border-green-200 rounded-xl p-3 flex gap-2.5 mb-4">
            <span className="text-xl flex-shrink-0">🏪</span>
            <div>
              <p className="text-xs font-bold text-green-shop">Collect at Dispatch Counter</p>
              <p className="text-xs text-stone-500 mt-0.5">Show this screen. Ready in 20–30 min.</p>
            </div>
          </div>
          <div className="space-y-1.5 mb-4">
            {(order.items || []).map((item, i) => (
              <div key={i} className="flex justify-between text-sm">
                <span className="text-stone-600">{item.productName} × {item.qty}kg</span>
                <span className="font-semibold text-stone-800">₹{Number(item.total).toLocaleString('en-IN')}</span>
              </div>
            ))}
          </div>
          <div className="flex justify-between items-center border-t border-stone-200 pt-3 mb-4">
            <span className="font-bold text-stone-800">Total Paid</span>
            <span className="text-xl font-bold text-brand-500">₹{Number(order.total).toLocaleString('en-IN')}</span>
          </div>
          <div className="text-xs text-stone-400 flex justify-between mb-5">
            <span>{order.customerName} · {order.customerMobile}</span>
            <span>{order.paymentMethod}</span>
          </div>
          <div className="flex gap-3">
            <button onClick={() => printThermalReceipt(order)}
              className="flex-1 border border-stone-200 rounded-xl py-2.5 text-sm font-medium text-stone-600 hover:bg-stone-50 transition">
              🖨 Print
            </button>
            <button onClick={() => { onClose(); setTimeout(onRate, 400); }}
              className="flex-1 bg-brand-500 hover:bg-brand-600 text-white rounded-xl py-2.5 text-sm font-bold transition">
              Done ✓
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


// ═══════════════════════════════════════════════════════════════════════════════
// RATING MODAL
// ═══════════════════════════════════════════════════════════════════════════════
function RatingModal({ open, onClose }) {
  const [rating,    setRating]    = useState(0);
  const [hovered,   setHovered]   = useState(0);
  const [tags,      setTags]      = useState([]);
  const [name,      setName]      = useState('');
  const [comment,   setComment]   = useState('');
  const [submitted, setSubmitted] = useState(false);
  const { user } = useAuthStore();

  useEffect(() => {
    if (open) {
      setRating(0); setHovered(0); setTags([]);
      setName(user?.name || ''); setComment(''); setSubmitted(false);
    }
  }, [open, user]);

  if (!open) return null;

  const HIGH = ['Fresh quality','Great prices','Fast service','Friendly staff','Easy ordering','Clean shop'];
  const LOW  = ['Freshness','Waiting time','Staff attitude','Cleanliness','Packaging','Price value'];
  const opts = rating >= 4 ? HIGH : LOW;
  const labels = ['','Terrible','Poor','Average','Good','Excellent! 😊'];

  const toggleTag = (t) => setTags(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);

  const submit = async () => {
    if (!rating) { toast.error('Please select a rating'); return; }
    try {
      await reviewsApi.submit({ rating, comment, name, tags });
      setSubmitted(true);
    } catch {
      toast.error('Could not submit review. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/55 z-[70] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden"
        style={{ animation: 'modalFade 0.3s ease both' }}>
        <div className="bg-gradient-to-br from-brand-500 to-brand-400 px-6 py-5 text-white text-center">
          <div className="text-3xl mb-1">⭐</div>
          <h3 className="font-display text-xl font-bold">Rate Your Experience</h3>
          <p className="text-sm opacity-80 mt-1">Your feedback helps us serve you better</p>
        </div>
        <div className="p-5">
          {submitted ? (
            <div className="text-center py-6">
              <div className="text-5xl mb-3">🎉</div>
              <h4 className="text-lg font-bold text-stone-800 mb-2">Thank you!</h4>
              <p className="text-sm text-stone-500 mb-5">Your review has been submitted.</p>
              <button onClick={onClose} className="bg-brand-500 hover:bg-brand-600 text-white px-6 py-2.5 rounded-xl text-sm font-bold transition">
                Close
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-center">
                <p className="text-xs font-semibold text-stone-500 mb-3 uppercase tracking-wide">How was your experience?</p>
                <div className="flex justify-center gap-2 mb-2">
                  {[1,2,3,4,5].map(n => (
                    <button key={n}
                      onMouseEnter={() => setHovered(n)}
                      onMouseLeave={() => setHovered(0)}
                      onClick={() => setRating(n)}
                      className="text-4xl transition-transform hover:scale-110 active:scale-95"
                      style={{ filter: (hovered || rating) >= n ? 'none' : 'grayscale(1)', color: '#f59e0b' }}>
                      ★
                    </button>
                  ))}
                </div>
                {(hovered || rating) > 0 && (
                  <p className="text-sm font-semibold text-brand-500">{labels[hovered || rating]}</p>
                )}
              </div>
              {rating > 0 && (
                <>
                  <div>
                    <p className="text-xs font-semibold text-stone-500 mb-2 uppercase tracking-wide">
                      {rating >= 4 ? 'What did you love?' : 'What could we improve?'}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {opts.map(t => (
                        <button key={t} onClick={() => toggleTag(t)}
                          className={clsx('px-3 py-1.5 rounded-full text-xs font-semibold border transition',
                            tags.includes(t) ? 'bg-brand-500 text-white border-brand-500' : 'bg-white text-stone-600 border-stone-200 hover:border-brand-300')}>
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-stone-500 mb-1.5">Your Name</label>
                    <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Ravi Kumar"
                      className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 transition" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-stone-500 mb-1.5">Tell us more (optional)</label>
                    <textarea value={comment} onChange={e => setComment(e.target.value)}
                      placeholder="Share your experience…" rows={3}
                      className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 transition resize-none" />
                  </div>
                </>
              )}
              <div className="flex gap-3 pt-1">
                <button onClick={onClose} className="flex-1 border border-stone-200 rounded-xl py-2.5 text-sm font-medium text-stone-500 hover:bg-stone-50 transition">
                  Skip
                </button>
                <button onClick={submit} disabled={!rating}
                  className="flex-1 bg-brand-500 hover:bg-brand-600 text-white rounded-xl py-2.5 text-sm font-bold transition disabled:opacity-50">
                  Submit Review
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


// ═══════════════════════════════════════════════════════════════════════════════
// PRINT RECEIPT — FIXED column layout + auto-print support
// ═══════════════════════════════════════════════════════════════════════════════
function printThermalReceipt(order, { autoPrint = false } = {}) {
  const win = window.open('', '_blank', 'width=340,height=650');
  if (!win) {
    // Popup blocked — notify user
    toast?.error?.('Popup blocked. Please allow popups to print receipt.');
    return;
  }

  const dateStr = new Date().toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

  // Build items rows with proper fixed-width columns
  const itemRows = (order.items || []).map(item => {
    const name     = String(item.productName || '').slice(0, 18).padEnd(18, ' ');
    const qty      = String(item.qty + 'kg').padStart(5, ' ');
    const rate     = String('₹' + (item.unitPrice || '')).padStart(7, ' ');
    const amt      = String('₹' + Math.round(item.total)).padStart(7, ' ');
    return `
      <tr>
        <td class="item-name">${item.productName || ''}</td>
        <td class="item-qty">${item.qty}kg</td>
        <td class="item-rate">₹${item.unitPrice || ''}/kg</td>
        <td class="item-amt">₹${Math.round(item.total)}</td>
      </tr>`;
  }).join('');

  const subtotal = (order.items || []).reduce((s, i) => s + Number(i.total), 0);

  win.document.write(`<!DOCTYPE html>
<html>
<head>
  <title>Receipt - ${order.orderNumber}</title>
  <meta charset="utf-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Courier New', Courier, monospace;
      font-size: 12px;
      width: 80mm;
      max-width: 80mm;
      color: #000;
      padding: 4mm 3mm;
      background: #fff;
    }
    .center { text-align: center; }
    .right  { text-align: right; }
    .bold   { font-weight: bold; }
    .large  { font-size: 15px; }
    .small  { font-size: 10px; }
    .mt4    { margin-top: 4px; }
    .mb4    { margin-bottom: 4px; }
    hr { border: none; border-top: 1px dashed #000; margin: 5px 0; }
    hr.solid { border-top: 1px solid #000; }

    /* ── Items Table ── */
    table.items {
      width: 100%;
      border-collapse: collapse;
      margin: 4px 0;
    }
    table.items th {
      font-size: 10px;
      font-weight: bold;
      text-transform: uppercase;
      border-top: 1px dashed #000;
      border-bottom: 1px dashed #000;
      padding: 3px 1px;
    }
    table.items td {
      padding: 3px 1px;
      vertical-align: top;
    }
    table.items .col-item { text-align: left; width: 42%; }
    table.items .col-qty  { text-align: center; width: 13%; }
    table.items .col-rate { text-align: center; width: 23%; }
    table.items .col-amt  { text-align: right; width: 22%; font-weight: bold; }

    /* Item name wraps, others don't */
    .item-name { text-align: left; word-break: break-word; }
    .item-qty  { text-align: center; white-space: nowrap; }
    .item-rate { text-align: center; white-space: nowrap; font-size: 10px; color: #444; }
    .item-amt  { text-align: right; white-space: nowrap; font-weight: bold; }

    /* ── Totals ── */
    .totals-row {
      display: flex;
      justify-content: space-between;
      padding: 2px 0;
      font-size: 11px;
    }
    .totals-row.grand {
      font-size: 14px;
      font-weight: bold;
      padding: 4px 0 2px;
    }

    /* ── Footer ── */
    .tag {
      display: inline-block;
      border: 1px solid #000;
      padding: 1px 8px;
      font-size: 10px;
      font-weight: bold;
      letter-spacing: 1px;
      margin: 3px 0;
    }

    @media print {
      @page { size: 80mm auto; margin: 0; }
      body { padding: 2mm 3mm; }
    }
  </style>
</head>
<body>

  <!-- Shop Header -->
  <div class="center bold large">RS ROYAL MEAT MART</div>
  <div class="center small mt4">Bagayath, Uppal, Hyderabad - 500039</div>
  <div class="center small">Ph: 9000474104 | rsroyalmeat@gmail.com</div>
  <hr>

  <!-- Order Info -->
  <div class="totals-row"><span>Order #</span><span class="bold">${order.orderNumber}</span></div>
  <div class="totals-row"><span>Date</span><span>${dateStr}</span></div>
  <div class="totals-row"><span>Customer</span><span>${order.customerName || ''}</span></div>
  <div class="totals-row"><span>Mobile</span><span>${order.customerMobile || ''}</span></div>
  <div class="totals-row"><span>Payment</span><span>${order.paymentMethod || 'UPI'}</span></div>
  <hr>

  <!-- Items Table with proper columns -->
  <table class="items">
    <thead>
      <tr>
        <th class="col-item">ITEM</th>
        <th class="col-qty">QTY</th>
        <th class="col-rate">RATE</th>
        <th class="col-amt">AMT</th>
      </tr>
    </thead>
    <tbody>
      ${itemRows}
    </tbody>
  </table>
  <hr>

  <!-- Totals -->
  <div class="totals-row"><span>Subtotal</span><span>₹${Math.round(subtotal)}</span></div>
  <hr class="solid">
  <div class="totals-row grand"><span>TOTAL</span><span>₹${Math.round(order.total)}</span></div>
  <hr>

  <!-- Pickup Info -->
  <div class="center mt4">Collect at <b>Dispatch Counter</b></div>
  <div class="center">Ready in 20–30 minutes</div>
  <div class="center mt4"><span class="tag">PICKUP ORDER</span></div>
  <hr>

  <!-- Footer -->
  <div class="center mt4 bold">Thank you for your order!</div>
  <div class="center">Fresh · Quality · Daily</div>
  <div class="center small mt4" style="color:#666;">Powered by Keerthu's Soft Solution</div>

  <script>
    // Auto-close after printing
    window.onafterprint = function() { window.close(); };
  </script>
</body>
</html>`);

  win.document.close();
  win.focus();

  // Auto-print fires immediately (used after payment); manual uses a slight delay for rendering
  setTimeout(() => {
    try {
      win.print();
      if (!autoPrint) {
        // For manual print button, don't force-close so user can retry
      }
    } catch (err) {
      console.warn('Print failed:', err);
    }
  }, autoPrint ? 500 : 400);
}


// ═══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════════════════════
export default function HomePage() {
  const [loaded,           setLoaded]           = useState(false);
  const [cartOpen,         setCartOpen]         = useState(false);
  const [checkoutOpen,     setCheckoutOpen]     = useState(false);
  const [receiptOrder,     setReceiptOrder]     = useState(null);
  const [receiptOpen,      setReceiptOpen]      = useState(false);
  const [ratingOpen,       setRatingOpen]       = useState(false);
  const [scrollTopVisible, setScrollTopVisible] = useState(false);
  const { itemCount } = useCartStore();

  const { data: shopSettings } = useQuery('shop-settings', shopApi.getSettings, { staleTime: 0 });
  const { data: products = [] } = useQuery('products-public', () => productsApi.getAll({ status: 'available' }), { staleTime: 30000 });
  const { data: categories = [] } = useQuery('categories', categoriesApi.getAll, { staleTime: 300000 });
  const { data: reviews = [] }   = useQuery('reviews-public', reviewsApi.getPublic, { staleTime: 60000 });

  useEffect(() => {
    const fn = () => setScrollTopVisible(window.scrollY > 500);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  return (
    <>
      {!loaded && <SiteLoader onDone={() => setLoaded(true)} />}

      <div style={{ opacity: loaded ? 1 : 0, transition: 'opacity 0.5s ease' }}>
        <Navbar cartCount={itemCount()} onOpenCart={() => setCartOpen(true)} settings={shopSettings} />

        {/* Hero with carousel background */}
        <Hero settings={shopSettings} products={products} />

        <ShopSection products={products} categories={categories} />

        {/* Gallery section — before reviews */}
        <GallerySection settings={shopSettings} />

        <ReviewsSection reviews={reviews} onRate={() => setRatingOpen(true)} />

        <ContactSection settings={shopSettings} />

        {/* Footer */}
        <footer className="relative overflow-hidden bg-stone-900 text-white/60 pt-12 pb-6 px-4">
          {[
            { size: 80,  left: '5%',  delay: '0s',   dur: '9s',  color: '#ef4444' },
            { size: 50,  left: '18%', delay: '2s',   dur: '13s', color: '#f97316' },
            { size: 120, left: '40%', delay: '1s',   dur: '11s', color: '#ef4444' },
            { size: 40,  left: '62%', delay: '3.5s', dur: '8s',  color: '#f97316' },
            { size: 90,  left: '75%', delay: '0.5s', dur: '14s', color: '#ef4444' },
            { size: 30,  left: '88%', delay: '4s',   dur: '10s', color: '#f97316' },
            { size: 60,  left: '92%', delay: '1.5s', dur: '7s',  color: '#ef4444' },
          ].map((b, i) => (
            <span key={i} className="absolute bottom-0 rounded-full pointer-events-none"
              style={{ width: b.size, height: b.size, left: b.left, background: b.color, opacity: 0, animation: `floatBubble ${b.dur} ${b.delay} linear infinite` }} />
          ))}

          <div className="relative z-10 max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-4 gap-8">
            <div className="border-b border-white/10 pb-5 sm:border-none sm:pb-0">
              <p className="font-display text-lg font-bold text-white mb-2 flex items-center gap-2">
                🥩 {shopSettings?.shopName || 'RS ROYAL MEAT MART'}
              </p>
              <p className="text-sm leading-relaxed text-white/50">
                Fresh fish, chicken &amp; mutton sourced daily. Quality you can taste.
              </p>
            </div>
            <div className="border-b border-white/10 pb-5 sm:border-none sm:pb-0">
              <p className="text-xs font-bold text-white uppercase tracking-wider mb-3">Contact</p>
              <p className="text-sm flex items-center gap-1.5 mb-1"><Phone size={12} /> {shopSettings?.phone || '9000474104'}</p>
              <p className="text-sm flex items-center gap-1.5"><Mail size={12} /> {shopSettings?.email || 'rsroyalmeat@gmail.com'}</p>
            </div>
            <div>
              <p className="text-xs font-bold text-white uppercase tracking-wider mb-3">Hours</p>
              <p className="text-sm flex items-center gap-1.5 mb-1"><Clock size={12} /> Mon–Sat: {shopSettings?.openTime || '7AM'} – {shopSettings?.closeTime || '8PM'}</p>
              <p className="text-sm flex items-center gap-1.5"><Clock size={12} /> Sunday: {shopSettings?.openTime || '7AM'} – {shopSettings?.sundayClose || '2PM'}</p>
            </div>
            <div>
              <p className="text-xs font-bold text-white uppercase tracking-wider mb-3">Follow us on</p>
              <div className='flex gap-3'>
                  <Instagram size={25} className="hover:text-red-500 hover:scale-110 transition-all duration-300 cursor-pointer"/> 
                  <Facebook size={25}  className="hover:text-blue-600 hover:scale-110 transition-all duration-300 cursor-pointer"/> 
                  <YoutubeIcon size={25} className="hover:text-red-500 hover:scale-110 transition-all duration-300 cursor-pointer"/> 
                  <YoutubeIcon size={25}  className="hover:text-red-500 hover:scale-110 transition-all duration-300 cursor-pointer"/> 
              </div>
           
            </div>
          </div>

          <div className="relative z-10 max-w-5xl mx-auto border-t border-white/10 mt-8 pt-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs">
            <span className="text-white/35">© 2026 {shopSettings?.shopName || 'RS ROYAL MEAT MART'}</span>
            <span className="flex items-center gap-1 text-white/35">
              From our shop to your plate, with <span className="text-red-500 text-base leading-none">❤</span>
            </span>
            <span className="text-white/20 text-center">Keerthu's Soft Solution </span>
          </div>
          <ShareSection />
        </footer>

        {/* Modals */}
        <CartDrawer
          open={cartOpen}
          onClose={() => setCartOpen(false)}
          onCheckout={() => { setCartOpen(false); setCheckoutOpen(true); }}
        />
        <CheckoutModal
          open={checkoutOpen}
          onClose={() => setCheckoutOpen(false)}
          onSuccess={(order) => {
            setCheckoutOpen(false);
            setReceiptOrder(order);
            setReceiptOpen(true);
          }}
        />
        <ReceiptModal
          open={receiptOpen}
          order={receiptOrder}
          settings={shopSettings}
          onClose={() => setReceiptOpen(false)}
          onRate={() => setRatingOpen(true)}
        />
        <RatingModal open={ratingOpen} onClose={() => setRatingOpen(false)} />

          

        {scrollTopVisible && (
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="fixed bottom-6 right-6 z-40 w-11 h-11 bg-brand-500 hover:bg-brand-600 text-white rounded-full shadow-brand flex items-center justify-center transition"
            style={{ animation: 'modalFade 0.3s ease both' }}>
            <ChevronUp size={20} />
          </button>
        )}
      </div>

      {/* Global keyframes */}
      <style>{`
        @keyframes heroFade {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0);    }
        }
        @keyframes modalFade {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0);    }
        }
        @keyframes marquee {
          from { transform: translateX(0);    }
          to   { transform: translateX(-50%); }
        }
        @keyframes blink {
          0%,100% { opacity: 1; }
          50%     { opacity: 0.3; }
        }
        @keyframes floatBubble {
          0%   { transform: translateY(0) scale(1);    opacity: 0.07; }
          50%  { opacity: 0.13; }
          100% { transform: translateY(-180px) scale(1.1); opacity: 0; }
        }
      `}</style>
    </>
  );
}