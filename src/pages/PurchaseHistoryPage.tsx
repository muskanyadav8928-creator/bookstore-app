import React, { useState, useEffect } from 'react';
import { 
  Receipt, 
  ArrowLeft, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  BookOpen, 
  Search 
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { OrderService } from '../services/api';
import { OrderItem } from '../types';

export const PurchaseHistoryPage: React.FC = () => {
  const { currentUser, navigateTo, openReader, getBookById } = useApp();
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  useEffect(() => {
    if (!currentUser) {
      navigateTo('login');
      return;
    }

    setIsLoading(true);
    OrderService.getMyOrders()
      .then(data => {
        setOrders(data || []);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [currentUser]);

  const filteredOrders = orders.filter(o => {
    const matchesSearch = 
      o.orderId.toLowerCase().includes(search.toLowerCase()) ||
      o.bookTitle.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = filterStatus === 'ALL' || o.paymentStatus === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <button
            type="button"
            onClick={() => navigateTo('library')}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-600 transition-colors mb-2 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to My Library</span>
          </button>
          <h1 className="text-2xl sm:text-3xl font-bold font-serif text-slate-900 dark:text-white">
            Purchase History & Invoices
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Official transaction records for premium digital volumes purchased under your student account.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 rounded-2xl border border-indigo-200 dark:border-indigo-900 text-xs flex items-center gap-2">
            <Receipt className="w-4 h-4" />
            <span className="font-bold">{orders.filter(o => o.paymentStatus === 'PAID').length} Paid Orders</span>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by order ID or book title..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {['ALL', 'PAID', 'PENDING', 'FAILED'].map(st => (
            <button
              key={st}
              type="button"
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                filterStatus === st
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="py-16 text-center text-slate-500 text-xs">
            Loading order records...
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <Receipt className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              No purchase orders found.
            </p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Any premium books you buy through the demo checkout will be recorded here with payment references and timestamps.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Order ID</th>
                  <th className="py-3 px-4">Book Title</th>
                  <th className="py-3 px-4">Gateway</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Payment Status</th>
                  <th className="py-3 px-4">Channel / Ref</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {filteredOrders.map(ord => {
                  const book = getBookById(ord.bookId);
                  const isDemo = ord.isDemo !== false && ord.gateway !== 'RAZORPAY' && ord.gateway !== 'STRIPE';

                  return (
                    <tr key={ord.orderId} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900 dark:text-white">
                        {ord.orderId}
                      </td>

                      <td className="py-3.5 px-4 max-w-xs truncate text-slate-800 dark:text-slate-200">
                        {ord.bookTitle}
                      </td>

                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          ord.gateway === 'RAZORPAY'
                            ? 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-blue-200'
                            : ord.gateway === 'STRIPE'
                            ? 'bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300 border border-purple-200'
                            : 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border border-amber-200'
                        }`}>
                          {isDemo ? 'DEMO (TEST)' : `${ord.gateway} (TEST)`}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 font-bold font-mono text-slate-900 dark:text-white">
                        ₹{ord.amount}.00
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase ${
                            ord.paymentStatus === 'PAID'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : ord.paymentStatus === 'PENDING'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                              : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                          }`}
                        >
                          {ord.paymentStatus === 'PAID' && <CheckCircle2 className="w-3 h-3" />}
                          {ord.paymentStatus === 'FAILED' && <XCircle className="w-3 h-3" />}
                          {ord.paymentStatus === 'PENDING' && <Clock className="w-3 h-3" />}
                          <span>{ord.paymentStatus}</span>
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px] truncate max-w-[150px]">
                        {ord.paymentReference || ord.paymentMethod || 'Simulated UPI'}
                      </td>

                      <td className="py-3.5 px-4 text-slate-400 whitespace-nowrap">
                        {new Date(ord.createdAt).toLocaleDateString('en-US', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        {ord.paymentStatus === 'PAID' && book ? (
                          <button
                            type="button"
                            onClick={() => openReader(book)}
                            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold cursor-pointer inline-flex items-center gap-1 shadow-xs"
                          >
                            <BookOpen className="w-3.5 h-3.5" />
                            <span>Read</span>
                          </button>
                        ) : ord.paymentStatus === 'PENDING' ? (
                          <button
                            type="button"
                            onClick={() => navigateTo('payment-demo', { bookId: ord.bookId })}
                            className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold cursor-pointer inline-flex items-center gap-1 shadow-xs"
                          >
                            <span>Complete Pay</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => navigateTo('payment-demo', { bookId: ord.bookId })}
                            className="px-3 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold cursor-pointer"
                          >
                            <span>Retry</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
