import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { CategoryCard } from '../components/CategoryCard';
import { useApp } from '../context/AppContext';

export const CategoriesPage: React.FC = () => {
  const { navigateTo, allCategories } = useApp();

  const totalBooksCount = allCategories.reduce((acc, c) => acc + (c.bookCount || 0), 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      {/* Header */}
      <div className="pb-6 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <button
            type="button"
            onClick={() => navigateTo('home')}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-600 mb-2 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Home</span>
          </button>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white">
            All Disciplines & Categories
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Browse through {allCategories.length} specialized academic domains curated for collegiate and professional study.
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigateTo('books')}
          className="px-4 py-2 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer shadow-xs self-start sm:self-auto"
        >
          View All Books ({totalBooksCount} total)
        </button>
      </div>

      {/* Grid of categories */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {allCategories.map(category => (
          <CategoryCard key={category.id || category.slug} category={category} />
        ))}
      </div>
    </div>
  );
};
