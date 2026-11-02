import React, { useMemo } from 'react';
import { Sparkles, AlertCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { BookCard } from '../components/BookCard';
import { FilterBar } from '../components/FilterBar';
import { SearchBar } from '../components/SearchBar';

export const BooksPage: React.FC = () => {
  const { 
    allBooks,
    searchQuery, 
    setSearchQuery, 
    selectedCategory, 
    setSelectedCategory,
    selectedType,
    setSelectedType,
    selectedLanguage,
    setSelectedLanguage,
    sortBy,
    setSortBy,
    resetAllFilters
  } = useApp();

  const filteredBooks = useMemo(() => {
    let result = [...allBooks];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(b => {
        const titleMatch = b.title.toLowerCase().includes(q);
        const authorMatch = b.author.toLowerCase().includes(q);
        const categoryMatch = b.category.toLowerCase().includes(q);
        const tagsMatch = b.tags && b.tags.some(tag => tag.toLowerCase().includes(q));
        const descMatch = b.description.toLowerCase().includes(q);
        return titleMatch || authorMatch || categoryMatch || tagsMatch || descMatch;
      });
    }

    if (selectedCategory !== 'ALL') {
      const targetCat = selectedCategory.toLowerCase().trim();
      result = result.filter(b => 
        b.category.toLowerCase().trim() === targetCat ||
        (targetCat === 'ai' && b.category.toLowerCase().includes('artificial intelligence'))
      );
    }

    if (selectedType !== 'ALL') {
      result = result.filter(b => b.type === selectedType);
    }

    if (selectedLanguage !== 'ALL') {
      result = result.filter(
        b => b.language.toLowerCase() === selectedLanguage.toLowerCase()
      );
    }

    switch (sortBy) {
      case 'latest':
        result.sort((a, b) => new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime());
        break;
      case 'popular':
        result.sort((a, b) => (b.views + b.downloads) - (a.views + a.downloads));
        break;
      case 'rating':
        result.sort((a, b) => b.rating - a.rating);
        break;
      case 'price-asc':
        result.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        result.sort((a, b) => b.price - a.price);
        break;
      case 'title-az':
        result.sort((a, b) => a.title.localeCompare(b.title));
        break;
    }

    return result;
  }, [allBooks, searchQuery, selectedCategory, selectedType, selectedLanguage, sortBy]);

  const hasActiveFilters = 
    searchQuery.trim() !== '' || 
    selectedCategory !== 'ALL' || 
    selectedType !== 'ALL' || 
    selectedLanguage !== 'ALL' || 
    sortBy !== 'latest';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Centralized Catalog Directory</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mt-1">
            {selectedType === 'FREE' ? 'Free Books' : selectedType === 'PREMIUM' ? 'Premium Books' : 'All Books'}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Browse {allBooks.length} curated college-level technical volumes, textbooks, and engineering companions.
          </p>
        </div>

        {/* Quick Search inside Books page */}
        <div className="w-full md:w-80">
          <SearchBar
            placeholder="Search title, author, category, tags..."
            onSearchSubmit={q => setSearchQuery(q)}
            instantUpdate={true}
          />
        </div>
      </div>

      {/* Filter and Controls Toolbar */}
      <FilterBar
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        selectedType={selectedType}
        onTypeChange={setSelectedType}
        selectedLanguage={selectedLanguage}
        onLanguageChange={setSelectedLanguage}
        sortBy={sortBy}
        onSortChange={setSortBy}
        onResetFilters={resetAllFilters}
        resultsCount={filteredBooks.length}
      />

      {/* Active Filter Tags */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="text-slate-500 dark:text-slate-400 font-medium">Active Filters:</span>
          {searchQuery && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-medium">
              Search: "{searchQuery}"
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="hover:text-indigo-900 dark:hover:text-white ml-1 cursor-pointer font-bold"
              >
                ×
              </button>
            </span>
          )}
          {selectedCategory !== 'ALL' && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium">
              Category: {selectedCategory}
              <button
                type="button"
                onClick={() => setSelectedCategory('ALL')}
                className="hover:text-slate-900 dark:hover:text-white ml-1 cursor-pointer font-bold"
              >
                ×
              </button>
            </span>
          )}
          {selectedType !== 'ALL' && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium">
              Type: {selectedType}
              <button
                type="button"
                onClick={() => setSelectedType('ALL')}
                className="hover:text-slate-900 dark:hover:text-white ml-1 cursor-pointer font-bold"
              >
                ×
              </button>
            </span>
          )}
          {selectedLanguage !== 'ALL' && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium">
              Language: {selectedLanguage}
              <button
                type="button"
                onClick={() => setSelectedLanguage('ALL')}
                className="hover:text-slate-900 dark:hover:text-white ml-1 cursor-pointer font-bold"
              >
                ×
              </button>
            </span>
          )}
          {sortBy !== 'latest' && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium">
              Sort: {sortBy}
              <button
                type="button"
                onClick={() => setSortBy('latest')}
                className="hover:text-slate-900 dark:hover:text-white ml-1 cursor-pointer font-bold"
              >
                ×
              </button>
            </span>
          )}
        </div>
      )}

      {/* Results Count Summary Banner */}
      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
        <p>
          <strong className="text-slate-900 dark:text-white tabular-nums font-semibold">{filteredBooks.length}</strong> {filteredBooks.length === 1 ? 'book' : 'books'} found
          {searchQuery && <span> for "<span className="text-indigo-600 dark:text-indigo-400 font-semibold">{searchQuery}</span>"</span>}
        </p>
      </div>

      {/* Book Grid or Empty State */}
      {filteredBooks.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredBooks.map(book => (
            <BookCard key={book.id} book={book} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 px-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 max-w-lg mx-auto space-y-4">
          <div className="w-14 h-14 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
            <AlertCircle className="w-7 h-7 text-indigo-500" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              No books found. Try another search.
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
              We couldn't find any books matching your current filters or search terms. Try clearing active filters or searching for terms like "Python", "React", "Cybersecurity", or "SQL".
            </p>
          </div>
          <button
            type="button"
            onClick={resetAllFilters}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold cursor-pointer shadow-sm transition-all"
          >
            Clear Filters
          </button>
        </div>
      )}
    </div>
  );
};
