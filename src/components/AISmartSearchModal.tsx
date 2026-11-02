import React, { useState } from 'react';
import { Sparkles, Search, X, Loader2, AlertCircle } from 'lucide-react';
import { AIService, AISmartSearchResponse } from '../services/api';
import { BookCard } from './BookCard';

interface AISmartSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialQuery?: string;
}

const SAMPLE_NATURAL_QUERIES = [
  'I want a beginner cybersecurity book.',
  'Mujhe Python ki beginner level free book chahiye.',
  'Show premium AI books under ₹200.',
  'Books for learning database from basics.',
  'मराठीत मशीन लर्निंगचे पुस्तक दाखवा (Marathi)',
  'Fullstack web development with React & Node',
];

export const AISmartSearchModal: React.FC<AISmartSearchModalProps> = ({
  isOpen,
  onClose,
  initialQuery = '',
}) => {
  const [query, setQuery] = useState(initialQuery);
  const [searchResult, setSearchResult] = useState<AISmartSearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  if (!isOpen) return null;

  const handleSearch = async (queryText?: string) => {
    const q = (queryText || query).trim();
    if (!q) return;

    if (queryText) setQuery(queryText);
    setLoading(true);
    setSearched(true);

    try {
      const res = await AIService.smartSearch(q);
      setSearchResult(res);
    } catch {
      setSearchResult({
        books: [],
        intent: {
          query: q,
          explanation: 'AI search error. Please try normal keyword search.',
        },
        aiPowered: false,
        message: 'Could not connect to AI search engine.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-12 sm:pt-20 bg-black/75 backdrop-blur-sm overflow-y-auto animate-fade-in">
      <div className="w-full max-w-4xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[90vh]">
        {/* Header with Search Input */}
        <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/90 shrink-0">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-xs">
                <Sparkles className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white text-lg">
                AI Smart Search
              </h3>
              <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300 font-medium">
                Natural Language
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Search Input */}
          <form
            onSubmit={e => {
              e.preventDefault();
              handleSearch();
            }}
            className="relative flex items-center"
          >
            <Search className="absolute left-4 w-5 h-5 text-slate-400" />
            <input
              type="text"
              autoFocus
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Ask in natural language (e.g., 'Mujhe Python ki beginner free book chahiye', 'AI books under ₹200')..."
              className="w-full pl-11 pr-28 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-xs"
            />
            <button
              type="submit"
              disabled={!query.trim() || loading}
              className="absolute right-2 px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs flex items-center gap-1 transition-colors disabled:opacity-50 shadow-xs"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Ask AI</span>
                </>
              )}
            </button>
          </form>

          {/* Prompt Suggestion Chips */}
          <div className="mt-3 flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
            <span className="text-[11px] text-slate-500 shrink-0 flex items-center gap-1">
              Try:
            </span>
            {SAMPLE_NATURAL_QUERIES.map((sample, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSearch(sample)}
                className="px-2.5 py-1 text-xs rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-indigo-500 dark:hover:border-indigo-400 hover:text-indigo-600 transition-colors whitespace-nowrap shadow-2xs"
              >
                {sample}
              </button>
            ))}
          </div>
        </div>

        {/* Content & Results Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {loading && (
            <div className="py-16 flex flex-col items-center justify-center text-center">
              <Loader2 className="w-8 h-8 text-indigo-600 dark:text-indigo-400 animate-spin mb-3" />
              <h4 className="font-semibold text-slate-900 dark:text-white text-sm">
                Interpreting Natural Language & Filtering Catalog...
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm">
                Gemini AI is analyzing topic semantics, difficulty, language, and budget constraints across the bookstore.
              </p>
            </div>
          )}

          {!loading && searched && searchResult && (
            <div className="space-y-6">
              {/* AI Interpreted Query Card */}
              <div className="p-4 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/50 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-indigo-700 dark:text-indigo-400 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" /> AI Interpretation
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    {searchResult.books.length} matching library titles
                  </span>
                </div>
                <p className="text-sm text-indigo-950 dark:text-indigo-200 font-medium">
                  {searchResult.intent.explanation}
                </p>

                {/* Filter Tags */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {searchResult.intent.category && (
                    <span className="px-2 py-0.5 rounded-md text-[11px] bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-medium">
                      Category: {searchResult.intent.category}
                    </span>
                  )}
                  {searchResult.intent.language && (
                    <span className="px-2 py-0.5 rounded-md text-[11px] bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-medium">
                      Language: {searchResult.intent.language}
                    </span>
                  )}
                  {searchResult.intent.isFree !== undefined && (
                    <span className="px-2 py-0.5 rounded-md text-[11px] bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-medium">
                      {searchResult.intent.isFree ? 'Free E-Books' : 'Premium'}
                    </span>
                  )}
                  {searchResult.intent.maxPrice !== undefined && (
                    <span className="px-2 py-0.5 rounded-md text-[11px] bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 font-medium">
                      Budget: ≤ ₹{searchResult.intent.maxPrice}
                    </span>
                  )}
                </div>
              </div>

              {/* Matching Books Grid */}
              {searchResult.books.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {searchResult.books.map(book => (
                    <div key={book.id} onClick={onClose}>
                      <BookCard book={book} />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 px-4 text-center bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
                  <AlertCircle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                  <h4 className="font-semibold text-slate-900 dark:text-white text-sm">
                    No matching books were found in the current library.
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                    Try broadening your topic keywords or search for categories like Computer Science, Web Development, Programming, or Database.
                  </p>
                </div>
              )}
            </div>
          )}

          {!searched && (
            <div className="py-12 text-center text-slate-500 dark:text-slate-400">
              <div className="w-12 h-12 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto mb-3">
                <Sparkles className="w-6 h-6" />
              </div>
              <h4 className="font-semibold text-slate-900 dark:text-white text-sm">
                Discover Books with Natural Conversation
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
                Type queries naturally in English, Hindi, Hinglish, or Marathi. AI matches your intent directly with real e-books from the catalog.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
