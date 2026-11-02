import React from 'react';
import { Mail, Shield, CheckCircle2, BookMarked, Heart, LogOut } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const ProfilePage: React.FC = () => {
  const { currentUser, logoutUser, navigateTo, wishlistIds, libraryItems } = useApp();

  if (!currentUser) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="font-serif text-2xl font-bold text-slate-900 dark:text-white">Sign In Required</h2>
        <p className="text-xs text-slate-500">Please sign in to view your student profile.</p>
        <button
          type="button"
          onClick={() => navigateTo('login')}
          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold cursor-pointer"
        >
          Sign In
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Profile Header */}
      <div className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-indigo-600 text-white font-bold text-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
            {currentUser.name.charAt(0).toUpperCase()}
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h1 className="font-serif text-2xl font-bold text-slate-900 dark:text-white">
                {currentUser.name}
              </h1>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                  currentUser.role === 'ADMIN'
                    ? 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800'
                    : 'bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300'
                }`}
              >
                {currentUser.role}
              </span>
            </div>
            <p className="text-xs text-slate-500 flex items-center gap-1.5 font-mono">
              <Mail className="w-3.5 h-3.5" />
              <span>{currentUser.email}</span>
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={logoutUser}
          className="px-4 py-2 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 dark:hover:bg-rose-900 text-rose-600 dark:text-rose-400 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border border-rose-200 dark:border-rose-900"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400">Library Items</span>
            <p className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">{libraryItems.length}</p>
          </div>
          <div className="p-2.5 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600">
            <BookMarked className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400">Saved Wishlist</span>
            <p className="text-xl font-bold text-rose-600 mt-0.5">{wishlistIds.length}</p>
          </div>
          <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950 text-rose-600">
            <Heart className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400">Account Status</span>
            <p className="text-xl font-bold text-emerald-600 mt-0.5">{currentUser.status}</p>
          </div>
          <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-600">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Account Details */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
        <h3 className="font-semibold text-slate-900 dark:text-white text-sm">Security & Access Privileges</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <span className="text-slate-400 block mb-0.5">Authorization Role</span>
            <strong className="text-slate-900 dark:text-white">
              {currentUser.role === 'ADMIN' ? 'System Administrator (Full Control)' : 'Student User (Academic Access)'}
            </strong>
          </div>
          <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <span className="text-slate-400 block mb-0.5">Authentication Provider</span>
            <strong className="text-slate-900 dark:text-white">MongoDB + JWT Session Token</strong>
          </div>
        </div>

        {currentUser.role === 'ADMIN' && (
          <div className="pt-2">
            <button
              type="button"
              onClick={() => navigateTo('admin')}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Launch Administrator Dashboard</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
