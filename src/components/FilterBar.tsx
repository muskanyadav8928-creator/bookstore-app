import React from 'react';
import { RotateCcw } from 'lucide-react';
import { CATEGORIES_DATA } from '../data/categoriesData';
import { SortOption } from '../types';

interface FilterBarProps {
  selectedCategory: string;
  onCategoryChange: (cat: string) => void;
  selectedType: 'ALL' | 'FREE' | 'PREMIUM';
  onTypeChange: (type: 'ALL' | 'FREE' | 'PREMIUM') => void;
  selectedLanguage: string;
  onLanguageChange: (lang: string) => void;
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
  onResetFilters: () => void;
  resultsCount: number;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  selectedCategory,
  onCategoryChange,
  selectedType,
  onTypeChange,
  selectedLanguage,
  onLanguageChange,
  sortBy,
  onSortChange,
  onResetFilters,
  resultsCount,
}) => {
  const isFiltered =
    selectedCategory !== 'ALL' ||
    selectedType !== 'ALL' ||
    selectedLanguage !== 'ALL' ||
    sortBy !== 'latest';

  const filterCategories = [
    'Programming',
    'Computer Science',
    'Web Development',
    'Database',
    'Artificial Intelligence',
    'Machine Learning',
    'Cybersecurity',
    'Networking',
    'Data Science',
    'Software Engineering',
  ];

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Left: Filter Controls Grid */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Category Dropdown */}
          <div className="flex flex-col">
            <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wider">
              Category
            </label>
            <select
              value={selectedCategory}
              onChange={e => onCategoryChange(e.target.value)}
              className="text-xs font-medium bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="ALL">All Categories</option>
              {filterCategories.map(catName => {
                const found = CATEGORIES_DATA.find(c => c.name.toLowerCase() === catName.toLowerCase());
                return (
                  <option key={catName} value={catName}>
                    {catName} {found ? `(${found.bookCount})` : ''}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Type Segmented Filter */}
          <div className="flex flex-col">
            <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wider">
              Book Type
            </label>
            <div className="inline-flex p-1 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => onTypeChange('ALL')}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-all cursor-pointer ${
                  selectedType === 'ALL'
                    ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-xs font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => onTypeChange('FREE')}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                  selectedType === 'FREE'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-emerald-600'
                }`}
              >
                Free
              </button>
              <button
                type="button"
                onClick={() => onTypeChange('PREMIUM')}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                  selectedType === 'PREMIUM'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-amber-600'
                }`}
              >
                Premium
              </button>
            </div>
          </div>

          {/* Language Filter */}
          <div className="flex flex-col">
            <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wider">
              Language
            </label>
            <select
              value={selectedLanguage}
              onChange={e => onLanguageChange(e.target.value)}
              className="text-xs font-medium bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="ALL">All Languages</option>
              <option value="English">English</option>
              <option value="Hindi">Hindi</option>
              <option value="Marathi">Marathi</option>
            </select>
          </div>

          {/* Sort Dropdown */}
          <div className="flex flex-col">
            <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wider">
              Sorting
            </label>
            <select
              value={sortBy}
              onChange={e => onSortChange(e.target.value as SortOption)}
              className="text-xs font-medium bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="latest">Latest</option>
              <option value="popular">Most Popular</option>
              <option value="rating">Highest Rated</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="title-az">Title A-Z</option>
            </select>
          </div>
        </div>

        {/* Right: Results Count & Reset */}
        <div className="flex items-center gap-3 ml-auto">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
            <strong className="text-slate-900 dark:text-white tabular-nums font-bold text-sm">{resultsCount}</strong> {resultsCount === 1 ? 'book' : 'books'} found
          </span>

          {isFiltered && (
            <button
              type="button"
              onClick={onResetFilters}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/60 rounded-md transition-colors cursor-pointer"
              title="Clear all active filters"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Clear Filters</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
