import React, { useState, useCallback, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { productsApi, categoriesApi } from '../../services/api';
import { useDropzone } from 'react-dropzone';
import { useForm } from 'react-hook-form';
import { gsap } from 'gsap';
import { Plus, Edit2, Trash2, Eye, EyeOff, Upload, X, Search } from 'lucide-react';
import { clsx } from 'clsx';
import toast from 'react-hot-toast';

const STOCK_COLORS = {
  IN_STOCK:    'bg-green-light text-green-shop',
  LOW_STOCK:   'bg-amber-light text-amber-shop',
  OUT_OF_STOCK:'bg-red-50 text-red-500',
};

function ProductModal({ product, categories, onClose }) {
  const qc = useQueryClient();
  const [preview, setPreview] = useState(product?.imageUrl || null);
  const [imageFile, setImageFile] = useState(null);
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: product ? {
      name: product.name,
      description: product.description,
      categoryId: product.categoryId,
      pricePerKg: product.pricePerKg,
      costPerKg: product.costPerKg,
      stockQty: product.stockQty,
      minStockLevel: product.minStockLevel,
      minOrderQty: product.minOrderQty,
      orderStep: product.orderStep,
      sortOrder: product.sortOrder,
    } : { minOrderQty: 0.5, orderStep: 0.5, minStockLevel: 5, sortOrder: 0 },
  });

  const onDrop = useCallback(([file]) => {
    if (!file) return;
    setImageFile(file);
    setPreview(URL.createObjectURL(file));
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, accept: { 'image/*': [] }, maxFiles: 1,
  });

  const saveMutation = useMutation(
    async (data) => {
      const form = new FormData();
      form.append('product', new Blob([JSON.stringify(data)], { type: 'application/json' }));
      if (imageFile) form.append('image', imageFile);
      return product
        ? productsApi.update(product.id, form)
        : productsApi.create(form);
    },
    {
      onSuccess: () => {
        qc.invalidateQueries('products');
        toast.success(product ? 'Product updated!' : 'Product created!');
        onClose();
      },
      onError: (e) => toast.error(e.response?.data?.message || 'Failed to save product'),
    }
  );

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-lg my-8 shadow-2xl animate-slide-up">
        <div className="flex items-center justify-between p-5 border-b border-stone-200">
          <h2 className="text-base font-bold text-stone-800">{product ? 'Edit Product' : 'Add New Product'}</h2>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-700"><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit(d => saveMutation.mutate(d))} className="p-5 space-y-4">
          {/* Image drop */}
          <div {...getRootProps()} className={clsx(
            'border-2 border-dashed rounded-xl overflow-hidden cursor-pointer transition-colors',
            isDragActive ? 'border-brand-400 bg-brand-50' : 'border-stone-200 hover:border-brand-300'
          )}>
            <input {...getInputProps()} />
            {preview ? (
              <div className="relative h-36">
                <img src={preview} alt="preview" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition">
                  <p className="text-white text-sm font-medium">Click to change</p>
                </div>
              </div>
            ) : (
              <div className="h-28 flex flex-col items-center justify-center text-stone-400">
                <Upload size={24} className="mb-2" />
                <p className="text-sm">Drag & drop or click to upload product image</p>
              </div>
            )}
          </div>

          {/* Fields */}
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-stone-500 mb-1">Product Name *</label>
              <input {...register('name', { required: true })}
                className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-400"
                placeholder="e.g. Rohu Fish" />
              {errors.name && <p className="text-xs text-red-500 mt-0.5">Name is required</p>}
            </div>

            <div className="col-span-2">
              <label className="block text-xs font-semibold text-stone-500 mb-1">Description</label>
              <textarea {...register('description')} rows={2}
                className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-400 resize-none"
                placeholder="Short description…" />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-500 mb-1">Category *</label>
              <select {...register('categoryId', { required: true, valueAsNumber: true })}
                className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-400">
                <option value="">Select…</option>
                {categories?.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-500 mb-1">Sort Order</label>
              <input type="number" {...register('sortOrder', { valueAsNumber: true })}
                className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-400" />
            </div>

            {[
              { key: 'pricePerKg',    label: 'Price / kg (₹) *',    required: true },
              { key: 'costPerKg',     label: 'Cost / kg (₹)',        required: false },
              { key: 'stockQty',      label: 'Stock Qty (kg)',        required: false },
              { key: 'minStockLevel', label: 'Min Stock Level',       required: false },
              { key: 'minOrderQty',   label: 'Min Order Qty',        required: false },
              { key: 'orderStep',     label: 'Order Step',           required: false },
            ].map(({ key, label, required }) => (
              <div key={key}>
                <label className="block text-xs font-semibold text-stone-500 mb-1">{label}</label>
                <input type="number" step="0.01" {...register(key, { required, valueAsNumber: true })}
                  className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-400" />
              </div>
            ))}
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 border border-stone-200 rounded-xl py-2.5 text-sm font-medium text-stone-600 hover:bg-stone-50">
              Cancel
            </button>
            <button type="submit" disabled={saveMutation.isLoading}
              className="flex-2 flex-1 bg-brand-500 hover:bg-brand-600 text-white rounded-xl py-2.5 text-sm font-semibold transition disabled:opacity-60">
              {saveMutation.isLoading ? 'Saving…' : product ? 'Update Product' : 'Add Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ProductsAdmin() {
  const [modal, setModal] = useState(null); // null | 'new' | product obj
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('all');
  const qc = useQueryClient();
  const listRef = useRef(null);

  const { data: products = [], isLoading } = useQuery('products', () => productsApi.getAll({}));
  const { data: categories = [] } = useQuery('categories', categoriesApi.getAll);

  const deleteMutation = useMutation(productsApi.delete, {
    onSuccess: () => { qc.invalidateQueries('products'); toast.success('Product deleted'); },
  });

  const toggleMutation = useMutation(productsApi.toggle, {
    onSuccess: () => qc.invalidateQueries('products'),
  });

  const filtered = products.filter(p => {
    const matchesCat = catFilter === 'all' || p.categoryId === Number(catFilter);
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-stone-800">Products</h1>
          <p className="text-sm text-stone-400">{products.length} total products</p>
        </div>
        <button onClick={() => setModal('new')}
          className="flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white px-4 py-2 rounded-xl text-sm font-semibold shadow-brand transition">
          <Plus size={16} /> Add Product
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 bg-white rounded-xl border border-stone-200 px-4 py-3 shadow-card">
        <div className="flex items-center gap-2 flex-1 min-w-36">
          <Search size={14} className="text-stone-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search products…"
            className="flex-1 text-sm outline-none bg-transparent text-stone-700 placeholder:text-stone-300" />
        </div>
        <div className="flex gap-2 flex-wrap">
          {[{ id: 'all', name: 'All' }, ...categories].map(c => (
            <button key={c.id} onClick={() => setCatFilter(String(c.id))}
              className={clsx('px-3 py-1 rounded-full text-xs font-semibold transition',
                String(catFilter) === String(c.id)
                  ? 'bg-brand-500 text-white'
                  : 'bg-stone-100 text-stone-500 hover:bg-stone-200'
              )}>
              {c.icon} {c.name}
            </button>
          ))}
        </div>
      </div>

      {/* Product grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array(8).fill(0).map((_, i) => (
            <div key={i} className="bg-stone-100 rounded-xl h-56 animate-pulse" />
          ))}
        </div>
      ) : (
        <div ref={listRef} className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filtered.map(product => (
            <div key={product.id}
              className="bg-white rounded-xl border border-stone-200 shadow-card hover:shadow-card-hover transition-all overflow-hidden group">
              <div className="relative">
                {product.imageUrl ? (
                  <img src={product.imageUrl} alt={product.name}
                    className="w-full h-32 object-cover group-hover:scale-105 transition-transform duration-300" />
                ) : (
                  <div className="w-full h-32 bg-brand-50 flex items-center justify-center text-4xl">
                    {product.categoryIcon || '🥩'}
                  </div>
                )}
                {/* Status badge */}
                <span className={clsx('absolute top-2 right-2 text-[9px] font-bold px-2 py-0.5 rounded-full',
                  STOCK_COLORS[product.stockStatus])}>
                  {product.stockStatus?.replace('_', ' ')}
                </span>
                {/* Unavailable overlay */}
                {!product.available && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <span className="text-white text-xs font-bold bg-black/60 px-2 py-1 rounded-full">Hidden</span>
                  </div>
                )}
              </div>

              <div className="p-3">
                <p className="text-sm font-semibold text-stone-800 truncate">{product.name}</p>
                <p className="text-xs text-stone-400 mb-2">{product.categoryName}</p>
                <div className="flex items-center justify-between">
                  <span className="text-base font-bold text-brand-500">₹{product.pricePerKg}/kg</span>
                  <span className="text-xs text-stone-400">{product.stockQty}kg</span>
                </div>
                <p className="text-xs text-stone-400 mt-0.5">Cost: ₹{product.costPerKg}/kg</p>
              </div>

              {/* Actions */}
              <div className="flex border-t border-stone-100">
                <button onClick={() => setModal(product)}
                  className="flex-1 flex items-center justify-center gap-1 py-2 text-xs font-medium text-stone-500 hover:bg-stone-50 hover:text-stone-800 transition">
                  <Edit2 size={12} /> Edit
                </button>
                <button onClick={() => toggleMutation.mutate(product.id)}
                  className="flex-1 flex items-center justify-center gap-1 py-2 text-xs font-medium text-stone-500 hover:bg-stone-50 transition border-x border-stone-100">
                  {product.available ? <EyeOff size={12} /> : <Eye size={12} />}
                  {product.available ? 'Hide' : 'Show'}
                </button>
                <button onClick={() => {
                    if (confirm(`Delete "${product.name}"?`)) deleteMutation.mutate(product.id);
                  }}
                  className="flex-1 flex items-center justify-center gap-1 py-2 text-xs font-medium text-stone-400 hover:bg-red-50 hover:text-red-500 transition">
                  <Trash2 size={12} /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {filtered.length === 0 && !isLoading && (
        <div className="text-center py-16 text-stone-400">
          <p className="text-4xl mb-3">📦</p>
          <p className="text-sm">No products found</p>
          <button onClick={() => setModal('new')} className="mt-3 text-brand-500 text-sm font-medium hover:underline">
            Add your first product
          </button>
        </div>
      )}

      {modal && (
        <ProductModal
          product={modal === 'new' ? null : modal}
          categories={categories}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}
