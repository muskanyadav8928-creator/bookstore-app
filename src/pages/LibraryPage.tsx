import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  CheckCircle2, 
  Bookmark, 
  Receipt, 
  ArrowRight, 
  Download, 
  BookMarked, 
  Layers, 
  Loader2 
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { BOOKS_DATA } from '../data/booksData';
import { BookCover } from '../components/BookCover';
import { Badge } from '../components/Badge';
import { OrderService, BookService } from '../services/api';
import { OrderItem, Book } from '../types';

export const LibraryPage: React.FC = () => {
  const { 
    libraryItems = [], 
    purchaseHistory = [], 
    currentUser, 
    openReader, 
    navigateTo, 
    allBooks = [], 
    wishlistIds = [], 
    showToast 
  } = useApp();

  type TabType = 'all' | 'reading' | 'completed' | 'purchased' | 'downloaded' | 'bookmarked';
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [serverOrders, setServerOrders] = useState<OrderItem[]>([]);
  const [downloadingBookId, setDownloadingBookId] = useState<string | null>(null);

  const handleDownloadPurchased = async (book: Book) => {
    if (!currentUser) {
      showToast('Please login or register to download this book.', 'warning');
      navigateTo('login', { returnUrl: 'library' });
      return;
    }

    try {
      setDownloadingBookId(book.id);
      showToast(`Initiating download for "${book.title}"...`, 'info');
      await BookService.downloadBook(book);
      showToast(`Downloaded "${book.title}" successfully!`, 'success');
    } catch (err: any) {
      if (err.message?.includes('login') || err.message?.includes('register')) {
        showToast('Please login or register to download this book.', 'warning');
        navigateTo('login', { returnUrl: 'library' });
      } else {
        showToast(err.message || 'Download failed', 'warning');
      }
    } finally {
      setDownloadingBookId(null);
    }
  };

  const activeCatalog = allBooks.length > 0 ? allBooks : BOOKS_DATA;

  useEffect(() => {
    if (currentUser) {
      OrderService.getMyOrders()
        .then(orders => {
          setServerOrders(orders || []);
        })
        .catch(() => {});
    }
  }, [currentUser]);

  const readingItems = libraryItems.filter(item => item.status === 'reading' || (item.progress > 0 && item.progress < 100));
  const completedItems = libraryItems.filter(item => item.status === 'completed' || item.progress === 100);
  const bookmarkedItems = libraryItems.filter(item => item.status === 'bookmarked' || Boolean(item.note));

  const paidOrderBookIds = new Set([
    ...serverOrders.filter(o => o.paymentStatus === 'PAID').map(o => o.bookId),
    ...purchaseHistory.filter(p => p.status === 'Completed' || p.status === 'PAID').map(p => p.bookId)
  ]);
  const purchasedBooks = activeCatalog.filter(b => paidOrderBookIds.has(b.id));

  const downloadedBooks = activeCatalog.filter(b => (b.bookType || b.type) === 'FREE' || paidOrderBookIds.has(b.id)).slice(0, 6);

  const allLibraryBookIds = new Set([
    ...libraryItems.map(item => item.bookId),
    ...purchasedBooks.map(b => b.id),
    ...wishlistIds
  ]);
  const allLibraryBooks = activeCatalog.filter(b => allLibraryBookIds.has(b.id));

  const getBook = (bookId: string) => activeCatalog.find(b => b.id === bookId) || BOOKS_DATA.find(b => b.id === bookId) || BOOKS_DATA[0];

  const getItemProgress = (bookId: string) => {
    const item = libraryItems.find(i => i.bookId === bookId);
    return item ? item.progress : 0;
  };

  const getItemCurrentPage = (bookId: string) => {
    const item = libraryItems.find(i => i.bookId === bookId);
    return item ? (item.currentPage || 1) : 1;
  };

  if (!currentUser) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 flex items-center justify-center mx-auto">
          <BookMarked className="w-7 h-7" />
        </div>
        <h2 className="font-serif text-2xl font-bold text-slate-900 dark:text-white">
          Sign In Required
        </h2>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          Please sign in to access your personal reading bookshelf, study bookmarks, and reading progress.
        </p>
        <button
          type="button"
          onClick={() => navigateTo('login')}
          className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold cursor-pointer shadow-md"
        >
          Sign In to Student Account
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      {/* Bookshelf Header */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border border-slate-800">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-xl font-bold font-serif">
            {currentUser.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase font-mono tracking-wider text-indigo-300">
                Personal Bookshelf
              </span>
              <span className="text-white/40">•</span>
              <span className="text-xs text-white/70">
                {currentUser.role}
              </span>
            </div>
            <h1 className="text-xl sm:text-3xl font-bold tracking-tight text-white mt-0.5">
              {currentUser.name}'s Reading Library
            </h1>
            <p className="text-xs text-indigo-200 mt-0.5">
              Keep track of reading progress, completed chapters, purchased volumes, and bookmarks.
            </p>
          </div>
        </div>

        {/* Quick Stats Banner */}
        <div className="flex items-center gap-6 border-t md:border-t-0 md:border-l border-white/15 pt-4 md:pt-0 md:pl-6 text-center">
          <div>
            <span className="text-2xl font-bold tabular-nums text-white">
              {allLibraryBooks.length}
            </span>
            <p className="text-[11px] text-white/60">Total Books</p>
          </div>
          <div>
            <span className="text-2xl font-bold tabular-nums text-indigo-300">
              {readingItems.length}
            </span>
            <p className="text-[11px] text-white/60">Reading</p>
          </div>
          <div>
            <span className="text-2xl font-bold tabular-nums text-emerald-400">
              {completedItems.length}
            </span>
            <p className="text-[11px] text-white/60">Completed</p>
          </div>
          <div>
            <span className="text-2xl font-bold tabular-nums text-amber-400">
              {purchasedBooks.length}
            </span>
            <p className="text-[11px] text-white/60">Purchased</p>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-2 sm:gap-4 overflow-x-auto pb-1 text-xs sm:text-sm font-semibold scrollbar-none">
        <button
          type="button"
          onClick={() => setActiveTab('all')}
          className={`pb-3 whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'all'
              ? 'border-b-2 border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>All ({allLibraryBooks.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('reading')}
          className={`pb-3 whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'reading'
              ? 'border-b-2 border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Currently Reading ({readingItems.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('completed')}
          className={`pb-3 whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'completed'
              ? 'border-b-2 border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          <span>Completed ({completedItems.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('purchased')}
          className={`pb-3 whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'purchased'
              ? 'border-b-2 border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Receipt className="w-4 h-4 text-amber-500" />
          <span>Purchased ({purchasedBooks.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('downloaded')}
          className={`pb-3 whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'downloaded'
              ? 'border-b-2 border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Download className="w-4 h-4 text-blue-500" />
          <span>Downloaded ({downloadedBooks.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('bookmarked')}
          className={`pb-3 whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'bookmarked'
              ? 'border-b-2 border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Bookmark className="w-4 h-4 text-rose-500" />
          <span>Bookmarked ({bookmarkedItems.length})</span>
        </button>

        <button
          type="button"
          onClick={() => navigateTo('purchase-history')}
          className="pb-3 whitespace-nowrap text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer ml-auto text-xs"
        >
          <span>Invoices & Receipts</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Tab: ALL BOOKS */}
      {activeTab === 'all' && (
        <div className="space-y-6">
          {allLibraryBooks.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {allLibraryBooks.map(b => {
                const progress = getItemProgress(b.id);
                const currentPage = getItemCurrentPage(b.id);
                const totalPages = b.pages || 200;

                return (
                  <div
                    key={b.id}
                    className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between space-y-4"
                  >
                    <div className="flex gap-4">
                      <div 
                        onClick={() => openReader(b, currentPage)}
                        className="w-16 sm:w-20 shrink-0 cursor-pointer rounded-lg overflow-hidden shadow-xs"
                      >
                        <BookCover book={b} size="sm" showSpine={false} />
                      </div>

                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 truncate">
                            {b.category}
                          </span>
                          <Badge type={b.bookType || b.type} />
                        </div>

                        <h3
                          onClick={() => openReader(b, currentPage)}
                          className="text-sm font-bold text-slate-900 dark:text-white truncate cursor-pointer hover:text-indigo-600"
                        >
                          {b.title}
                        </h3>

                        <p className="text-xs text-slate-500 truncate">by {b.author}</p>

                        <div className="pt-2 space-y-1">
                          <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
                            <span>{progress}% read</span>
                            <span>Page {currentPage} of {totalPages}</span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full transition-all ${progress === 100 ? 'bg-emerald-500' : 'bg-indigo-600'}`}
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <button
                        type="button"
                        onClick={() => openReader(b, currentPage)}
                        className="flex-1 py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                      >
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>{progress > 0 && progress < 100 ? 'Continue Reading' : 'Read Now'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => navigateTo('book-detail', { bookId: b.id })}
                        className="py-2 px-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-medium cursor-pointer"
                      >
                        Details
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-16 px-4 bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 space-y-4 max-w-md mx-auto">
              <BookMarked className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto" />
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Your library is empty</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Discover your next great book across computer science textbooks and reference manuals.
                </p>
              </div>
              <button
                type="button"
                onClick={() => navigateTo('books')}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold cursor-pointer shadow-xs inline-flex items-center gap-1.5"
              >
                <span>Browse Books</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Tab: CURRENTLY READING */}
      {activeTab === 'reading' && (
        <div className="space-y-4">
          {readingItems.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {readingItems.map(item => {
                const book = getBook(item.bookId);
                const totalPages = book.pages || 200;
                const currentPage = item.currentPage || 1;
                const progress = item.progress || Math.round((currentPage / totalPages) * 100);

                return (
                  <div
                    key={item.id || item.bookId}
                    className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-4"
                  >
                    <div className="flex gap-4">
                      <div 
                        onClick={() => openReader(book, currentPage)}
                        className="w-16 shrink-0 cursor-pointer rounded-lg overflow-hidden shadow-xs"
                      >
                        <BookCover book={book} size="sm" showSpine={false} />
                      </div>

                      <div className="flex-1 min-w-0 space-y-1">
                        <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                          {book.category}
                        </span>
                        <h3
                          onClick={() => openReader(book, currentPage)}
                          className="text-sm font-bold text-slate-900 dark:text-white truncate cursor-pointer hover:text-indigo-600"
                        >
                          {book.title}
                        </h3>
                        <p className="text-xs text-slate-500 truncate">by {book.author}</p>

                        <div className="pt-2 space-y-1">
                          <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
                            <span>{progress}% read</span>
                            <span>Page {currentPage} of {totalPages}</span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-indigo-600 rounded-full transition-all"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => openReader(book, currentPage)}
                      className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>Continue Reading</span>
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-16 px-4 bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 space-y-4 max-w-md mx-auto">
              <BookOpen className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto" />
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">You haven't started reading yet</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Pick a title from the catalog and open the interactive browser reader to begin.
                </p>
              </div>
              <button
                type="button"
                onClick={() => navigateTo('books')}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold cursor-pointer shadow-xs inline-flex items-center gap-1.5"
              >
                <span>Find a Book</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Tab: COMPLETED */}
      {activeTab === 'completed' && (
        <div className="space-y-4">
          {completedItems.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {completedItems.map(item => {
                const book = getBook(item.bookId);
                return (
                  <div
                    key={item.id || item.bookId}
                    className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-4"
                  >
                    <div className="flex gap-4">
                      <div 
                        onClick={() => openReader(book)}
                        className="w-16 shrink-0 cursor-pointer rounded-lg overflow-hidden shadow-xs"
                      >
                        <BookCover book={book} size="sm" showSpine={false} />
                      </div>

                      <div className="flex-1 min-w-0 space-y-1">
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>100% Completed</span>
                        </span>
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                          {book.title}
                        </h3>
                        <p className="text-xs text-slate-500 truncate">by {book.author}</p>
                        <p className="text-[11px] text-slate-400 font-mono">Last read: {item.lastRead || 'Recently'}</p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => openReader(book)}
                      className="w-full py-2 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                    >
                      Read Again
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-16 px-4 bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 space-y-3 max-w-md mx-auto">
              <CheckCircle2 className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">No completed books yet</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Read all chapters of a book to mark it completed on your student profile.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Tab: PURCHASED */}
      {activeTab === 'purchased' && (
        <div className="space-y-4">
          {purchasedBooks.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {purchasedBooks.map(b => (
                <div
                  key={b.id}
                  className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-4"
                >
                  <div className="flex gap-4">
                    <div 
                      onClick={() => openReader(b)}
                      className="w-16 shrink-0 cursor-pointer rounded-lg overflow-hidden shadow-xs"
                    >
                      <BookCover book={b} size="sm" showSpine={false} />
                    </div>

                    <div className="flex-1 min-w-0 space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 dark:bg-emerald-950/80 px-2 py-0.5 rounded">
                        PURCHASED
                      </span>
                      <h3
                        onClick={() => openReader(b)}
                        className="text-sm font-bold text-slate-900 dark:text-white truncate cursor-pointer hover:text-indigo-600"
                      >
                        {b.title}
                      </h3>
                      <p className="text-xs text-slate-500 truncate">by {b.author}</p>
                      <p className="text-[11px] text-slate-400 font-mono">₹{b.price} · {b.pages} Pages</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => openReader(b)}
                      className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>Read Now</span>
                    </button>

                    {b.downloadAllowed !== false && (
                      <button
                        type="button"
                        onClick={() => handleDownloadPurchased(b)}
                        disabled={downloadingBookId === b.id}
                        className="py-2 px-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-colors disabled:opacity-60"
                        title="Download Book"
                      >
                        {downloadingBookId === b.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                        ) : (
                          <Download className="w-3.5 h-3.5 text-emerald-600" />
                        )}
                        <span>Download</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 px-4 bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 space-y-4 max-w-md mx-auto">
              <Receipt className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto" />
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">No purchased books yet</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  When you purchase premium editions, they will appear here with instant browser reading access.
                </p>
              </div>
              <button
                type="button"
                onClick={() => navigateTo('premium-books')}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold cursor-pointer shadow-xs"
              >
                Browse Premium Volumes
              </button>
            </div>
          )}
        </div>
      )}

      {/* Tab: DOWNLOADED */}
      {activeTab === 'downloaded' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {downloadedBooks.map(b => (
              <div
                key={b.id}
                className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-4"
              >
                <div className="flex gap-4">
                  <div 
                    onClick={() => openReader(b)}
                    className="w-16 shrink-0 cursor-pointer rounded-lg overflow-hidden shadow-xs"
                  >
                    <BookCover book={b} size="sm" showSpine={false} />
                  </div>

                  <div className="flex-1 min-w-0 space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 dark:bg-blue-950/80 px-2 py-0.5 rounded">
                      AVAILABLE OFFLINE
                    </span>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                      {b.title}
                    </h3>
                    <p className="text-xs text-slate-500 truncate">by {b.author}</p>
                    <p className="text-[11px] text-slate-400 font-mono">{b.pages} Pages · PDF/EPUB</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => openReader(b)}
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Open Offline Reader</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: BOOKMARKED */}
      {activeTab === 'bookmarked' && (
        <div className="space-y-4">
          {bookmarkedItems.length > 0 ? (
            <div className="space-y-4">
              {bookmarkedItems.map(item => {
                const book = getBook(item.bookId);
                return (
                  <div
                    key={item.id || item.bookId}
                    className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Bookmark className="w-4 h-4 text-indigo-600 fill-indigo-600" />
                        <span className="text-sm font-bold text-slate-900 dark:text-white">
                          {book.title}
                        </span>
                      </div>
                      <span className="text-xs text-slate-400 font-mono">Page {item.currentPage || 1}</span>
                    </div>

                    {item.note && (
                      <div className="p-3 bg-amber-50/60 dark:bg-amber-950/30 border-l-4 border-amber-500 rounded-r-xl text-xs text-amber-900 dark:text-amber-200 italic">
                        "{item.note}"
                      </div>
                    )}

                    <div className="flex justify-end gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => openReader(book, item.currentPage)}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold cursor-pointer shadow-xs"
                      >
                        Open in Reader
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-16 px-4 bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 space-y-3 max-w-md mx-auto">
              <Bookmark className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">No bookmarks saved yet</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Use the bookmark and note tools inside the reading viewer to save key study pages.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
