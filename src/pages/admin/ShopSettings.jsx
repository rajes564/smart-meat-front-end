// import React, { useEffect, useCallback, useState } from 'react';
// import { useQuery, useMutation, useQueryClient } from 'react-query';
// import { shopApi } from '../../services/api';
// import { useShopStore } from '../../store';
// import { useDropzone } from 'react-dropzone';
// import { useForm } from 'react-hook-form';
// import { Upload, Save, Store, Phone, MapPin, Clock } from 'lucide-react';
// import { clsx } from 'clsx';
// import toast from 'react-hot-toast';

// // ── Image upload dropzone ─────────────────────────────────────────────────────
// function ImageUpload({ label, preview, onDrop, hint }) {
//   const { getRootProps, getInputProps, isDragActive } = useDropzone({
//     onDrop, accept: { 'image/*': [] }, maxFiles: 1,
//   });
//   return (
//     <div>
//       <label className="block text-xs font-semibold text-stone-500 mb-2">{label}</label>
//       <div
//         {...getRootProps()}
//         className={clsx(
//           'border-2 border-dashed rounded-xl overflow-hidden cursor-pointer transition',
//           isDragActive
//             ? 'border-brand-400 bg-brand-50'
//             : 'border-stone-200 hover:border-brand-300'
//         )}
//       >
//         <input {...getInputProps()} />
//         {preview ? (
//           <div className="relative h-32">
//             <img src={preview} alt={label} className="w-full h-full object-cover" />
//             <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition">
//               <p className="text-white text-xs font-semibold flex items-center gap-1">
//                 <Upload size={13} /> Change Image
//               </p>
//             </div>
//           </div>
//         ) : (
//           <div className="h-24 flex flex-col items-center justify-center text-stone-400 gap-1">
//             <Upload size={20} />
//             <p className="text-xs">Drop or click to upload</p>
//             {hint && <p className="text-[10px] text-stone-300">{hint}</p>}
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }

// // ── Main Settings Page ────────────────────────────────────────────────────────
// export default function ShopSettings() {
//   const qc          = useQueryClient();
//   const setSettings = useShopStore(s => s.setSettings);

//   const [logoPrev,   setLogoPrev]   = useState(null);
//   const [bannerPrev, setBannerPrev] = useState(null);
//   const [logoFile,   setLogoFile]   = useState(null);
//   const [bannerFile, setBannerFile] = useState(null);

//   const { data: settings, isLoading } = useQuery(
//     'shop-settings-admin',
//     shopApi.getSettings
//   );

//   const { register, handleSubmit, reset, watch } = useForm();
//   const watchedStatus = watch('status');

//   useEffect(() => {
//     if (settings) {
//       reset(settings);
//       if (settings.logoUrl)   setLogoPrev(settings.logoUrl);
//       if (settings.bannerUrl) setBannerPrev(settings.bannerUrl);
//     }
//   }, [settings, reset]);

//   const saveMutation = useMutation(
//     async (data) => {
//       const form = new FormData();
//       form.append(
//         'settings',
//         new Blob([JSON.stringify(data)], { type: 'application/json' })
//       );
//       if (logoFile)   form.append('logo',   logoFile);
//       if (bannerFile) form.append('banner', bannerFile);
//       return shopApi.update(form);
//     },
//     {
//       onSuccess: (updated) => {
//         // Invalidate both keys — admin panel + homepage each use a different key
//         qc.invalidateQueries('shop-settings-admin');
//         qc.invalidateQueries('shop-settings');
//         // Push to Zustand so sidebar shop-status button updates instantly
//         setSettings(updated);
//         toast.success('Settings saved! Homepage updated.');
//       },
//       onError: () => toast.error('Failed to save settings'),
//     }
//   );

//   const onLogoDrop   = useCallback(([f]) => {
//     if (!f) return;
//     setLogoFile(f);
//     setLogoPrev(URL.createObjectURL(f));
//   }, []);

//   const onBannerDrop = useCallback(([f]) => {
//     if (!f) return;
//     setBannerFile(f);
//     setBannerPrev(URL.createObjectURL(f));
//   }, []);

//   if (isLoading) return (
//     <div className="flex items-center justify-center h-48">
//       <div className="w-6 h-6 border-2 border-brand-400 border-t-transparent rounded-full animate-spin" />
//     </div>
//   );

//   // ── Field group config ──────────────────────────────────────────────────────
//   const FIELD_GROUPS = [
//     {
//       title: 'Basic Information', icon: Store,
//       fields: [
//         { key: 'shopName', label: 'Shop Name', placeholder: 'Smart Meat Shop',              span: 1 },
//         { key: 'tagline',  label: 'Tagline',   placeholder: 'Fresh Fish · Chicken · Mutton', span: 1 },
//       ],
//     },
//     {
//       title: 'Contact Details', icon: Phone,
//       fields: [
//         { key: 'phone',   label: 'Phone Number', placeholder: '9121200123',         span: 1 },
//         { key: 'email',   label: 'Email',         placeholder: 'shop@gmail.com',    span: 1 },
//         { key: 'address', label: 'Address',        placeholder: 'Full shop address', span: 2, textarea: true },
//       ],
//     },
//     {
//       title: 'Location (for map)', icon: MapPin,
//       fields: [
//         { key: 'latitude',  label: 'Latitude',  placeholder: '17.4461', span: 1 },
//         { key: 'longitude', label: 'Longitude', placeholder: '78.4739', span: 1 },
//       ],
//     },
//     {
//       title: 'Shop Hours', icon: Clock,
//       fields: [
//         { key: 'openTime',    label: 'Opening Time',            placeholder: '07:00', span: 1 },
//         { key: 'closeTime',   label: 'Closing Time (Mon–Sat)', placeholder: '20:00', span: 1 },
//         { key: 'sundayClose', label: 'Sunday Closing Time',    placeholder: '14:00', span: 1 },
//       ],
//     },
//   ];

//   const STATUS_OPTIONS = [
//     { value: 'OPEN',               label: '🟢 Open',        desc: 'Accepting orders' },
//     { value: 'CLOSED',             label: '🔴 Closed',      desc: 'Not accepting'    },
//     { value: 'TEMPORARILY_CLOSED', label: '🟡 Temp Closed', desc: 'Back shortly'     },
//   ];

//   const inputCls =
//     'w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm ' +
//     'focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 transition';

//   // ── Render ──────────────────────────────────────────────────────────────────
//   // NOTE: NO overflow wrapper here.
//   // The admin <main> element already has overflow-y-auto.
//   // Adding a second scroll container causes a double-scrollbar.
//   return (
//     <form
//       onSubmit={handleSubmit(d => saveMutation.mutate(d))}
//       className="space-y-5 max-w-3xl pb-10"
//     >
//       {/* Page heading */}
//       <div className="flex items-center justify-between">
//         <div>
//           <h1 className="text-lg font-bold text-stone-800">Shop Settings</h1>
//           <p className="text-xs text-stone-400 mt-0.5">
//             Changes reflect on the public homepage after saving
//           </p>
//         </div>
//         <button
//           type="submit"
//           disabled={saveMutation.isLoading}
//           className="flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white
//                      px-5 py-2.5 rounded-xl text-sm font-semibold shadow-brand transition
//                      disabled:opacity-60 flex-shrink-0"
//         >
//           <Save size={15} />
//           {saveMutation.isLoading ? 'Saving…' : 'Save Changes'}
//         </button>
//       </div>

//       {/* Images */}
//       <div className="bg-white rounded-2xl border border-stone-200 shadow-card p-5">
//         <p className="text-sm font-bold text-stone-700 mb-1">Images</p>
//         <p className="text-xs text-stone-400 mb-4">
//           Logo shows in the navbar. Banner is the homepage hero background.
//         </p>
//         <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
//           <ImageUpload
//             label="Logo"
//             preview={logoPrev}
//             onDrop={onLogoDrop}
//             hint="Square · PNG/JPG · max 10 MB"
//           />
//           <ImageUpload
//             label="Hero Banner"
//             preview={bannerPrev}
//             onDrop={onBannerDrop}
//             hint="Wide · 1600×600 ideal"
//           />
//         </div>
//       </div>

//       {/* Field groups */}
//       {FIELD_GROUPS.map(({ title, icon: Icon, fields }) => (
//         <div key={title} className="bg-white rounded-2xl border border-stone-200 shadow-card p-5">
//           <div className="flex items-center gap-2 mb-4">
//             <Icon size={16} className="text-brand-500" />
//             <p className="text-sm font-bold text-stone-700">{title}</p>
//           </div>
//           <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
//             {fields.map(({ key, label, placeholder, span, textarea }) => (
//               <div key={key} className={span === 2 ? 'sm:col-span-2' : ''}>
//                 <label className="block text-xs font-semibold text-stone-500 mb-1.5">
//                   {label}
//                 </label>
//                 {textarea ? (
//                   <textarea
//                     {...register(key)}
//                     placeholder={placeholder}
//                     rows={3}
//                     className={clsx(inputCls, 'resize-none')}
//                   />
//                 ) : (
//                   <input
//                     {...register(key)}
//                     placeholder={placeholder}
//                     className={inputCls}
//                   />
//                 )}
//               </div>
//             ))}
//           </div>
//         </div>
//       ))}

//       {/* ── Opening / Current Balances ── */}
//       <div className="bg-white rounded-2xl border border-stone-200 shadow-card p-5">
//         <div className="flex items-start justify-between mb-1">
//           <div>
//             <p className="text-sm font-bold text-stone-700">Cash &amp; Account Balances</p>
//             <p className="text-xs text-stone-400 mt-0.5">
//               Set the current actual balance in your cash drawer and bank/UPI account.
//               These values update automatically with every sale, purchase, and expense.
//               Use these fields only to correct opening balances.
//             </p>
//           </div>
//         </div>
//         <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
//           <div>
//             <label className="block text-xs font-semibold text-stone-500 mb-1.5 flex items-center gap-1">
//               💵 Cash Balance (₹)
//             </label>
//             <input
//               type="number" step="0.01" min="0"
//               {...register('cashBalance', { valueAsNumber: true })}
//               placeholder="0.00"
//               className={inputCls + ' font-mono'}
//             />
//             <p className="text-[10px] text-stone-400 mt-1">
//               Physical cash in your drawer right now
//             </p>
//           </div>
//           <div>
//             <label className="block text-xs font-semibold text-stone-500 mb-1.5 flex items-center gap-1">
//               💳 Account / UPI Balance (₹)
//             </label>
//             <input
//               type="number" step="0.01" min="0"
//               {...register('accountBalance', { valueAsNumber: true })}
//               placeholder="0.00"
//               className={inputCls + ' font-mono'}
//             />
//             <p className="text-[10px] text-stone-400 mt-1">
//               Balance in your bank / UPI account
//             </p>
//           </div>
//         </div>
//         <div className="mt-3 bg-blue-50 border border-blue-200 rounded-xl px-4 py-2.5 text-xs text-blue-700 flex items-start gap-2">
//           <span className="text-base">ℹ️</span>
//           <span>
//             These balances are also visible and adjustable from the
//             <strong> Inventory → Dashboard</strong> page in real-time.
//           </span>
//         </div>
//       </div>

//       {/* Shop status */}
//       <div className="bg-white rounded-2xl border border-stone-200 shadow-card p-5">
//         <p className="text-sm font-bold text-stone-700 mb-1">Shop Status</p>
//         <p className="text-xs text-stone-400 mb-3">
//           Shown in the homepage header and footer.
//         </p>
//         <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
//           {STATUS_OPTIONS.map(({ value, label, desc }) => {
//             const active =
//               watchedStatus === value ||
//               (!watchedStatus && settings?.status === value);
//             return (
//               <label key={value} className="cursor-pointer">
//                 <input
//                   type="radio"
//                   {...register('status')}
//                   value={value}
//                   className="sr-only"
//                 />
//                 <div
//                   className={clsx(
//                     'border-2 rounded-xl p-3 text-center transition select-none',
//                     active
//                       ? 'border-brand-500 bg-brand-50'
//                       : 'border-stone-200 hover:border-stone-300'
//                   )}
//                 >
//                   <p className={clsx(
//                     'text-sm font-bold',
//                     active ? 'text-brand-600' : 'text-stone-700'
//                   )}>
//                     {label}
//                   </p>
//                   <p className="text-[10px] text-stone-400 mt-0.5">{desc}</p>
//                 </div>
//               </label>
//             );
//           })}
//         </div>
//       </div>

//       {/* Bottom save */}
//       <div className="flex justify-end">
//         <button
//           type="submit"
//           disabled={saveMutation.isLoading}
//           className="flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white
//                      px-6 py-3 rounded-xl text-sm font-bold shadow-brand transition
//                      disabled:opacity-60"
//         >
//           <Save size={15} />
//           {saveMutation.isLoading ? 'Saving…' : 'Save All Changes'}
//         </button>
//       </div>
//     </form>
//   );
// }

import React, { useEffect, useCallback, useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { shopApi } from '../../services/api';
import { useShopStore } from '../../store';
import { useDropzone } from 'react-dropzone';
import { useForm } from 'react-hook-form';
import {
  Upload, Save, Store, Phone, MapPin, Clock,
  Plus, Trash2, Edit2, Check, X, GripVertical,
  Image as ImageIcon, Video, ChevronLeft, ChevronRight,
  Eye
} from 'lucide-react';
import { clsx } from 'clsx';
import toast from 'react-hot-toast';

// ─────────────────────────────────────────────────────────────────────────────
// SINGLE-IMAGE UPLOAD DROPZONE
// ─────────────────────────────────────────────────────────────────────────────
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
          isDragActive ? 'border-brand-400 bg-brand-50' : 'border-stone-200 hover:border-brand-300'
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

// ─────────────────────────────────────────────────────────────────────────────
// HERO CAROUSEL MANAGER
// ─────────────────────────────────────────────────────────────────────────────
function HeroCarouselManager({ slides, onChange }) {
  const [previewIdx,   setPreviewIdx]   = useState(0);
  const [editingId,    setEditingId]    = useState(null);
  const [editCaption,  setEditCaption]  = useState('');
  const dragItem = useRef(null);
  const dragOver = useRef(null);

  const addSlide = useCallback((files) => {
    const next = [...slides];
    files.forEach(f => {
      next.push({ id: crypto.randomUUID(), src: URL.createObjectURL(f), caption: '', file: f, isNew: true });
    });
    onChange(next);
    setPreviewIdx(next.length - 1);
  }, [slides, onChange]);

  const removeSlide = (id) => {
    const next = slides.filter(s => s.id !== id);
    onChange(next);
    setPreviewIdx(i => Math.min(i, Math.max(0, next.length - 1)));
  };

  const saveCaption = (id) => {
    onChange(slides.map(s => s.id === id ? { ...s, caption: editCaption } : s));
    setEditingId(null);
  };

  const onDragStart = (i) => { dragItem.current = i; };
  const onDragEnter = (i) => { dragOver.current = i; };
  const onDragEnd   = () => {
    if (dragItem.current === null || dragOver.current === null) return;
    const next = [...slides];
    const [moved] = next.splice(dragItem.current, 1);
    next.splice(dragOver.current, 0, moved);
    dragItem.current = null;
    dragOver.current = null;
    onChange(next);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: addSlide, accept: { 'image/*': [] }, multiple: true,
  });

  return (
    <div className="space-y-4">
      {slides.length > 0 && (
        <div className="relative rounded-xl overflow-hidden bg-stone-900 h-40 sm:h-52">
          <img src={slides[previewIdx]?.src} alt="preview" className="w-full h-full object-cover opacity-60 transition-all duration-500" />
          <div className="absolute inset-0 bg-gradient-to-r from-stone-900/70 to-transparent flex items-end p-4">
            <div>
              <p className="text-white/50 text-[10px] uppercase tracking-widest mb-0.5">Slide {previewIdx + 1} of {slides.length}</p>
              <p className="text-white text-sm font-semibold">
                {slides[previewIdx]?.caption || <span className="opacity-40 italic">No caption</span>}
              </p>
            </div>
          </div>
          {slides.length > 1 && (
            <>
              <button type="button" onClick={() => setPreviewIdx(i => (i - 1 + slides.length) % slides.length)}
                className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/40 hover:bg-black/60 rounded-full flex items-center justify-center text-white transition">
                <ChevronLeft size={16} />
              </button>
              <button type="button" onClick={() => setPreviewIdx(i => (i + 1) % slides.length)}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/40 hover:bg-black/60 rounded-full flex items-center justify-center text-white transition">
                <ChevronRight size={16} />
              </button>
            </>
          )}
          <div className="absolute bottom-2 right-3 flex gap-1">
            {slides.map((_, i) => (
              <button key={i} type="button" onClick={() => setPreviewIdx(i)}
                className={clsx('rounded-full transition-all', i === previewIdx ? 'bg-white w-4 h-2' : 'bg-white/40 w-2 h-2')} />
            ))}
          </div>
        </div>
      )}

      {slides.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Slides — drag to reorder</p>
          {slides.map((slide, i) => (
            <div key={slide.id} draggable onDragStart={() => onDragStart(i)} onDragEnter={() => onDragEnter(i)}
              onDragEnd={onDragEnd} onDragOver={e => e.preventDefault()}
              className="flex items-center gap-3 bg-stone-50 border border-stone-200 rounded-xl p-2.5 group select-none">
              <GripVertical size={15} className="text-stone-300 flex-shrink-0 cursor-grab active:cursor-grabbing" />
              <div className="w-12 h-9 rounded-lg overflow-hidden flex-shrink-0 cursor-pointer border border-stone-200" onClick={() => setPreviewIdx(i)}>
                <img src={slide.src} alt="" className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                {editingId === slide.id ? (
                  <div className="flex items-center gap-1.5">
                    <input autoFocus value={editCaption} onChange={e => setEditCaption(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') saveCaption(slide.id); if (e.key === 'Escape') setEditingId(null); }}
                      placeholder="Caption (optional)"
                      className="flex-1 text-xs border border-brand-400 rounded-lg px-2 py-1 focus:outline-none bg-white" />
                    <button type="button" onClick={() => saveCaption(slide.id)} className="text-green-600 hover:text-green-700"><Check size={14} /></button>
                    <button type="button" onClick={() => setEditingId(null)} className="text-stone-400 hover:text-stone-600"><X size={14} /></button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <p className={clsx('text-xs flex-1 truncate', slide.caption ? 'text-stone-700' : 'text-stone-300 italic')}>
                      {slide.caption || 'No caption — click ✏️ to add'}
                    </p>
                    {slide.isNew && <span className="text-[9px] bg-brand-100 text-brand-600 font-bold px-1.5 py-0.5 rounded-full flex-shrink-0">NEW</span>}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button type="button" onClick={() => setPreviewIdx(i)} title="Preview"
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-stone-300 hover:text-brand-500 hover:bg-brand-50 transition"><Eye size={13} /></button>
                <button type="button" onClick={() => { setEditingId(slide.id); setEditCaption(slide.caption || ''); }} title="Edit caption"
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-stone-300 hover:text-blue-500 hover:bg-blue-50 transition"><Edit2 size={13} /></button>
                <button type="button" onClick={() => removeSlide(slide.id)} title="Remove slide"
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-stone-300 hover:text-red-500 hover:bg-red-50 transition"><Trash2 size={13} /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div {...getRootProps()} className={clsx('border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition',
        isDragActive ? 'border-brand-400 bg-brand-50' : 'border-stone-200 hover:border-brand-300 hover:bg-stone-50')}>
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-1.5 text-stone-400">
          <div className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center"><Plus size={16} /></div>
          <p className="text-xs font-semibold">{isDragActive ? 'Drop images here…' : 'Add more slides'}</p>
          <p className="text-[10px] text-stone-300">Drop multiple images or click to browse</p>
        </div>
      </div>

      {slides.length === 0 && (
        <p className="text-center text-xs text-stone-400 py-2">No slides yet — add at least one image above.</p>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// GALLERY MANAGER
// ─────────────────────────────────────────────────────────────────────────────
function GalleryManager({ items, onChange }) {
  const [editingId,   setEditingId]   = useState(null);
  const [editCaption, setEditCaption] = useState('');
  const [lightbox,    setLightbox]    = useState(null);
  const dragItem = useRef(null);
  const dragOver = useRef(null);

  const addMedia = useCallback((files) => {
    const next = [...items];
    files.forEach(f => {
      next.push({ id: crypto.randomUUID(), type: f.type.startsWith('video/') ? 'video' : 'image',
        src: URL.createObjectURL(f), caption: '', file: f, isNew: true });
    });
    onChange(next);
  }, [items, onChange]);

  const removeItem = (id) => {
    onChange(items.filter(it => it.id !== id));
    if (lightbox?.id === id) setLightbox(null);
  };

  const saveCaption = (id) => {
    onChange(items.map(it => it.id === id ? { ...it, caption: editCaption } : it));
    setEditingId(null);
  };

  const onDragStart = (i) => { dragItem.current = i; };
  const onDragEnter = (i) => { dragOver.current = i; };
  const onDragEnd   = () => {
    if (dragItem.current === null || dragOver.current === null) return;
    const next = [...items];
    const [moved] = next.splice(dragItem.current, 1);
    next.splice(dragOver.current, 0, moved);
    dragItem.current = null;
    dragOver.current = null;
    onChange(next);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: addMedia, accept: { 'image/*': [], 'video/*': [] }, multiple: true,
  });

  const lightboxNav = (dir) => {
    if (!lightbox) return;
    const idx  = items.findIndex(it => it.id === lightbox.id);
    setLightbox(items[(idx + dir + items.length) % items.length]);
  };

  return (
    <div className="space-y-4">
      {items.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {items.map((item, i) => (
            <div key={item.id} draggable onDragStart={() => onDragStart(i)} onDragEnter={() => onDragEnter(i)}
              onDragEnd={onDragEnd} onDragOver={e => e.preventDefault()}
              className="relative group rounded-xl overflow-hidden bg-stone-100 aspect-square cursor-pointer select-none"
              onClick={() => setLightbox(item)}>
              {item.type === 'video'
                ? <video src={item.src} className="w-full h-full object-cover" muted />
                : <img src={item.src} alt="" className="w-full h-full object-cover" />}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-1.5">
                {item.type === 'video' && <div className="absolute top-1.5 left-1.5 bg-brand-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full">VIDEO</div>}
                {item.isNew && <div className="absolute top-1.5 right-1.5 bg-green-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full">NEW</div>}
                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                  <button type="button" onClick={e => { e.stopPropagation(); setEditingId(item.id); setEditCaption(item.caption || ''); }}
                    className="w-7 h-7 bg-white/90 rounded-full flex items-center justify-center text-stone-700 hover:bg-white"><Edit2 size={12} /></button>
                  <button type="button" onClick={e => { e.stopPropagation(); removeItem(item.id); }}
                    className="w-7 h-7 bg-red-500 rounded-full flex items-center justify-center text-white hover:bg-red-600"><Trash2 size={12} /></button>
                </div>
              </div>
              {item.caption && (
                <div className="absolute bottom-0 left-0 right-0 bg-black/50 px-2 py-1">
                  <p className="text-white text-[9px] truncate">{item.caption}</p>
                </div>
              )}
              <div className="absolute top-1 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-70 transition-opacity">
                <GripVertical size={12} className="text-white cursor-grab" />
              </div>
            </div>
          ))}
        </div>
      )}

      {editingId && (
        <div className="bg-brand-50 border border-brand-200 rounded-xl p-3 flex items-center gap-2">
          <Edit2 size={14} className="text-brand-500 flex-shrink-0" />
          <input autoFocus value={editCaption} onChange={e => setEditCaption(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') saveCaption(editingId); if (e.key === 'Escape') setEditingId(null); }}
            placeholder="Caption for this media…"
            className="flex-1 text-sm bg-transparent border-none outline-none text-stone-800 placeholder:text-stone-400" />
          <button type="button" onClick={() => saveCaption(editingId)} className="text-green-600 hover:text-green-700 flex-shrink-0"><Check size={16} /></button>
          <button type="button" onClick={() => setEditingId(null)} className="text-stone-400 hover:text-stone-600 flex-shrink-0"><X size={16} /></button>
        </div>
      )}

      <div {...getRootProps()} className={clsx('border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition',
        isDragActive ? 'border-brand-400 bg-brand-50' : 'border-stone-200 hover:border-brand-300 hover:bg-stone-50')}>
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-2 text-stone-400">
          <div className="flex gap-2">
            <div className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center"><ImageIcon size={15} /></div>
            <div className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center"><Video size={15} /></div>
          </div>
          <p className="text-xs font-semibold">{isDragActive ? 'Drop files here…' : 'Add photos & videos'}</p>
          <p className="text-[10px] text-stone-300">Images (JPG/PNG/WEBP) and Videos (MP4/MOV)</p>
        </div>
      </div>

      {items.length === 0 && <p className="text-center text-xs text-stone-400 py-1">No gallery items yet. Add some photos or videos above.</p>}

      {lightbox && (
        <div className="fixed inset-0 bg-black/85 z-[200] flex items-center justify-center p-4" onClick={() => setLightbox(null)}>
          <button type="button" onClick={e => { e.stopPropagation(); lightboxNav(-1); }}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/10 hover:bg-white/25 border border-white/20 rounded-full flex items-center justify-center text-white transition">
            <ChevronLeft size={18} />
          </button>
          <div className="relative max-w-2xl max-h-[80vh] w-full" onClick={e => e.stopPropagation()}>
            {lightbox.type === 'video'
              ? <video src={lightbox.src} controls autoPlay className="max-w-full max-h-[75vh] rounded-xl mx-auto" />
              : <img src={lightbox.src} alt="" className="max-w-full max-h-[75vh] object-contain rounded-xl mx-auto" />}
            {lightbox.caption && (
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent rounded-b-xl px-4 py-3">
                <p className="text-white text-sm font-semibold">{lightbox.caption}</p>
              </div>
            )}
          </div>
          <button type="button" onClick={e => { e.stopPropagation(); lightboxNav(1); }}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/10 hover:bg-white/25 border border-white/20 rounded-full flex items-center justify-center text-white transition">
            <ChevronRight size={18} />
          </button>
          <button type="button" onClick={() => setLightbox(null)}
            className="absolute top-4 right-4 w-9 h-9 bg-white/10 hover:bg-white/25 rounded-full flex items-center justify-center text-white transition">
            <X size={16} />
          </button>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN SETTINGS PAGE
// ─────────────────────────────────────────────────────────────────────────────
export default function ShopSettings() {
  const qc          = useQueryClient();
  const setSettings = useShopStore(s => s.setSettings);

  // ── All useRef / useState hooks must be INSIDE the component ─────────────
  const heroTouched      = useRef(false);   // ← FIXED: was outside component
  const galleryTouched   = useRef(false);   // ← FIXED: was outside component
  const heroSlideFiles   = useRef({});
  const galleryItemFiles = useRef({});

  const [logoPrev,      setLogoPrev]      = useState(null);
  const [bannerPrev,    setBannerPrev]    = useState(null);
  const [logoFile,      setLogoFile]      = useState(null);
  const [bannerFile,    setBannerFile]    = useState(null);
  const [heroSlides,    setHeroSlides]    = useState([]);
  const [galleryItems,  setGalleryItems]  = useState([]);

  const { data: settings, isLoading } = useQuery('shop-settings-admin', shopApi.getSettings);
  const { register, handleSubmit, reset, watch } = useForm();
  const watchedStatus = watch('status');

  useEffect(() => {
    if (!settings) return;
    reset(settings);
    if (settings.logoUrl)   setLogoPrev(settings.logoUrl);
    if (settings.bannerUrl) setBannerPrev(settings.bannerUrl);

    if (Array.isArray(settings.heroImages)) {
      setHeroSlides(settings.heroImages.map((item, i) => ({
        id:      item.id || `existing-${i}`,
        src:     typeof item === 'string' ? item : item.src,
        caption: typeof item === 'string' ? '' : (item.caption || ''),
        isNew:   false,
      })));
    }

    if (Array.isArray(settings.galleryItems)) {
      setGalleryItems(settings.galleryItems.map((item, i) => ({
        id:      item.id || `gal-existing-${i}`,
        type:    item.type || 'image',
        src:     item.src,
        caption: item.caption || '',
        isNew:   false,
      })));
    }
  }, [settings, reset]);

  const handleHeroSlidesChange = (next) => {
    heroTouched.current = true;
    next.forEach(s => { if (s.file) heroSlideFiles.current[s.id] = s.file; });
    const ids = new Set(next.map(s => s.id));
    Object.keys(heroSlideFiles.current).forEach(k => { if (!ids.has(k)) delete heroSlideFiles.current[k]; });
    setHeroSlides(next);
  };

  const handleGalleryItemsChange = (next) => {
    galleryTouched.current = true;
    next.forEach(it => { if (it.file) galleryItemFiles.current[it.id] = it.file; });
    const ids = new Set(next.map(it => it.id));
    Object.keys(galleryItemFiles.current).forEach(k => { if (!ids.has(k)) delete galleryItemFiles.current[k]; });
    setGalleryItems(next);
  };

  const saveMutation = useMutation(
    async (formData) => {
      const form = new FormData();
      const changedScalars = {};

      const scalarKeys = [
        'shopName', 'tagline', 'phone', 'email', 'address',
        'latitude', 'longitude', 'status',
        'openTime', 'closeTime', 'sundayClose',
        'cashBalance', 'accountBalance',
      ];
      scalarKeys.forEach(key => {
        const formVal = formData[key];
        const origVal = settings?.[key];
        // eslint-disable-next-line eqeqeq
        if (formVal != origVal) changedScalars[key] = formVal;
      });

      if (heroTouched.current) {
        changedScalars.heroSlidesMeta = heroSlides.map(s => ({
          id: s.id, caption: s.caption, src: s.isNew ? null : s.src, isNew: s.isNew || false,
        }));
        heroSlides.forEach(s => {
          if (s.isNew && heroSlideFiles.current[s.id])
            form.append(`heroSlide_${s.id}`, heroSlideFiles.current[s.id]);
        });
      }

      if (galleryTouched.current) {
        changedScalars.galleryMeta = galleryItems.map(it => ({
          id: it.id, type: it.type, caption: it.caption, src: it.isNew ? null : it.src, isNew: it.isNew || false,
        }));
        galleryItems.forEach(it => {
          if (it.isNew && galleryItemFiles.current[it.id])
            form.append(`galleryItem_${it.id}`, galleryItemFiles.current[it.id]);
        });
      }

      if (logoFile)   form.append('logo',   logoFile);
      if (bannerFile) form.append('banner', bannerFile);

      form.append('settings', new Blob([JSON.stringify(changedScalars)], { type: 'application/json' }));
      return shopApi.update(form);
    },
    {
      onSuccess: (updated) => {
        qc.invalidateQueries('shop-settings-admin');
        qc.invalidateQueries('shop-settings');
        setSettings(updated);
        toast.success('Settings saved! Homepage updated.');
        heroTouched.current    = false;
        galleryTouched.current = false;
        setLogoFile(null);
        setBannerFile(null);
        setHeroSlides(prev => prev.map(s => ({ ...s, isNew: false })));
        setGalleryItems(prev => prev.map(it => ({ ...it, isNew: false })));
      },
      onError: () => toast.error('Failed to save settings'),
    }
  );

  const onLogoDrop   = useCallback(([f]) => { if (!f) return; setLogoFile(f);   setLogoPrev(URL.createObjectURL(f));   }, []);
  const onBannerDrop = useCallback(([f]) => { if (!f) return; setBannerFile(f); setBannerPrev(URL.createObjectURL(f)); }, []);

  if (isLoading) return (
    <div className="flex items-center justify-center h-48">
      <div className="w-6 h-6 border-2 border-brand-400 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const FIELD_GROUPS = [
    { title: 'Basic Information', icon: Store, fields: [
      { key: 'shopName', label: 'Shop Name', placeholder: 'Smart Meat Shop', span: 1 },
      { key: 'tagline',  label: 'Tagline',   placeholder: 'Fresh Fish · Chicken · Mutton', span: 1 },
    ]},
    { title: 'Contact Details', icon: Phone, fields: [
      { key: 'phone',   label: 'Phone Number', placeholder: '9121200123', span: 1 },
      { key: 'email',   label: 'Email',         placeholder: 'shop@gmail.com', span: 1 },
      { key: 'address', label: 'Address',        placeholder: 'Full shop address', span: 2, textarea: true },
    ]},
    { title: 'Location (for map)', icon: MapPin, fields: [
      { key: 'latitude',  label: 'Latitude',  placeholder: '17.4461', span: 1 },
      { key: 'longitude', label: 'Longitude', placeholder: '78.4739', span: 1 },
    ]},
    { title: 'Shop Hours', icon: Clock, fields: [
      { key: 'openTime',    label: 'Opening Time',           placeholder: '07:00', span: 1 },
      { key: 'closeTime',   label: 'Closing Time (Mon–Sat)', placeholder: '20:00', span: 1 },
      { key: 'sundayClose', label: 'Sunday Closing Time',    placeholder: '14:00', span: 1 },
    ]},
  ];

  const STATUS_OPTIONS = [
    { value: 'OPEN',               label: '🟢 Open',        desc: 'Accepting orders' },
    { value: 'CLOSED',             label: '🔴 Closed',      desc: 'Not accepting'    },
    { value: 'TEMPORARILY_CLOSED', label: '🟡 Temp Closed', desc: 'Back shortly'     },
  ];

  const inputCls =
    'w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm ' +
    'focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 transition';

  return (
    <form onSubmit={handleSubmit(d => saveMutation.mutate(d))} className="space-y-5 max-w-3xl pb-10">

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-stone-800">Shop Settings</h1>
          <p className="text-xs text-stone-400 mt-0.5">Changes reflect on the public homepage after saving</p>
        </div>
        <button type="submit" disabled={saveMutation.isLoading}
          className="flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-brand transition disabled:opacity-60 flex-shrink-0">
          <Save size={15} />
          {saveMutation.isLoading ? 'Saving…' : 'Save Changes'}
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-stone-200 shadow-card p-5">
        <p className="text-sm font-bold text-stone-700 mb-1">Brand Images</p>
        <p className="text-xs text-stone-400 mb-4">Logo shows in the navbar. The hero carousel below overrides the single banner when slides are added.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <ImageUpload label="Logo"                preview={logoPrev}   onDrop={onLogoDrop}   hint="Square · PNG/JPG · max 50 MB" />
          <ImageUpload label="Fallback Hero Banner" preview={bannerPrev} onDrop={onBannerDrop} hint="Used if no carousel slides · 1600×600 ideal" />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-stone-200 shadow-card p-5">
        <div className="flex items-start justify-between mb-1">
          <div>
            <p className="text-sm font-bold text-stone-700">Hero Carousel</p>
            <p className="text-xs text-stone-400 mt-0.5">Multiple background images · drag to reorder · click ✏️ for captions · 🗑 to remove.</p>
          </div>
          <span className="text-xs bg-stone-100 text-stone-500 font-semibold rounded-full px-3 py-1 flex-shrink-0 ml-3">
            {heroSlides.length} slide{heroSlides.length !== 1 ? 's' : ''}
          </span>
        </div>
        <div className="mt-4">
          <HeroCarouselManager slides={heroSlides} onChange={handleHeroSlidesChange} />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-stone-200 shadow-card p-5">
        <div className="flex items-start justify-between mb-1">
          <div>
            <p className="text-sm font-bold text-stone-700">Shop Gallery</p>
            <p className="text-xs text-stone-400 mt-0.5">Photos and videos on the homepage · drag to reorder · hover to edit or delete.</p>
          </div>
          <span className="text-xs bg-stone-100 text-stone-500 font-semibold rounded-full px-3 py-1 flex-shrink-0 ml-3">
            {galleryItems.length} item{galleryItems.length !== 1 ? 's' : ''}
          </span>
        </div>
        <div className="mt-4">
          <GalleryManager items={galleryItems} onChange={handleGalleryItemsChange} />
        </div>
      </div>

      {FIELD_GROUPS.map(({ title, icon: Icon, fields }) => (
        <div key={title} className="bg-white rounded-2xl border border-stone-200 shadow-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Icon size={16} className="text-brand-500" />
            <p className="text-sm font-bold text-stone-700">{title}</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {fields.map(({ key, label, placeholder, span, textarea }) => (
              <div key={key} className={span === 2 ? 'sm:col-span-2' : ''}>
                <label className="block text-xs font-semibold text-stone-500 mb-1.5">{label}</label>
                {textarea
                  ? <textarea {...register(key)} placeholder={placeholder} rows={3} className={clsx(inputCls, 'resize-none')} />
                  : <input {...register(key)} placeholder={placeholder} className={inputCls} />}
              </div>
            ))}
          </div>
        </div>
      ))}

      <div className="bg-white rounded-2xl border border-stone-200 shadow-card p-5">
        <p className="text-sm font-bold text-stone-700 mb-1">Cash &amp; Account Balances</p>
        <p className="text-xs text-stone-400 mt-0.5 mb-4">
          These update automatically with every transaction. Use only to correct opening balances.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-stone-500 mb-1.5">💵 Cash Balance (₹)</label>
            <input type="number" step="0.01" min="0" {...register('cashBalance', { valueAsNumber: true })}
              placeholder="0.00" className={inputCls + ' font-mono'} />
            <p className="text-[10px] text-stone-400 mt-1">Physical cash in your drawer right now</p>
          </div>
          <div>
            <label className="block text-xs font-semibold text-stone-500 mb-1.5">💳 Account / UPI Balance (₹)</label>
            <input type="number" step="0.01" min="0" {...register('accountBalance', { valueAsNumber: true })}
              placeholder="0.00" className={inputCls + ' font-mono'} />
            <p className="text-[10px] text-stone-400 mt-1">Balance in your bank / UPI account</p>
          </div>
        </div>
        <div className="mt-3 bg-blue-50 border border-blue-200 rounded-xl px-4 py-2.5 text-xs text-blue-700 flex items-start gap-2">
          <span className="text-base">ℹ️</span>
          <span>Also visible from <strong>Inventory → Dashboard</strong> in real-time.</span>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-stone-200 shadow-card p-5">
        <p className="text-sm font-bold text-stone-700 mb-1">Shop Status</p>
        <p className="text-xs text-stone-400 mb-3">Shown in the homepage header and footer.</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {STATUS_OPTIONS.map(({ value, label, desc }) => {
            const active = watchedStatus === value || (!watchedStatus && settings?.status === value);
            return (
              <label key={value} className="cursor-pointer">
                <input type="radio" {...register('status')} value={value} className="sr-only" />
                <div className={clsx('border-2 rounded-xl p-3 text-center transition select-none',
                  active ? 'border-brand-500 bg-brand-50' : 'border-stone-200 hover:border-stone-300')}>
                  <p className={clsx('text-sm font-bold', active ? 'text-brand-600' : 'text-stone-700')}>{label}</p>
                  <p className="text-[10px] text-stone-400 mt-0.5">{desc}</p>
                </div>
              </label>
            );
          })}
        </div>
      </div>

      <div className="flex justify-end">
        <button type="submit" disabled={saveMutation.isLoading}
          className="flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white px-6 py-3 rounded-xl text-sm font-bold shadow-brand transition disabled:opacity-60">
          <Save size={15} />
          {saveMutation.isLoading ? 'Saving…' : 'Save All Changes'}
        </button>
      </div>
    </form>
  );
}