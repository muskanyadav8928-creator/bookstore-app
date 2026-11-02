import React, { useState, useMemo } from 'react';
import { ArrowLeft, Layers, BookOpen, RotateCcw } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { BookCard } from '../components/BookCard';
import { SortOption } from '../types';

export const CategoryDetailPage: React.FC = () => {
  const { selectedCategorySlug, selectedCategory, navigateTo, allBooks, allCategories } = useApp();
  const [filterType, setFilterType] = useState<'ALL' | 'FREE' | 'PREMIUM'>('ALL');
  const [filterLanguage, setFilterLanguage] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<SortOption>('rating');

  const category = (allCategories && allCategories.length > 0)
    ? (allCategories.find(
        c =>
          c.slug?.toLowerCase() === (selectedCategorySlug || '').toLowerCase() ||
          c.name?.toLowerCase() === (selectedCategory || '').toLowerCase()
      ) || allCategories[0])
    : { id: 'default', name: 'Computer Science', slug: 'computer-science', description: 'Academic books and resources.', icon: 'BookOpen', bookCount: 0 };

  const categoryBooks = useMemo(() => {
    let list = allBooks.filter(
      b => b.category.toLowerCase() === category.name.toLowerCase() ||
      (category.slug === 'artificial-intelligence' && b.category.toLowerCase().includes('artificial intelligence'))
    );

    if (filterType !== 'ALL') {
      list = list.filter(b => b.type === filterType);
    }

    if (filterLanguage !== 'ALL') {
      list = list.filter(b => b.language.toLowerCase() === filterLanguage.toLowerCase());
    }

    switch (sortBy) {
      case 'rating':
        list.sort((a, b) => b.rating - a.rating);
        break;
      case 'popular':
        list.sort((a, b) => (b.views + b.downloads) - (a.views + a.downloads));
        break;
      case 'latest':
        list.sort((a, b) => new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime());
        break;
      case 'price-asc':
        list.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        list.sort((a, b) => b.price - a.price);
        break;
      case 'title-az':
        list.sort((a, b) => a.title.localeCompare(b.title));
        break;
    }

    return list;
  }, [allBooks, category, filterType, filterLanguage, sortBy]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      {/* Back Link */}
      <div>
        <button
          type="button"
          onClick={() => navigateTo('categories')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-600 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to All Categories</span>
        </button>
      </div>

      {/* Category Hero Banner */}
      <div className="p-6 sm:p-8 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/60 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 text-xs font-bold uppercase tracking-wider">
            <Layers className="w-3.5 h-3.5" />
            <span>Category Catalog</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white">
            {category.name}
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            {category.description}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 text-center shrink-0 min-w-[140px] shadow-xs">
          <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 tabular-nums">
            {categoryBooks.length}
          </span>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {categoryBooks.length === 1 ? 'E-Book Available' : 'E-Books Available'}
          </p>
        </div>
      </div>

      {/* Filter and Sort Toolbar within Category */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Type:
            </span>
            <div className="inline-flex p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
              <button
                type="button"
                onClick={() => setFilterType('ALL')}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-all cursor-pointer ${
                  filterType === 'ALL'
                    ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-xs font-semibold'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setFilterType('FREE')}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                  filterType === 'FREE'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Free (₹0)
              </button>
              <button
                type="button"
                onClick={() => setFilterType('PREMIUM')}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                  filterType === 'PREMIUM'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Premium
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Language:
            </span>
            <select
              value={filterLanguage}
              onChange={e => setFilterLanguage(e.target.value)}
              className="text-xs font-medium bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Languages</option>
              <option value="English">English</option>
              <option value="Hindi">Hindi</option>
              <option value="Marathi">Marathi</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Sort By:
          </label>
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as SortOption)}
            className="text-xs font-medium bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
          >
            <option value="rating">Highest Rated</option>
            <option value="popular">Most Popular</option>
            <option value="latest">Latest</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="title-az">Title A-Z</option>
          </select>
        </div>
      </div>

      {/* Book Grid or Empty State */}
      {categoryBooks.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {categoryBooks.map(book => (
            <BookCard key={book.id} book={book} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 px-4 bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 max-w-md mx-auto space-y-4">
          <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              No {filterType !== 'ALL' ? filterType.toLowerCase() : ''} books found in {category.name}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Try switching your filter to "All" or exploring another category.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setFilterType('ALL');
              setFilterLanguage('ALL');
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold cursor-pointer shadow-xs"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Category Filters</span>
          </button>
        </div>
      )}
    </div>
  );
};
