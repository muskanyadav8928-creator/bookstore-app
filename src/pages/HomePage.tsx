import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  ArrowRight, 
  Sparkles, 
  CheckCircle2, 
  Layers, 
  Compass, 
  Star, 
  Flame, 
  BookMarked, 
  Heart, 
  Receipt, 
  BarChart3 
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { BOOKS_DATA } from '../data/booksData';
import { CATEGORIES_DATA } from '../data/categoriesData';
import { BookCard } from '../components/BookCard';
import { CategoryCard } from '../components/CategoryCard';
import { SearchBar } from '../components/SearchBar';
import { BookCover } from '../components/BookCover';
import { BookService } from '../services/api';
import { AIRecommendationsSection } from '../components/AIRecommendationsSection';

export const HomePage: React.FC = () => {
  const { 
    navigateTo, 
    setSelectedType, 
    currentUser, 
    libraryItems = [], 
    wishlistIds = [], 
    purchaseHistory = [], 
    openReader, 
    allBooks = [] 
  } = useApp();

  const [continueReadingList, setContinueReadingList] = useState<any[]>([]);

  const activeCatalog = allBooks.length > 0 ? allBooks : BOOKS_DATA;

  useEffect(() => {
    if (currentUser) {
      BookService.getContinueReading()
        .then(data => {
          if (data && data.length > 0) {
            setContinueReadingList(data);
          } else {
            const inProgress = libraryItems
              .filter(item => item.progress > 0 && item.progress < 100)
              .map(item => {
                const book = activeCatalog.find(b => b.id === item.bookId);
                return {
                  ...item,
                  percentage: item.progress,
                  book,
                };
              })
              .filter(i => i.book);
            setContinueReadingList(inProgress);
          }
        })
        .catch(() => {
          const inProgress = libraryItems
            .filter(item => item.progress > 0 && item.progress < 100)
            .map(item => {
              const book = activeCatalog.find(b => b.id === item.bookId);
              return {
                ...item,
                percentage: item.progress,
                book,
              };
            })
            .filter(i => i.book);
          setContinueReadingList(inProgress);
        });
    } else {
      setContinueReadingList([]);
    }
  }, [currentUser, libraryItems, activeCatalog]);

  const freeBooks = activeCatalog.filter(b => (b.bookType || b.type) === 'FREE').slice(0, 4);
  const premiumBooks = activeCatalog.filter(b => (b.bookType || b.type) === 'PREMIUM').slice(0, 4);
  const popularBooks = [...activeCatalog]
    .sort((a, b) => ((b.views || 0) + (b.downloads || 0) * 2 + (b.rating || 0) * 50) - ((a.views || 0) + (a.downloads || 0) * 2 + (a.rating || 0) * 50))
    .slice(0, 4);
  const recentBooks = [...activeCatalog]
    .sort((a, b) => new Date(b.dateAdded || 0).getTime() - new Date(a.dateAdded || 0).getTime())
    .slice(0, 6);

  const readingCount = libraryItems.filter(item => item.status === 'reading' || (item.progress > 0 && item.progress < 100)).length;
  const completedCount = libraryItems.filter(item => item.status === 'completed' || item.progress === 100).length;
  const purchasedCount = purchaseHistory.filter(p => p.status === 'Completed' || p.status === 'PAID').length;
  const totalPagesRead = libraryItems.reduce((acc, item) => acc + (item.currentPage || Math.round(((item.progress || 0) / 100) * 200)), 0);
  const estimatedReadingMinutes = Math.round(totalPagesRead * 2.2);

  const heroLeadBook = activeCatalog[0] || BOOKS_DATA[0];
  const heroSecondaryBook = activeCatalog[4] || BOOKS_DATA[4];
  const heroThirdBook = activeCatalog[1] || BOOKS_DATA[1];

  return (
    <div className="space-y-12 sm:space-y-16 pb-16">
      {/* SECTION 1: DASHBOARD WELCOME / SPOTLIGHT */}
      {currentUser ? (
        <section className="bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-900 text-white border-b border-indigo-950/80">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-xs font-semibold text-indigo-300">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Personal Digital Library Dashboard</span>
                </div>
                <h1 className="font-serif text-2xl sm:text-4xl font-bold tracking-tight text-white">
                  Welcome back, {currentUser.name.split(' ')[0]}
                </h1>
                <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
                  Continue your reading journey and discover something new across computer science, software engineering, and artificial intelligence.
                </p>

                <div className="flex flex-wrap items-center gap-2 pt-2">
                  <a
                    href="#continue-reading"
                    className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-medium text-white transition-colors cursor-pointer border border-white/10"
                  >
                    Continue Reading ({readingCount})
                  </a>
                  <a
                    href="#recommended-for-you"
                    className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-medium text-white transition-colors cursor-pointer border border-white/10"
                  >
                    Recommended For You
                  </a>
                  <a
                    href="#popular-books"
                    className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-medium text-white transition-colors cursor-pointer border border-white/10"
                  >
                    Popular Books
                  </a>
                  <a
                    href="#recently-added"
                    className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-medium text-white transition-colors cursor-pointer border border-white/10"
                  >
                    Recently Added
                  </a>
                </div>
              </div>

              <div className="w-full lg:w-auto p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-lg shadow-md shrink-0">
                  {currentUser.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 pr-4">
                  <p className="text-xs font-bold text-white truncate">{currentUser.name}</p>
                  <p className="text-[11px] text-slate-300 truncate">{currentUser.email}</p>
                  <span className="inline-block mt-1 text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/30 text-indigo-200 border border-indigo-400/20 font-bold uppercase">
                    {currentUser.role} · CS Scholar
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => navigateTo('library')}
                  className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shrink-0 cursor-pointer shadow-xs transition-colors"
                >
                  My Bookshelf
                </button>
              </div>
            </div>
          </div>
        </section>
      ) : (
        <section className="relative overflow-hidden bg-gradient-to-b from-indigo-50/50 via-white to-white dark:from-slate-950 dark:via-slate-900 dark:to-slate-900 border-b border-slate-200/80 dark:border-slate-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20 lg:py-24">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-100/80 dark:bg-indigo-950/80 border border-indigo-200 dark:border-indigo-800/80 text-xs font-semibold text-indigo-700 dark:text-indigo-300">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Modern Digital Library & Academic Book Platform</span>
                </div>

                <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-slate-950 dark:text-white leading-[1.15] text-balance">
                  Discover Your Next Great Book
                </h1>

                <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-xl mx-auto lg:mx-0 leading-relaxed">
                  Explore free open-access textbooks and premium computer science references in a single unified digital library. Instant reading in your browser.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => navigateTo('books')}
                    className="w-full sm:w-auto px-6 py-3.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-semibold rounded-xl text-sm shadow-md shadow-indigo-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Compass className="w-4 h-4" />
                    <span>Browse Books</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedType('FREE');
                      navigateTo('books');
                    }}
                    className="w-full sm:w-auto px-6 py-3.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-white font-semibold rounded-xl text-sm border border-slate-200 dark:border-slate-700 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                  >
                    <BookOpen className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>Explore Free Books (₹0)</span>
                  </button>
                </div>

                <div className="pt-4 flex flex-wrap items-center justify-center lg:justify-start gap-4 sm:gap-6 text-xs text-slate-500 dark:text-slate-400">
                  <span className="flex items-center gap-1.5 font-medium">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    Curated CS Curriculum
                  </span>
                  <span className="flex items-center gap-1.5 font-medium">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    Interactive PDF Reader
                  </span>
                  <span className="flex items-center gap-1.5 font-medium">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    Instant Library Sync
                  </span>
                </div>
              </div>

              <div className="lg:col-span-5 flex justify-center items-center relative">
                <div className="relative w-full max-w-[340px] sm:max-w-[420px] flex justify-center items-center py-6">
                  <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/20 to-purple-500/20 rounded-full blur-3xl -z-10" />
                  <div className="hidden sm:block absolute -left-4 top-8 -rotate-12 scale-85 opacity-70 hover:opacity-100 hover:z-20 transition-all duration-300">
                    <BookCover book={heroSecondaryBook} size="sm" />
                  </div>
                  <div className="hidden sm:block absolute -right-4 top-12 rotate-12 scale-85 opacity-70 hover:opacity-100 hover:z-20 transition-all duration-300">
                    <BookCover book={heroThirdBook} size="sm" />
                  </div>
                  <div className="relative z-10 scale-100 sm:scale-105 shadow-2xl transition-transform duration-300 hover:scale-110">
                    <BookCover book={heroLeadBook} size="hero" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* SECTION 2: MY LIBRARY SUMMARY */}
      {currentUser && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            <div 
              onClick={() => navigateTo('library')}
              className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs hover:border-indigo-300 dark:hover:border-indigo-800 transition-all cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  In Library
                </span>
                <BookMarked className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div className="text-2xl font-bold text-slate-900 dark:text-white mt-2 tabular-nums">
                {libraryItems.length} <span className="text-xs font-normal text-slate-400">Books</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">Saved on bookshelf</p>
            </div>

            <div 
              onClick={() => navigateTo('library')}
              className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs hover:border-indigo-300 dark:hover:border-indigo-800 transition-all cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                  Reading
                </span>
                <BookOpen className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mt-2 tabular-nums">
                {readingCount} <span className="text-xs font-normal text-slate-400">Active</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">In progress</p>
            </div>

            <div 
              onClick={() => navigateTo('library')}
              className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs hover:border-emerald-300 dark:hover:border-emerald-800 transition-all cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  Completed
                </span>
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-2 tabular-nums">
                {completedCount} <span className="text-xs font-normal text-slate-400">Finished</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">100% read</p>
            </div>

            <div 
              onClick={() => navigateTo('wishlist')}
              className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs hover:border-rose-300 dark:hover:border-rose-800 transition-all cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
                  Wishlist
                </span>
                <Heart className="w-4 h-4 text-rose-500 fill-rose-500/20" />
              </div>
              <div className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-2 tabular-nums">
                {wishlistIds.length} <span className="text-xs font-normal text-slate-400">Saved</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">Bookmarked for later</p>
            </div>

            <div 
              onClick={() => navigateTo('purchase-history')}
              className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs hover:border-amber-300 dark:hover:border-amber-800 transition-all cursor-pointer col-span-2 sm:col-span-1"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                  Purchased
                </span>
                <Receipt className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-2 tabular-nums">
                {purchasedCount} <span className="text-xs font-normal text-slate-400">Paid</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">Premium unlocked</p>
            </div>
          </div>
        </section>
      )}

      {/* SECTION 3: CONTINUE READING */}
      <section id="continue-reading" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-6 sm:p-7 rounded-3xl bg-gradient-to-r from-indigo-900/10 via-purple-900/5 to-slate-900/10 border border-indigo-200/90 dark:border-indigo-900/50 shadow-xs">
          <div className="flex items-center justify-between mb-5">
            <div>
              <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 text-xs font-bold uppercase tracking-wider">
                <BookOpen className="w-4 h-4" />
                <span>Active Reading Shelf</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight mt-0.5">
                Continue Reading
              </h2>
            </div>
            {currentUser && (
              <button
                type="button"
                onClick={() => navigateTo('library')}
                className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>View Full Library</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {continueReadingList.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {continueReadingList.slice(0, 3).map((item, idx) => {
                const b = item.book;
                if (!b) return null;
                const totalPages = b.pages || 200;
                const currentPage = item.currentPage || 1;
                const pct = item.percentage ?? Math.round((currentPage / totalPages) * 100);

                return (
                  <div
                    key={item.bookId || idx}
                    className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs flex items-center gap-4 hover:shadow-md transition-shadow"
                  >
                    <div 
                      onClick={() => openReader(b, currentPage)}
                      className="w-14 h-20 shrink-0 rounded-lg overflow-hidden shadow-xs border border-slate-100 dark:border-slate-800 cursor-pointer"
                    >
                      <BookCover book={b} size="sm" showSpine={false} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <h4 
                        onClick={() => openReader(b, currentPage)}
                        className="text-xs sm:text-sm font-bold truncate text-slate-900 dark:text-white cursor-pointer hover:text-indigo-600"
                      >
                        {b.title}
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                        {b.author}
                      </p>

                      <div className="mt-2 space-y-1">
                        <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
                          <span>Progress: {pct}%</span>
                          <span>Page {currentPage} of {totalPages}</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-indigo-600 rounded-full transition-all duration-300"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => openReader(b, currentPage)}
                        className="mt-3 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                      >
                        <BookOpen className="w-3 h-3" />
                        <span>Continue Reading</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-8 text-center bg-white/70 dark:bg-slate-900/60 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 space-y-3">
              <BookOpen className="w-10 h-10 text-slate-400 mx-auto" />
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">You haven't started reading yet</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Pick any book from our computer science catalog or free library to start reading directly in your browser.
                </p>
              </div>
              <button
                type="button"
                onClick={() => navigateTo('books')}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <span>Find a Book</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </section>

      {/* SECTION 4: SMART CATALOG SEARCH */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
            Smart Catalog Search & Discovery
          </h2>
          <p className="text-lg sm:text-2xl font-bold text-slate-900 dark:text-white mt-1">
            Search by Title, Author, Subject, ISBN, or Natural Language
          </p>
        </div>
        <SearchBar size="large" placeholder="Search (e.g. 'books for learning Python', 'Algorithms in Hindi', 'Database')..." />
      </section>

      {/* SECTION 5: RECOMMENDED FOR YOU */}
      <section id="recommended-for-you" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <AIRecommendationsSection
          title="Recommended For You"
          subtitle="Smart recommendations personalized from your reading topics, wishlist, and student disciplines."
          limit={6}
        />
      </section>

      {/* SECTION 6: CURATED CATEGORIES */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between mb-6 gap-4">
          <div>
            <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 text-xs font-bold uppercase tracking-wider">
              <Layers className="w-4 h-4" />
              <span>Core Disciplines</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight mt-1">
              Explore by Category
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Curated computer science curriculum subjects tailored for college coursework and professional mastery.
            </p>
          </div>

          <button
            type="button"
            onClick={() => navigateTo('categories')}
            className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 flex items-center gap-1 cursor-pointer"
          >
            <span>View All Categories</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {CATEGORIES_DATA.map(category => (
            <CategoryCard key={category.id} category={category} />
          ))}
        </div>
      </section>

      {/* SECTION 7: FREE BOOKS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-6 sm:p-8 rounded-3xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-800/50">
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between mb-6 gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-300 text-xs font-bold uppercase tracking-wider mb-2">
                <BookOpen className="w-3.5 h-3.5" />
                <span>Open-Access Learning</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                Free Books
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1 max-w-xl">
                Read directly in your browser with zero paywalls. Free textbooks supported by academic open educational initiatives.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setSelectedType('FREE');
                navigateTo('books');
              }}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            >
              <span>See All Free Books (₹0)</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {freeBooks.map(book => (
              <BookCard key={book.id} book={book} actionVariant="free" />
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 8: PREMIUM BOOKS COLLECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-6 sm:p-8 rounded-3xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-800/50">
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between mb-6 gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-100 dark:bg-amber-900 text-amber-900 dark:text-amber-200 text-xs font-bold uppercase tracking-wider mb-2">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Professional Reference Editions</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                Premium Collection
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1 max-w-xl">
                Comprehensive technical treatises, deep-dive architecture manuals, and production code repositories.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setSelectedType('PREMIUM');
                navigateTo('books');
              }}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            >
              <span>See All Premium Books</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {premiumBooks.map(book => (
              <BookCard key={book.id} book={book} actionVariant="premium" />
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 9: POPULAR BOOKS */}
      <section id="popular-books" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between mb-6 gap-4">
          <div>
            <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 text-xs font-bold uppercase tracking-wider">
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
              <span>Community Favorites & Top Ranked</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight mt-1">
              Popular Books
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Most read, highly rated, and frequently referenced volumes by students and engineers.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              navigateTo('books', { sortBy: 'popular' });
            }}
            className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 flex items-center gap-1 cursor-pointer"
          >
            <span>View All Popular Books</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {popularBooks.map(book => (
            <BookCard key={book.id} book={book} />
          ))}
        </div>
      </section>

      {/* SECTION 10: RECENTLY ADDED */}
      <section id="recently-added" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between mb-6 gap-4">
          <div>
            <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400 text-xs font-bold uppercase tracking-wider">
              <Flame className="w-4 h-4 text-orange-500" />
              <span>Just Added to Catalog</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight mt-1">
              Recently Added Books
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              The latest additions to the library with publication and upload timestamps.
            </p>
          </div>

          <button
            type="button"
            onClick={() => navigateTo('books')}
            className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 flex items-center gap-1 cursor-pointer"
          >
            <span>Explore All Additions</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {recentBooks.map(book => (
            <BookCard key={book.id} book={book} showDate={true} />
          ))}
        </div>
      </section>

      {/* SECTION 11: READING ACTIVITY */}
      {currentUser && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Personal Reading Activity & Progress
                </h3>
              </div>
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Live Stats
              </span>
            </div>

            {libraryItems.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-center">
                  <span className="text-xs text-slate-500 block mb-1">Books Read</span>
                  <strong className="text-2xl font-bold text-slate-900 dark:text-white tabular-nums">
                    {completedCount}
                  </strong>
                  <span className="text-[11px] text-emerald-600 block mt-1">Completed</span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-center">
                  <span className="text-xs text-slate-500 block mb-1">Pages Read</span>
                  <strong className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 tabular-nums">
                    {totalPagesRead.toLocaleString()}
                  </strong>
                  <span className="text-[11px] text-slate-400 block mt-1">Study progress</span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-center">
                  <span className="text-xs text-slate-500 block mb-1">Reading Time</span>
                  <strong className="text-2xl font-bold text-purple-600 dark:text-purple-400 tabular-nums">
                    {estimatedReadingMinutes > 60 ? `${Math.floor(estimatedReadingMinutes / 60)}h ${estimatedReadingMinutes % 60}m` : `${estimatedReadingMinutes}m`}
                  </strong>
                  <span className="text-[11px] text-slate-400 block mt-1">Estimated pace</span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-center">
                  <span className="text-xs text-slate-500 block mb-1">In Progress</span>
                  <strong className="text-2xl font-bold text-amber-600 dark:text-amber-400 tabular-nums">
                    {readingCount}
                  </strong>
                  <span className="text-[11px] text-slate-400 block mt-1">Active shelf</span>
                </div>
              </div>
            ) : (
              <div className="py-6 text-center text-xs text-slate-500">
                No reading activity yet. Open any book to track your study progress and chapters.
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
};
