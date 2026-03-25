import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useForm } from 'react-hook-form';
import { categoriesApi } from '../../services/api';
import {
  Plus, Edit2, Trash2, X, ToggleLeft, ToggleRight,
  GripVertical, CheckCircle, AlertCircle
} from 'lucide-react';
import { clsx } from 'clsx';
import toast from 'react-hot-toast';

// Common meat/fish emojis for the icon picker
const ICON_OPTIONS = [
  '🐟','🐡','🦈','🐠','🦐','🦞','🦀','🐙',
  '🍗','🐔','🥩','🐑','🐄','🐖','🫀','🥚',
  '🌿','🧂','🫙','🍖','🔪','🧊','🛒','📦',
];

// ── Category Modal (Create + Edit) ────────────────────────────────────────────
function CategoryModal({ category, onClose }) {
  const qc = useQueryClient();
  const isEdit = !!category;
  const [selectedIcon, setSelectedIcon] = useState(category?.icon || '🐟');

  const { register, handleSubmit, formState: { errors }, setValue } = useForm({
    defaultValues: {
      name:      category?.name      || '',
      sortOrder: category?.sortOrder ?? 0,
      active:    category?.active    ?? true,
    },
  });

  const mutation = useMutation(
    (data) =>
      isEdit
        ? categoriesApi.update(category.id, data)
        : categoriesApi.create(data),
    {
      onSuccess: () => {
        qc.invalidateQueries('categories-admin');
        qc.invalidateQueries('categories');       // also refresh public cache
        toast.success(isEdit ? 'Category updated!' : 'Category created!');
        onClose();
      },
      onError: (e) =>
        toast.error(e.response?.data?.message || 'Failed to save category'),
    }
  );

  const onSubmit = (data) => {
    mutation.mutate({ ...data, icon: selectedIcon });
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div
        className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden"
        style={{ animation: 'authFadeUp 0.3s ease forwards' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200 bg-stone-50">
          <h2 className="text-base font-bold text-stone-800">
            {isEdit ? 'Edit Category' : 'Add New Category'}
          </h2>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-700 transition"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5">

          {/* Icon picker */}
          <div>
            <label className="block text-xs font-semibold text-stone-500 mb-2 uppercase tracking-wide">
              Icon
            </label>
            <div className="flex flex-wrap gap-2">
              {ICON_OPTIONS.map((icon) => (
                <button
                  key={icon}
                  type="button"
                  onClick={() => setSelectedIcon(icon)}
                  className={clsx(
                    'w-10 h-10 rounded-xl text-xl flex items-center justify-center border-2 transition',
                    selectedIcon === icon
                      ? 'border-brand-500 bg-brand-50 scale-110'
                      : 'border-stone-200 hover:border-brand-300 hover:bg-stone-50'
                  )}
                >
                  {icon}
                </button>
              ))}
            </div>
            <p className="text-xs text-stone-400 mt-2">
              Selected: <span className="text-lg">{selectedIcon}</span>
            </p>
          </div>

          {/* Name */}
          <div>
            <label className="block text-xs font-semibold text-stone-500 mb-1.5 uppercase tracking-wide">
              Category Name *
            </label>
            <input
              {...register('name', {
                required: 'Category name is required',
                minLength: { value: 2, message: 'Minimum 2 characters' },
                maxLength: { value: 50, message: 'Maximum 50 characters' },
              })}
              placeholder="e.g. Fresh Fish"
              className="w-full border border-stone-200 rounded-xl px-4 py-2.5 text-sm
                         focus:outline-none focus:border-brand-400 focus:ring-2
                         focus:ring-brand-100 transition"
            />
            {errors.name && (
              <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                <AlertCircle size={11} /> {errors.name.message}
              </p>
            )}
          </div>

          {/* Sort order */}
          <div>
            <label className="block text-xs font-semibold text-stone-500 mb-1.5 uppercase tracking-wide">
              Sort Order
            </label>
            <input
              type="number"
              min={0}
              {...register('sortOrder', { valueAsNumber: true })}
              className="w-full border border-stone-200 rounded-xl px-4 py-2.5 text-sm
                         focus:outline-none focus:border-brand-400 focus:ring-2
                         focus:ring-brand-100 transition"
            />
            <p className="text-xs text-stone-400 mt-1">
              Lower number = appears first in the shop filter tabs.
            </p>
          </div>

          {/* Active toggle (edit mode only) */}
          {isEdit && (
            <div className="flex items-center justify-between p-3 bg-stone-50 rounded-xl border border-stone-200">
              <div>
                <p className="text-sm font-semibold text-stone-700">Visible in shop</p>
                <p className="text-xs text-stone-400">Hidden categories won't appear in the public shop</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  {...register('active')}
                  className="sr-only peer"
                  defaultChecked={category?.active ?? true}
                />
                <div className="w-11 h-6 bg-stone-200 peer-checked:bg-brand-500 rounded-full
                                peer-focus:ring-2 peer-focus:ring-brand-100
                                after:content-[''] after:absolute after:top-[2px] after:left-[2px]
                                after:bg-white after:rounded-full after:h-5 after:w-5
                                after:transition-all peer-checked:after:translate-x-full" />
              </label>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-stone-200 rounded-xl py-2.5 text-sm
                         font-medium text-stone-600 hover:bg-stone-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={mutation.isLoading}
              className="flex-1 bg-brand-500 hover:bg-brand-600 text-white rounded-xl
                         py-2.5 text-sm font-semibold transition disabled:opacity-60
                         flex items-center justify-center gap-2"
            >
              {mutation.isLoading && (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              )}
              {mutation.isLoading
                ? 'Saving…'
                : isEdit ? 'Update Category' : 'Create Category'}
            </button>
          </div>
        </form>
      </div>

      <style>{`
        @keyframes authFadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

// ── Delete confirm modal ──────────────────────────────────────────────────────
function DeleteConfirmModal({ category, onConfirm, onClose, isLoading }) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-6 text-center">
        <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <Trash2 size={24} className="text-red-500" />
        </div>
        <h3 className="text-base font-bold text-stone-800 mb-2">Delete Category?</h3>
        <p className="text-sm text-stone-500 mb-1">
          You are about to delete <strong>{category.icon} {category.name}</strong>.
        </p>
        {category.productCount > 0 ? (
          <div className="bg-amber-light border border-amber-200 rounded-xl p-3 my-3 text-xs text-amber-800 text-left">
            <strong>⚠ Warning:</strong> This category has{' '}
            <strong>{category.productCount} product(s)</strong> linked to it.
            Remove or reassign those products before deleting.
          </div>
        ) : (
          <p className="text-xs text-stone-400 mb-4">This action cannot be undone.</p>
        )}
        <div className="flex gap-3 mt-4">
          <button
            onClick={onClose}
            className="flex-1 border border-stone-200 rounded-xl py-2.5 text-sm
                       font-medium text-stone-600 hover:bg-stone-50 transition"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading || category.productCount > 0}
            className="flex-1 bg-red-500 hover:bg-red-600 text-white rounded-xl
                       py-2.5 text-sm font-semibold transition disabled:opacity-50
                       flex items-center justify-center gap-2"
          >
            {isLoading && (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            )}
            {isLoading ? 'Deleting…' : 'Yes, Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Categories page ──────────────────────────────────────────────────────
export default function CategoriesAdmin() {
  const [modal, setModal]           = useState(null); // null | 'new' | category object
  const [deleteTarget, setDeleteTarget] = useState(null);
  const qc = useQueryClient();

  const { data: categories = [], isLoading } = useQuery(
    'categories-admin',
    categoriesApi.getAllAdmin,
    { staleTime: 30000 }
  );

  const toggleMutation = useMutation(
    (cat) => categoriesApi.update(cat.id, { ...cat, active: !cat.active }),
    {
      onSuccess: (_, cat) => {
        qc.invalidateQueries('categories-admin');
        qc.invalidateQueries('categories');
        toast.success(`${cat.icon} ${cat.name} is now ${cat.active ? 'hidden' : 'visible'}`);
      },
    }
  );

  const deleteMutation = useMutation(categoriesApi.delete, {
    onSuccess: () => {
      qc.invalidateQueries('categories-admin');
      qc.invalidateQueries('categories');
      toast.success('Category deleted');
      setDeleteTarget(null);
    },
    onError: (e) =>
      toast.error(e.response?.data?.message || 'Cannot delete — products may be linked'),
  });

  const activeCount   = categories.filter((c) => c.active).length;
  const inactiveCount = categories.length - activeCount;

  return (
    <div className="space-y-5">

      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-stone-800">Categories</h1>
          <p className="text-sm text-stone-400">
            {categories.length} total · {activeCount} active · {inactiveCount} hidden
          </p>
        </div>
        <button
          onClick={() => setModal('new')}
          className="flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white
                     px-4 py-2.5 rounded-xl text-sm font-semibold shadow-brand transition"
        >
          <Plus size={16} /> Add Category
        </button>
      </div>

      {/* Info banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
        <AlertCircle size={16} className="text-blue-500 flex-shrink-0 mt-0.5" />
        <div className="text-xs text-blue-700">
          <strong>Categories</strong> control the filter tabs on the public shop page (Fish · Chicken · Mutton).
          Sort order determines which tab appears first.
          Hidden categories and their products won't appear in the shop.
        </div>
      </div>

      {/* Category cards grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-stone-100 rounded-2xl h-36 animate-pulse" />
          ))}
        </div>
      ) : categories.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-stone-200 shadow-card">
          <p className="text-5xl mb-3">🐟</p>
          <p className="text-base font-semibold text-stone-700 mb-1">No categories yet</p>
          <p className="text-sm text-stone-400 mb-5">
            Add Fish, Chicken and Mutton to get started.
          </p>
          <button
            onClick={() => setModal('new')}
            className="bg-brand-500 hover:bg-brand-600 text-white px-5 py-2.5
                       rounded-xl text-sm font-semibold shadow-brand transition"
          >
            <Plus size={14} className="inline mr-1" /> Add First Category
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className={clsx(
                'bg-white rounded-2xl border shadow-card hover:shadow-card-hover transition-all overflow-hidden',
                cat.active ? 'border-stone-200' : 'border-stone-200 opacity-60'
              )}
            >
              {/* Card header */}
              <div className="flex items-center gap-4 p-5">
                <div className={clsx(
                  'w-14 h-14 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0',
                  cat.active ? 'bg-brand-50' : 'bg-stone-100'
                )}>
                  {cat.icon || '📦'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base font-bold text-stone-800">{cat.name}</h3>
                    <span className={clsx(
                      'text-[10px] font-bold px-2 py-0.5 rounded-full',
                      cat.active
                        ? 'bg-green-light text-green-shop'
                        : 'bg-stone-100 text-stone-400'
                    )}>
                      {cat.active ? 'Visible' : 'Hidden'}
                    </span>
                  </div>
                  <p className="text-xs text-stone-400 mt-0.5">
                    Slug: <span className="font-mono">{cat.slug}</span>
                  </p>
                </div>
              </div>

              {/* Stats row */}
              <div className="px-5 pb-4 grid grid-cols-2 gap-3">
                <div className="bg-stone-50 rounded-xl p-3 text-center">
                  <p className="text-xl font-bold text-stone-800">{cat.productCount}</p>
                  <p className="text-[10px] text-stone-400 uppercase tracking-wide mt-0.5">
                    Products
                  </p>
                </div>
                <div className="bg-stone-50 rounded-xl p-3 text-center">
                  <p className="text-xl font-bold text-stone-800">#{cat.sortOrder}</p>
                  <p className="text-[10px] text-stone-400 uppercase tracking-wide mt-0.5">
                    Sort Order
                  </p>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex border-t border-stone-100">
                <button
                  onClick={() => setModal(cat)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-3 text-xs
                             font-semibold text-stone-500 hover:bg-stone-50 hover:text-stone-800
                             transition"
                >
                  <Edit2 size={13} /> Edit
                </button>

                <button
                  onClick={() => toggleMutation.mutate(cat)}
                  disabled={toggleMutation.isLoading}
                  className={clsx(
                    'flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-semibold transition border-x border-stone-100',
                    cat.active
                      ? 'text-stone-400 hover:bg-stone-50 hover:text-amber-shop'
                      : 'text-green-shop hover:bg-green-light'
                  )}
                >
                  {cat.active
                    ? <><ToggleRight size={13} /> Hide</>
                    : <><ToggleLeft size={13} /> Show</>}
                </button>

                <button
                  onClick={() => setDeleteTarget(cat)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-3 text-xs
                             font-semibold text-stone-400 hover:bg-red-50 hover:text-red-500
                             transition"
                >
                  <Trash2 size={13} /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Summary table — shown when there are categories */}
      {categories.length > 0 && (
        <div className="bg-white rounded-2xl border border-stone-200 shadow-card overflow-hidden">
          <div className="px-5 py-4 border-b border-stone-100">
            <p className="text-sm font-bold text-stone-700">All Categories — Table View</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-stone-50 border-b border-stone-200">
                  {['Icon', 'Name', 'Slug', 'Products', 'Sort', 'Status', 'Actions'].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-xs font-semibold text-stone-400 uppercase tracking-wide"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {categories.map((cat) => (
                  <tr
                    key={cat.id}
                    className="border-t border-stone-100 hover:bg-stone-50 transition"
                  >
                    <td className="px-4 py-3 text-2xl">{cat.icon}</td>
                    <td className="px-4 py-3 font-semibold text-stone-800">{cat.name}</td>
                    <td className="px-4 py-3 font-mono text-xs text-stone-400">{cat.slug}</td>
                    <td className="px-4 py-3">
                      <span className={clsx(
                        'text-xs font-bold px-2 py-1 rounded-full',
                        cat.productCount > 0
                          ? 'bg-blue-50 text-blue-600'
                          : 'bg-stone-100 text-stone-400'
                      )}>
                        {cat.productCount} product{cat.productCount !== 1 ? 's' : ''}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-stone-600 font-mono">#{cat.sortOrder}</td>
                    <td className="px-4 py-3">
                      <span className={clsx(
                        'inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full',
                        cat.active
                          ? 'bg-green-light text-green-shop'
                          : 'bg-stone-100 text-stone-400'
                      )}>
                        {cat.active
                          ? <><CheckCircle size={10} /> Active</>
                          : <><X size={10} /> Hidden</>}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setModal(cat)}
                          className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-400
                                     hover:text-stone-700 transition"
                          title="Edit"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => toggleMutation.mutate(cat)}
                          className={clsx(
                            'p-1.5 rounded-lg transition',
                            cat.active
                              ? 'hover:bg-amber-light text-stone-400 hover:text-amber-shop'
                              : 'hover:bg-green-light text-stone-400 hover:text-green-shop'
                          )}
                          title={cat.active ? 'Hide' : 'Show'}
                        >
                          {cat.active ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
                        </button>
                        <button
                          onClick={() => setDeleteTarget(cat)}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-stone-400
                                     hover:text-red-500 transition"
                          title="Delete"
                          disabled={cat.productCount > 0}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modals */}
      {modal && (
        <CategoryModal
          category={modal === 'new' ? null : modal}
          onClose={() => setModal(null)}
        />
      )}

      {deleteTarget && (
        <DeleteConfirmModal
          category={deleteTarget}
          onConfirm={() => deleteMutation.mutate(deleteTarget.id)}
          onClose={() => setDeleteTarget(null)}
          isLoading={deleteMutation.isLoading}
        />
      )}
    </div>
  );
}