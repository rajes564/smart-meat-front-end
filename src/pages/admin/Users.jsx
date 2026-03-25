import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { usersApi } from '../../services/api';
import { useForm } from 'react-hook-form';
import { Plus, Edit2, Trash2, ShieldCheck, User, ShoppingBag, X } from 'lucide-react';
import { clsx } from 'clsx';
import toast from 'react-hot-toast';

const ROLE_CONFIG = {
  ADMIN:    { label: 'Admin',    icon: ShieldCheck, color: 'bg-brand-50 text-brand-600 border-brand-200' },
  SELLER:   { label: 'Seller',   icon: ShoppingBag, color: 'bg-blue-50 text-blue-600 border-blue-200' },
  CUSTOMER: { label: 'Customer', icon: User,        color: 'bg-stone-100 text-stone-500 border-stone-200' },
};

function UserModal({ user, onClose }) {
  const qc = useQueryClient();
  const isEdit = !!user;
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: user ? { name: user.name, email: user.email, role: user.role, active: user.active } : { role: 'SELLER', active: true },
  });

  const mutation = useMutation(
    (data) => isEdit ? usersApi.update(user.id, data) : usersApi.create(data),
    {
      onSuccess: () => {
        qc.invalidateQueries('users');
        toast.success(isEdit ? 'User updated!' : 'User created!');
        onClose();
      },
      onError: (e) => toast.error(e.response?.data?.message || 'Failed'),
    }
  );

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl animate-slide-up overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-stone-200">
          <h2 className="text-base font-bold text-stone-800">{isEdit ? 'Edit User' : 'Add Staff User'}</h2>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-700"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit(d => mutation.mutate(d))} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-stone-500 mb-1.5">Full Name *</label>
            <input {...register('name', { required: true })} placeholder="Full name"
              className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-brand-400" />
          </div>
          {!isEdit && (
            <div>
              <label className="block text-xs font-semibold text-stone-500 mb-1.5">Mobile Number *</label>
              <input {...register('mobile', { required: !isEdit, minLength: 10 })} type="tel" maxLength={10} placeholder="10-digit mobile"
                className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-brand-400" />
            </div>
          )}
          <div>
            <label className="block text-xs font-semibold text-stone-500 mb-1.5">Email</label>
            <input {...register('email')} type="email" placeholder="Optional"
              className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-brand-400" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-stone-500 mb-1.5">Password {isEdit ? '(leave blank to keep)' : '*'}</label>
            <input {...register('password', { required: !isEdit })} type="password" placeholder={isEdit ? 'New password (optional)' : 'Min 6 characters'}
              className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-brand-400" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-stone-500 mb-1.5">Role *</label>
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(ROLE_CONFIG).map(([role, cfg]) => {
                const Icon = cfg.icon;
                return (
                  <label key={role} className="cursor-pointer">
                    <input type="radio" {...register('role')} value={role} className="sr-only" />
                    <div className="text-center border-2 rounded-xl p-3 transition hover:border-brand-300">
                      <Icon size={18} className="mx-auto mb-1 text-stone-400" />
                      <p className="text-xs font-semibold text-stone-600">{cfg.label}</p>
                      {role === 'SELLER' && <p className="text-[9px] text-stone-400 mt-0.5">New Sale only</p>}
                    </div>
                  </label>
                );
              })}
            </div>
          </div>
          {isEdit && (
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" {...register('active')} className="w-4 h-4 rounded accent-brand-500" />
              <span className="text-sm text-stone-600">Account is active</span>
            </label>
          )}
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 border border-stone-200 rounded-xl py-2.5 text-sm font-medium text-stone-600 hover:bg-stone-50">
              Cancel
            </button>
            <button type="submit" disabled={mutation.isLoading}
              className="flex-1 bg-brand-500 hover:bg-brand-600 text-white rounded-xl py-2.5 text-sm font-semibold transition disabled:opacity-60">
              {mutation.isLoading ? 'Saving…' : isEdit ? 'Update' : 'Create User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function UsersAdmin() {
  const [modal, setModal] = useState(null);
  const [roleFilter, setRoleFilter] = useState('all');
  const qc = useQueryClient();

  const { data: users = [], isLoading } = useQuery('users', usersApi.getAll);

  const deleteMutation = useMutation(usersApi.delete, {
    onSuccess: () => { qc.invalidateQueries('users'); toast.success('User deleted'); },
  });

  const filtered = roleFilter === 'all' ? users : users.filter(u => u.role === roleFilter);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-stone-800">User Management</h1>
          <p className="text-sm text-stone-400">{users.length} total accounts</p>
        </div>
        <button onClick={() => setModal('new')}
          className="flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white px-4 py-2 rounded-xl text-sm font-semibold shadow-brand transition">
          <Plus size={15} /> Add Staff
        </button>
      </div>

      {/* Role tabs */}
      <div className="flex gap-2">
        {[['all','All'], ...Object.entries(ROLE_CONFIG).map(([k,v])=>[k,v.label])].map(([key, label]) => (
          <button key={key} onClick={() => setRoleFilter(key)}
            className={clsx('px-3 py-1.5 rounded-full text-xs font-semibold transition',
              roleFilter === key ? 'bg-brand-500 text-white' : 'bg-stone-100 text-stone-500 hover:bg-stone-200')}>
            {label} ({key === 'all' ? users.length : users.filter(u=>u.role===key).length})
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-stone-50 text-left border-b border-stone-200">
                <th className="px-5 py-3 text-xs font-semibold text-stone-400 uppercase tracking-wide">User</th>
                <th className="px-4 py-3 text-xs font-semibold text-stone-400 uppercase tracking-wide">Mobile</th>
                <th className="px-4 py-3 text-xs font-semibold text-stone-400 uppercase tracking-wide">Role</th>
                <th className="px-4 py-3 text-xs font-semibold text-stone-400 uppercase tracking-wide">Status</th>
                <th className="px-4 py-3 text-xs font-semibold text-stone-400 uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(user => {
                const roleConf = ROLE_CONFIG[user.role] || ROLE_CONFIG.CUSTOMER;
                const Icon = roleConf.icon;
                return (
                  <tr key={user.id} className="border-t border-stone-100 hover:bg-stone-50 transition">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center text-brand-600 text-sm font-bold flex-shrink-0">
                          {user.name?.[0] || '?'}
                        </div>
                        <div>
                          <p className="font-semibold text-stone-800">{user.name}</p>
                          {user.email && <p className="text-xs text-stone-400">{user.email}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-sm text-stone-600">{user.mobile}</td>
                    <td className="px-4 py-3">
                      <span className={clsx('inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full border', roleConf.color)}>
                        <Icon size={11} /> {roleConf.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={clsx('text-xs font-semibold px-2 py-0.5 rounded-full',
                        user.active ? 'bg-green-light text-green-shop' : 'bg-stone-100 text-stone-400')}>
                        {user.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button onClick={() => setModal(user)}
                          className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-400 hover:text-stone-700 transition">
                          <Edit2 size={14} />
                        </button>
                        <button onClick={() => {
                            if (confirm(`Delete ${user.name}? This cannot be undone.`)) deleteMutation.mutate(user.id);
                          }}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-stone-400 hover:text-red-500 transition">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && !isLoading && (
            <div className="text-center py-10 text-stone-400">
              <p className="text-sm">No users found</p>
            </div>
          )}
        </div>
      </div>

      {modal && (
        <UserModal
          user={modal === 'new' ? null : modal}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}
