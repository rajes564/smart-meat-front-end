import React, { useEffect, useCallback, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { shopApi } from '../../services/api';
import { useShopStore } from '../../store';
import { useDropzone } from 'react-dropzone';
import { useForm } from 'react-hook-form';
import { Upload, Save, Store, Phone, MapPin, Clock } from 'lucide-react';
import { clsx } from 'clsx';
import toast from 'react-hot-toast';

// ── Image upload dropzone ─────────────────────────────────────────────────────
function ImageUpload({ label, preview, onDrop, hint }) {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, accept: { 'image/*': [] }, maxFiles: 1,
  });
  return (
    <div>
      <label className="block text-xs font-semibold text-stone-500 mb-2">{label}</label>
      <div
        {...getRootProps()}
        className={clsx(
          'border-2 border-dashed rounded-xl overflow-hidden cursor-pointer transition',
          isDragActive
            ? 'border-brand-400 bg-brand-50'
            : 'border-stone-200 hover:border-brand-300'
        )}
      >
        <input {...getInputProps()} />
        {preview ? (
          <div className="relative h-32">
            <img src={preview} alt={label} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition">
              <p className="text-white text-xs font-semibold flex items-center gap-1">
                <Upload size={13} /> Change Image
              </p>
            </div>
          </div>
        ) : (
          <div className="h-24 flex flex-col items-center justify-center text-stone-400 gap-1">
            <Upload size={20} />
            <p className="text-xs">Drop or click to upload</p>
            {hint && <p className="text-[10px] text-stone-300">{hint}</p>}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main Settings Page ────────────────────────────────────────────────────────
export default function ShopSettings() {
  const qc          = useQueryClient();
  const setSettings = useShopStore(s => s.setSettings);

  const [logoPrev,   setLogoPrev]   = useState(null);
  const [bannerPrev, setBannerPrev] = useState(null);
  const [logoFile,   setLogoFile]   = useState(null);
  const [bannerFile, setBannerFile] = useState(null);

  const { data: settings, isLoading } = useQuery(
    'shop-settings-admin',
    shopApi.getSettings
  );

  const { register, handleSubmit, reset, watch } = useForm();
  const watchedStatus = watch('status');

  useEffect(() => {
    if (settings) {
      reset(settings);
      if (settings.logoUrl)   setLogoPrev(settings.logoUrl);
      if (settings.bannerUrl) setBannerPrev(settings.bannerUrl);
    }
  }, [settings, reset]);

  const saveMutation = useMutation(
    async (data) => {
      const form = new FormData();
      form.append(
        'settings',
        new Blob([JSON.stringify(data)], { type: 'application/json' })
      );
      if (logoFile)   form.append('logo',   logoFile);
      if (bannerFile) form.append('banner', bannerFile);
      return shopApi.update(form);
    },
    {
      onSuccess: (updated) => {
        // Invalidate both keys — admin panel + homepage each use a different key
        qc.invalidateQueries('shop-settings-admin');
        qc.invalidateQueries('shop-settings');
        // Push to Zustand so sidebar shop-status button updates instantly
        setSettings(updated);
        toast.success('Settings saved! Homepage updated.');
      },
      onError: () => toast.error('Failed to save settings'),
    }
  );

  const onLogoDrop   = useCallback(([f]) => {
    if (!f) return;
    setLogoFile(f);
    setLogoPrev(URL.createObjectURL(f));
  }, []);

  const onBannerDrop = useCallback(([f]) => {
    if (!f) return;
    setBannerFile(f);
    setBannerPrev(URL.createObjectURL(f));
  }, []);

  if (isLoading) return (
    <div className="flex items-center justify-center h-48">
      <div className="w-6 h-6 border-2 border-brand-400 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  // ── Field group config ──────────────────────────────────────────────────────
  const FIELD_GROUPS = [
    {
      title: 'Basic Information', icon: Store,
      fields: [
        { key: 'shopName', label: 'Shop Name', placeholder: 'Smart Meat Shop',              span: 1 },
        { key: 'tagline',  label: 'Tagline',   placeholder: 'Fresh Fish · Chicken · Mutton', span: 1 },
      ],
    },
    {
      title: 'Contact Details', icon: Phone,
      fields: [
        { key: 'phone',   label: 'Phone Number', placeholder: '9121200123',         span: 1 },
        { key: 'email',   label: 'Email',         placeholder: 'shop@gmail.com',    span: 1 },
        { key: 'address', label: 'Address',        placeholder: 'Full shop address', span: 2, textarea: true },
      ],
    },
    {
      title: 'Location (for map)', icon: MapPin,
      fields: [
        { key: 'latitude',  label: 'Latitude',  placeholder: '17.4461', span: 1 },
        { key: 'longitude', label: 'Longitude', placeholder: '78.4739', span: 1 },
      ],
    },
    {
      title: 'Shop Hours', icon: Clock,
      fields: [
        { key: 'openTime',    label: 'Opening Time',            placeholder: '07:00', span: 1 },
        { key: 'closeTime',   label: 'Closing Time (Mon–Sat)', placeholder: '20:00', span: 1 },
        { key: 'sundayClose', label: 'Sunday Closing Time',    placeholder: '14:00', span: 1 },
      ],
    },
  ];

  const STATUS_OPTIONS = [
    { value: 'OPEN',               label: '🟢 Open',        desc: 'Accepting orders' },
    { value: 'CLOSED',             label: '🔴 Closed',      desc: 'Not accepting'    },
    { value: 'TEMPORARILY_CLOSED', label: '🟡 Temp Closed', desc: 'Back shortly'     },
  ];

  const inputCls =
    'w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm ' +
    'focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 transition';

  // ── Render ──────────────────────────────────────────────────────────────────
  // NOTE: NO overflow wrapper here.
  // The admin <main> element already has overflow-y-auto.
  // Adding a second scroll container causes a double-scrollbar.
  return (
    <form
      onSubmit={handleSubmit(d => saveMutation.mutate(d))}
      className="space-y-5 max-w-3xl pb-10"
    >
      {/* Page heading */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-stone-800">Shop Settings</h1>
          <p className="text-xs text-stone-400 mt-0.5">
            Changes reflect on the public homepage after saving
          </p>
        </div>
        <button
          type="submit"
          disabled={saveMutation.isLoading}
          className="flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white
                     px-5 py-2.5 rounded-xl text-sm font-semibold shadow-brand transition
                     disabled:opacity-60 flex-shrink-0"
        >
          <Save size={15} />
          {saveMutation.isLoading ? 'Saving…' : 'Save Changes'}
        </button>
      </div>

      {/* Images */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-card p-5">
        <p className="text-sm font-bold text-stone-700 mb-1">Images</p>
        <p className="text-xs text-stone-400 mb-4">
          Logo shows in the navbar. Banner is the homepage hero background.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <ImageUpload
            label="Logo"
            preview={logoPrev}
            onDrop={onLogoDrop}
            hint="Square · PNG/JPG · max 10 MB"
          />
          <ImageUpload
            label="Hero Banner"
            preview={bannerPrev}
            onDrop={onBannerDrop}
            hint="Wide · 1600×600 ideal"
          />
        </div>
      </div>

      {/* Field groups */}
      {FIELD_GROUPS.map(({ title, icon: Icon, fields }) => (
        <div key={title} className="bg-white rounded-2xl border border-stone-200 shadow-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Icon size={16} className="text-brand-500" />
            <p className="text-sm font-bold text-stone-700">{title}</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {fields.map(({ key, label, placeholder, span, textarea }) => (
              <div key={key} className={span === 2 ? 'sm:col-span-2' : ''}>
                <label className="block text-xs font-semibold text-stone-500 mb-1.5">
                  {label}
                </label>
                {textarea ? (
                  <textarea
                    {...register(key)}
                    placeholder={placeholder}
                    rows={3}
                    className={clsx(inputCls, 'resize-none')}
                  />
                ) : (
                  <input
                    {...register(key)}
                    placeholder={placeholder}
                    className={inputCls}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* ── Opening / Current Balances ── */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-card p-5">
        <div className="flex items-start justify-between mb-1">
          <div>
            <p className="text-sm font-bold text-stone-700">Cash &amp; Account Balances</p>
            <p className="text-xs text-stone-400 mt-0.5">
              Set the current actual balance in your cash drawer and bank/UPI account.
              These values update automatically with every sale, purchase, and expense.
              Use these fields only to correct opening balances.
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
          <div>
            <label className="block text-xs font-semibold text-stone-500 mb-1.5 flex items-center gap-1">
              💵 Cash Balance (₹)
            </label>
            <input
              type="number" step="0.01" min="0"
              {...register('cashBalance', { valueAsNumber: true })}
              placeholder="0.00"
              className={inputCls + ' font-mono'}
            />
            <p className="text-[10px] text-stone-400 mt-1">
              Physical cash in your drawer right now
            </p>
          </div>
          <div>
            <label className="block text-xs font-semibold text-stone-500 mb-1.5 flex items-center gap-1">
              💳 Account / UPI Balance (₹)
            </label>
            <input
              type="number" step="0.01" min="0"
              {...register('accountBalance', { valueAsNumber: true })}
              placeholder="0.00"
              className={inputCls + ' font-mono'}
            />
            <p className="text-[10px] text-stone-400 mt-1">
              Balance in your bank / UPI account
            </p>
          </div>
        </div>
        <div className="mt-3 bg-blue-50 border border-blue-200 rounded-xl px-4 py-2.5 text-xs text-blue-700 flex items-start gap-2">
          <span className="text-base">ℹ️</span>
          <span>
            These balances are also visible and adjustable from the
            <strong> Inventory → Dashboard</strong> page in real-time.
          </span>
        </div>
      </div>

      {/* Shop status */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-card p-5">
        <p className="text-sm font-bold text-stone-700 mb-1">Shop Status</p>
        <p className="text-xs text-stone-400 mb-3">
          Shown in the homepage header and footer.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {STATUS_OPTIONS.map(({ value, label, desc }) => {
            const active =
              watchedStatus === value ||
              (!watchedStatus && settings?.status === value);
            return (
              <label key={value} className="cursor-pointer">
                <input
                  type="radio"
                  {...register('status')}
                  value={value}
                  className="sr-only"
                />
                <div
                  className={clsx(
                    'border-2 rounded-xl p-3 text-center transition select-none',
                    active
                      ? 'border-brand-500 bg-brand-50'
                      : 'border-stone-200 hover:border-stone-300'
                  )}
                >
                  <p className={clsx(
                    'text-sm font-bold',
                    active ? 'text-brand-600' : 'text-stone-700'
                  )}>
                    {label}
                  </p>
                  <p className="text-[10px] text-stone-400 mt-0.5">{desc}</p>
                </div>
              </label>
            );
          })}
        </div>
      </div>

      {/* Bottom save */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={saveMutation.isLoading}
          className="flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white
                     px-6 py-3 rounded-xl text-sm font-bold shadow-brand transition
                     disabled:opacity-60"
        >
          <Save size={15} />
          {saveMutation.isLoading ? 'Saving…' : 'Save All Changes'}
        </button>
      </div>
    </form>
  );
}
