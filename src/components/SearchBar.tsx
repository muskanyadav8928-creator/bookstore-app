import React, { useState, useEffect } from 'react';
import { Search, X, Sparkles, Bot } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { AISmartSearchModal } from './AISmartSearchModal';

interface SearchBarProps {
  placeholder?: string;
  size?: 'normal' | 'large';
  autoFocus?: boolean;
  onSearchSubmit?: (query: string) => void;
  className?: string;
  instantUpdate?: boolean;
  showAskAI?: boolean;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  placeholder = 'Search books, authors, categories, tags...',
  size = 'normal',
  autoFocus = false,
  onSearchSubmit,
  className = '',
  instantUpdate = true,
  showAskAI = true,
}) => {
  const { searchQuery, setSearchQuery, navigateTo, activePage } = useApp();
  const [localQuery, setLocalQuery] = useState(searchQuery);
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);

  // Sync external search query changes into local input
  useEffect(() => {
    setLocalQuery(searchQuery);
  }, [searchQuery]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setLocalQuery(val);

    if (instantUpdate) {
      setSearchQuery(val);
      if (activePage !== 'books') {
        navigateTo('books', { query: val });
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchQuery(localQuery);
    if (onSearchSubmit) {
      onSearchSubmit(localQuery);
    } else {
      navigateTo('books', { query: localQuery });
    }
  };

  const handleClear = () => {
    setLocalQuery('');
    setSearchQuery('');
  };

  const handleAskAI = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsAIModalOpen(true);
  };

  const isLarge = size === 'large';

  return (
    <>
      <form onSubmit={handleSubmit} className={`relative w-full ${className}`}>
        <div
          className={`relative flex items-center w-full transition-all duration-200 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-transparent ${
            isLarge ? 'p-1.5 sm:p-2 shadow-lg shadow-indigo-500/5' : 'p-1'
          }`}
        >
          <div className="flex items-center justify-center pl-3 pr-2 text-slate-400 dark:text-slate-500 shrink-0">
            <Search className={isLarge ? 'w-6 h-6 text-indigo-600 dark:text-indigo-400' : 'w-4 h-4'} />
          </div>

          <input
            type="text"
            value={localQuery}
            onChange={handleChange}
            placeholder={placeholder}
            autoFocus={autoFocus}
            className={`w-full bg-transparent text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none ${
              isLarge ? 'text-base sm:text-lg py-2' : 'text-sm py-1.5'
            }`}
          />

          {localQuery && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
              title="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          {/* Ask AI Action Button */}
          {showAskAI && (
            <button
              type="button"
              onClick={handleAskAI}
              className={`mr-1.5 shrink-0 rounded-lg border border-purple-200 dark:border-purple-800 bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/80 dark:hover:bg-purple-900 text-purple-700 dark:text-purple-300 font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
                isLarge ? 'px-3 py-2 text-xs sm:text-sm' : 'px-2 py-1 text-xs'
              }`}
              title="Search with Natural Language AI (English, Hindi, Marathi)"
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-500" />
              <span className="font-semibold">Ask AI</span>
            </button>
          )}

          <button
            type="submit"
            className={`shrink-0 font-medium transition-colors rounded-lg flex items-center justify-center cursor-pointer ${
              isLarge
                ? 'px-5 py-2.5 sm:px-6 sm:py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-sm sm:text-base font-semibold shadow-sm'
                : 'px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs'
            }`}
          >
            <span>Search</span>
          </button>
        </div>

        {isLarge && (
          <div className="flex flex-wrap items-center justify-between gap-2 mt-3 text-xs text-slate-500 dark:text-slate-400">
            <div className="flex flex-wrap items-center gap-2">
              <span className="flex items-center gap-1 font-medium">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                Quick tags:
              </span>
              {['Python', 'Cybersecurity', 'Algorithms', 'React', 'Machine Learning', 'Database', 'SQL', 'Networking'].map(
                term => (
                  <button
                    key={term}
                    type="button"
                    onClick={() => {
                      setLocalQuery(term);
                      setSearchQuery(term);
                      navigateTo('books', { query: term });
                    }}
                    className="hover:text-indigo-600 dark:hover:text-indigo-400 underline underline-offset-2 transition-colors cursor-pointer"
                  >
                    {term}
                  </button>
                )
              )}
            </div>

            <button
              type="button"
              onClick={handleAskAI}
              className="text-indigo-600 dark:text-indigo-400 font-medium hover:underline flex items-center gap-1"
            >
              <Bot className="w-3.5 h-3.5" />
              <span>Try Natural Language Search →</span>
            </button>
          </div>
        )}
      </form>

      {/* Natural Language Smart Search Modal */}
      <AISmartSearchModal
        isOpen={isAIModalOpen}
        onClose={() => setIsAIModalOpen(false)}
        initialQuery={localQuery}
      />
    </>
  );
};
