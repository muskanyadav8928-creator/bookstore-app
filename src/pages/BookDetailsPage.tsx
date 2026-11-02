import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Heart, 
  Share2, 
  BookOpen, 
  Download, 
  ShoppingCart, 
  Star, 
  Globe, 
  Calendar, 
  FileText,
  Eye,
  CheckCircle2,
  Tag,
  Loader2,
  Sparkles,
  Bot,
  Lock,
  LogIn
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { BookCover } from '../components/BookCover';
import { Badge } from '../components/Badge';
import { BookService } from '../services/api';
import { AIBookAssistantModal } from '../components/AIBookAssistantModal';
import { AIBookSummaryCard } from '../components/AIBookSummaryCard';
import { AIBookDetailsChat } from '../components/AIBookDetailsChat';
import { AIRecommendationsSection } from '../components/AIRecommendationsSection';

export const BookDetailsPage: React.FC = () => {
  const { 
    selectedBookId, 
    allBooks,
    navigateTo, 
    isInWishlist, 
    toggleWishlist, 
    openReader, 
    openCheckout, 
    showToast, 
    refreshBooks, 
    currentUser, 
    purchaseHistory 
  } = useApp();

  const [activeTab, setActiveTab] = useState<'overview' | 'ai-chat' | 'ai-summary' | 'toc' | 'details'>('overview');
  const [downloading, setDownloading] = useState(false);
  const [hasPurchasedAccess, setHasPurchasedAccess] = useState(false);
  const [isAIAssistantOpen, setIsAIAssistantOpen] = useState(false);

  const book = allBooks.find(b => b.id === selectedBookId) || allBooks[0];
  const isWishlisted = isInWishlist(book.id);

  useEffect(() => {
    if (!book) return;
    if (book.type === 'FREE') {
      setHasPurchasedAccess(true);
      return;
    }
    if (currentUser?.role === 'ADMIN') {
      setHasPurchasedAccess(true);
      return;
    }
    const hasLocalOrder = purchaseHistory.some(p => p.bookId === book.id && (p.status === 'Completed' || p.status === 'PAID'));
    if (hasLocalOrder) {
      setHasPurchasedAccess(true);
      return;
    }

    BookService.getReaderInfo(book.id)
      .then(res => {
        setHasPurchasedAccess(Boolean(res.hasAccess));
      })
      .catch(() => {
        setHasPurchasedAccess(false);
      });
  }, [book?.id, currentUser, purchaseHistory]);

  useEffect(() => {
    if (book?.id) {
      BookService.recordBookView(book.id);
    }
  }, [book?.id]);

  const handleDownload = async () => {
    if (!currentUser) {
      showToast('Please login or register to download this book.', 'warning');
      navigateTo('login', { returnUrl: 'book-detail', bookId: book.id });
      return;
    }

    const isPremium = book.type === 'PREMIUM';
    if (isPremium && !hasPurchasedAccess && currentUser.role !== 'ADMIN') {
      showToast('Purchase this book to download it.', 'warning');
      openCheckout(book);
      return;
    }

    if (book.downloadAllowed === false) {
      showToast('Downloads are disabled for this publication by author/publisher.', 'warning');
      return;
    }

    try {
      setDownloading(true);
      showToast(`Initiating download for "${book.title}"...`, 'info');
      await BookService.downloadBook(book);
      showToast(`Downloaded "${book.title}" successfully!`, 'success');
      refreshBooks();
    } catch (err: any) {
      if (err.message?.includes('login') || err.message?.includes('register')) {
        showToast('Please login or register to download this book.', 'warning');
        navigateTo('login', { returnUrl: 'book-detail', bookId: book.id });
      } else {
        showToast(err.message || 'Download failed.', 'warning');
      }
    } finally {
      setDownloading(false);
    }
  };

  const handleShare = () => {
    try {
      navigator.clipboard?.writeText(window.location.href);
      showToast('Book link copied to clipboard!', 'info');
    } catch {
      showToast('Book link ready to share', 'info');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-12">
      {/* Navigation Breadcrumb */}
      <div>
        <button
          type="button"
          onClick={() => navigateTo('books')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-600 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to All Books</span>
        </button>
      </div>

      {/* Main Book Detail Showcase */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        {/* Left: Large Cover & Quick Actions */}
        <div className="lg:col-span-4 flex flex-col items-center">
          <div className="w-full max-w-[300px] sm:max-w-[340px] shadow-2xl rounded-lg p-3 bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 flex justify-center">
            <BookCover book={book} size="lg" />
          </div>

          {/* Quick buttons under cover */}
          <div className="w-full max-w-[340px] mt-4 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => toggleWishlist(book.id)}
              className={`flex-1 py-2 px-3 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                isWishlisted
                  ? 'border-rose-300 bg-rose-50 text-rose-600 dark:bg-rose-950 dark:border-rose-800'
                  : 'border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
              }`}
            >
              <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-current text-rose-500' : ''}`} />
              <span>{isWishlisted ? 'Saved in Wishlist' : 'Add to Wishlist'}</span>
            </button>

            <button
              type="button"
              onClick={handleShare}
              className="p-2 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
              title="Share Book Link"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>

          {/* Views & Downloads Counters */}
          <div className="w-full max-w-[340px] mt-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 grid grid-cols-2 gap-2 text-center text-xs">
            <div className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
              <div className="flex items-center justify-center gap-1 text-slate-500 dark:text-slate-400 mb-0.5">
                <Eye className="w-3.5 h-3.5 text-indigo-500" />
                <span className="text-[11px] font-medium">Views</span>
              </div>
              <strong className="text-slate-900 dark:text-white tabular-nums text-sm">
                {(book.views || 0).toLocaleString()}
              </strong>
            </div>
            <div className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
              <div className="flex items-center justify-center gap-1 text-slate-500 dark:text-slate-400 mb-0.5">
                <Download className="w-3.5 h-3.5 text-emerald-500" />
                <span className="text-[11px] font-medium">Downloads</span>
              </div>
              <strong className="text-slate-900 dark:text-white tabular-nums text-sm">
                {(book.downloads || 0).toLocaleString()}
              </strong>
            </div>
          </div>
        </div>

        {/* Right: Book Information & Contiguous Purchase Module */}
        <div className="lg:col-span-8 space-y-6">
          {/* Header Row */}
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                {book.category}
              </span>
              <span className="text-slate-300 dark:text-slate-700">•</span>
              <Badge type={book.type} />
              <span className="text-slate-300 dark:text-slate-700">•</span>
              <span className="text-xs text-slate-500 font-mono">ISBN: {book.isbn || '978-0-13-468599-1'}</span>
            </div>

            <h1 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 dark:text-white leading-tight">
              {book.title}
            </h1>

            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 mt-2 font-medium">
              Written by <strong className="text-slate-900 dark:text-white">{book.author}</strong>
            </p>
          </div>

          {/* Rating, Pages, Language, Publisher, Year Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-3 border-y border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300">
            <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-800/40">
              <Star className="w-4 h-4 fill-amber-400 text-amber-400 shrink-0" />
              <div>
                <span className="text-[10px] text-slate-400 block">Rating</span>
                <span className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm">
                  {(book.rating || 4.8).toFixed(1)} / 5.0
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-800/40">
              <FileText className="w-4 h-4 text-indigo-500 shrink-0" />
              <div>
                <span className="text-[10px] text-slate-400 block">Pages</span>
                <span className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm">
                  {book.pages} Pages
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-800/40">
              <Globe className="w-4 h-4 text-emerald-500 shrink-0" />
              <div>
                <span className="text-[10px] text-slate-400 block">Language</span>
                <span className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm">
                  {book.language}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-800/40">
              <Calendar className="w-4 h-4 text-purple-500 shrink-0" />
              <div>
                <span className="text-[10px] text-slate-400 block">Publication</span>
                <span className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm">
                  Year {book.publicationYear}
                </span>
              </div>
            </div>
          </div>

          {/* Price & Action Module */}
          <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs uppercase font-bold text-slate-400">Pricing & Access</span>
              <div className="flex items-baseline gap-2 mt-0.5">
                {book.type === 'FREE' ? (
                  <>
                    <span className="text-2xl sm:text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                      ₹0
                    </span>
                    <span className="text-xs font-semibold uppercase text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/80 px-2 py-0.5 rounded">
                      FREE E-BOOK
                    </span>
                  </>
                ) : (
                  <>
                    <span className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tabular-nums">
                      ₹{book.price}
                    </span>
                    <span className="text-xs font-semibold uppercase text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/80 px-2 py-0.5 rounded">
                      PREMIUM EDITION
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
              {/* Ask AI About This Book */}
              <button
                type="button"
                onClick={() => setIsAIAssistantOpen(true)}
                className="flex-1 sm:flex-none px-4 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold rounded-xl text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-md shadow-purple-500/20 transition-all cursor-pointer"
                title="Open interactive AI Reading Assistant for this book"
              >
                <Bot className="w-4 h-4" />
                <span>Ask AI About This Book</span>
              </button>

              {book.type === 'FREE' ? (
                <>
                  <button
                    type="button"
                    onClick={() => openReader(book)}
                    className="flex-1 sm:flex-none px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition-colors cursor-pointer"
                  >
                    <BookOpen className="w-4 h-4" />
                    <span>Read Now</span>
                  </button>

                  {book.downloadAllowed !== false && (
                    <button
                      type="button"
                      onClick={handleDownload}
                      disabled={downloading}
                      className={`flex-1 sm:flex-none px-4 py-3 border font-medium rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-60 ${
                        !currentUser
                          ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-200 border-amber-300 dark:border-amber-700 hover:bg-amber-100 dark:hover:bg-amber-900/50'
                          : 'bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-white border-slate-300 dark:border-slate-700'
                      }`}
                    >
                      {downloading ? (
                        <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                      ) : !currentUser ? (
                        <LogIn className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                      ) : (
                        <Download className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      )}
                      <span>
                        {downloading
                          ? 'Preparing...'
                          : !currentUser
                          ? 'Login to Download'
                          : 'Download'}
                      </span>
                    </button>
                  )}
                </>
              ) : hasPurchasedAccess ? (
                <>
                  <button
                    type="button"
                    onClick={() => openReader(book)}
                    className="flex-1 sm:flex-none px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition-colors cursor-pointer"
                  >
                    <BookOpen className="w-4 h-4" />
                    <span>Read Now</span>
                  </button>

                  {book.downloadAllowed !== false && (
                    <button
                      type="button"
                      onClick={handleDownload}
                      disabled={downloading}
                      className="flex-1 sm:flex-none px-4 py-3 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-white border border-slate-300 dark:border-slate-700 font-medium rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-60"
                    >
                      {downloading ? (
                        <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                      ) : (
                        <Download className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      )}
                      <span>{downloading ? 'Preparing...' : 'Download'}</span>
                    </button>
                  )}
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => openCheckout(book)}
                    className="flex-1 sm:flex-none px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-indigo-500/20 transition-colors cursor-pointer"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    <span>Buy Now (₹{book.price})</span>
                  </button>

                  {book.downloadAllowed !== false && (
                    <button
                      type="button"
                      onClick={handleDownload}
                      className="flex-1 sm:flex-none px-4 py-3 bg-amber-50 dark:bg-amber-950/30 hover:bg-amber-100 dark:hover:bg-amber-900/40 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800 font-medium rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
                    >
                      {!currentUser ? (
                        <LogIn className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                      ) : (
                        <Lock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                      )}
                      <span>{!currentUser ? 'Login to Download' : 'Purchase to Download'}</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => toggleWishlist(book.id)}
                    className="flex-1 sm:flex-none px-4 py-3 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-white border border-slate-300 dark:border-slate-700 font-medium rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-current text-rose-500' : ''}`} />
                    <span>{isWishlisted ? 'In Wishlist' : 'Add to Wishlist'}</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Tags list */}
          {book.tags && book.tags.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-xs font-semibold text-slate-400 flex items-center gap-1 mr-1">
                <Tag className="w-3.5 h-3.5" />
                Tags:
              </span>
              {book.tags.map(tag => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => navigateTo('books', { query: tag })}
                  className="px-2.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950 text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-300 text-xs transition-colors cursor-pointer"
                >
                  #{tag}
                </button>
              ))}
            </div>
          )}

          {/* Tab Navigation for Book Description, AI Summary, TOC, and Publication specs */}
          <div className="pt-2">
            <div className="flex border-b border-slate-200 dark:border-slate-800 gap-4 sm:gap-6 text-xs sm:text-sm overflow-x-auto no-scrollbar">
              <button
                type="button"
                onClick={() => setActiveTab('overview')}
                className={`pb-3 font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                  activeTab === 'overview'
                    ? 'border-b-2 border-indigo-600 text-indigo-600 dark:text-indigo-400'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Description & Overview
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('ai-chat')}
                className={`pb-3 font-semibold transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                  activeTab === 'ai-chat'
                    ? 'border-b-2 border-indigo-600 text-indigo-600 dark:text-indigo-400'
                    : 'text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400'
                }`}
              >
                <Bot className="w-3.5 h-3.5 text-indigo-500" />
                <span>AI Assistant Chat</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('ai-summary')}
                className={`pb-3 font-semibold transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                  activeTab === 'ai-summary'
                    ? 'border-b-2 border-purple-600 text-purple-600 dark:text-purple-400'
                    : 'text-slate-500 hover:text-purple-600 dark:hover:text-purple-400'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-purple-500" />
                <span>AI Summary</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('toc')}
                className={`pb-3 font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                  activeTab === 'toc'
                    ? 'border-b-2 border-indigo-600 text-indigo-600 dark:text-indigo-400'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Table of Contents ({book.chapters ? book.chapters.length : 3})
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('details')}
                className={`pb-3 font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                  activeTab === 'details'
                    ? 'border-b-2 border-indigo-600 text-indigo-600 dark:text-indigo-400'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Publisher & Citation
              </button>
            </div>

            {/* Tab 1: Overview */}
            {activeTab === 'overview' && (
              <div className="pt-4 space-y-4 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                <p>{book.description}</p>
                <p>
                  This curriculum volume includes practical sample code, algorithmic step-by-step proofs, and downloadable study exercises compatible with modern laboratory environments. Recommended for undergraduate examinations and capstone project preparations.
                </p>

                <div className="mt-4 p-4 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300">
                    Volume Highlights:
                  </h4>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <li className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Mathematical rigor and complexity proofs</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Production code samples and benchmarks</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Direct browser reading with zero downloads</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Interactive AI Book Assistant Q&A available</span>
                    </li>
                  </ul>
                </div>
              </div>
            )}

            {/* Tab 2: AI Book Assistant Interactive Chat */}
            {activeTab === 'ai-chat' && (
              <div className="pt-4">
                <AIBookDetailsChat book={book} />
              </div>
            )}

            {/* Tab 3: AI Summary */}
            {activeTab === 'ai-summary' && (
              <div className="pt-4">
                <AIBookSummaryCard book={book} />
              </div>
            )}

            {/* Tab 4: Table of Contents */}
            {activeTab === 'toc' && (
              <div className="pt-4 space-y-3">
                {(book.chapters || [
                  { id: '1', title: 'Chapter 1: Foundational Theories & Core Concepts', readTime: '12 min' },
                  { id: '2', title: 'Chapter 2: Structural Implementation & Paradigms', readTime: '16 min' },
                  { id: '3', title: 'Chapter 3: Advanced Optimization & Scaling', readTime: '15 min' },
                ]).map((ch, idx) => (
                  <div
                    key={ch.id}
                    className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                        {ch.title}
                      </span>
                    </div>
                    <span className="text-xs text-slate-400 font-mono">
                      {ch.readTime}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Tab 5: Publication & Citation */}
            {activeTab === 'details' && (
              <div className="pt-4 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60">
                    <span className="text-slate-400 block mb-0.5">Publisher</span>
                    <strong className="text-slate-800 dark:text-slate-200 text-sm">{book.publisher}</strong>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60">
                    <span className="text-slate-400 block mb-0.5">Publication Year</span>
                    <strong className="text-slate-800 dark:text-slate-200 text-sm">{book.publicationYear}</strong>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60">
                    <span className="text-slate-400 block mb-0.5">Edition</span>
                    <strong className="text-slate-800 dark:text-slate-200 text-sm">{book.edition || 'Student Edition'}</strong>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60">
                    <span className="text-slate-400 block mb-0.5">Digital Formats</span>
                    <strong className="text-slate-800 dark:text-slate-200 text-sm">PDF, EPUB, Web Reader</strong>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-mono text-slate-600 dark:text-slate-400">
                  <span className="block font-sans font-bold text-slate-800 dark:text-slate-200 mb-1">
                    IEEE Citation Reference:
                  </span>
                  {book.author}, "{book.title}," {book.edition || 'Student Ed.'}, {book.publisher}, {book.publicationYear}.
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* You May Also Like AI Recommendations */}
      <div className="pt-8 border-t border-slate-200 dark:border-slate-800">
        <AIRecommendationsSection
          currentBookId={book.id}
          title="You May Also Like"
          subtitle={`AI-curated recommendations based on "${book.title}", ${book.category}, and related CS subjects.`}
          limit={3}
        />
      </div>

      {/* Modal: AI Book Assistant */}
      <AIBookAssistantModal
        book={book}
        isOpen={isAIAssistantOpen}
        onClose={() => setIsAIAssistantOpen(false)}
      />
    </div>
  );
};
