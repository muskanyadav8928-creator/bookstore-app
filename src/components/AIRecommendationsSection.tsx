import React, { useState, useEffect } from 'react';
import { Sparkles, HelpCircle, Loader2 } from 'lucide-react';
import { AIService, AIRecommendationItem } from '../services/api';
import { useApp } from '../context/AppContext';
import { BookCard } from './BookCard';

interface AIRecommendationsSectionProps {
  title?: string;
  subtitle?: string;
  currentBookId?: string;
  limit?: number;
}

export const AIRecommendationsSection: React.FC<AIRecommendationsSectionProps> = ({
  title = 'Recommended For You',
  subtitle = 'Smart discovery based on your reading progress, wishlist, and computer science topics.',
  currentBookId,
  limit = 6,
}) => {
  const { wishlistIds = [], libraryItems = [], purchaseHistory = [], allBooks = [] } = useApp();
  const [recommendations, setRecommendations] = useState<AIRecommendationItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [aiPowered, setAiPowered] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;

    async function fetchRecs() {
      setLoading(true);
      try {
        const readBookIds = (libraryItems || []).map(item => item.bookId).filter(Boolean);
        const wishlistBookIds = (wishlistIds || []).filter(Boolean);
        const purchasedBookIds = (purchaseHistory || []).map(p => p.bookId).filter(Boolean);

        const preferredCategories: string[] = [];
        const allEngagedIds = [...readBookIds, ...wishlistBookIds, ...purchasedBookIds];
        for (const id of allEngagedIds) {
          const b = (allBooks || []).find(item => item.id === id);
          if (b?.category && !preferredCategories.includes(b.category)) {
            preferredCategories.push(b.category);
          }
        }

        const res = await AIService.getRecommendations({
          currentBookId,
          readBookIds,
          wishlistBookIds,
          purchasedBookIds,
          preferredCategories: preferredCategories.length > 0 ? preferredCategories : undefined,
          limit,
        });

        if (isMounted) {
          setRecommendations(res.recommendations || []);
          setAiPowered(Boolean(res.aiPowered));
        }
      } catch (err) {
        console.warn('Could not load AI recommendations:', err);
        if (isMounted) {
          setRecommendations([]);
          setAiPowered(false);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchRecs();

    return () => {
      isMounted = false;
    };
  }, [
    currentBookId,
    (wishlistIds || []).length,
    (libraryItems || []).length,
    (purchaseHistory || []).length,
    limit,
    (allBooks || []).length,
  ]);

  if (loading) {
    return (
      <div className="py-8">
        <div className="flex items-center space-x-2 mb-4">
          <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400 animate-pulse" />
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">{title}</h3>
        </div>
        <div className="flex items-center justify-center p-12 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800">
          <Loader2 className="w-6 h-6 text-indigo-600 dark:text-indigo-400 animate-spin mr-2" />
          <span className="text-sm text-slate-500 dark:text-slate-400">
            Analyzing student reading interests with Gemini AI...
          </span>
        </div>
      </div>
    );
  }

  if (recommendations.length === 0) {
    return null;
  }

  return (
    <div className="py-8 space-y-6">
      {/* Section Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
              {title}
            </h3>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            {subtitle}
          </p>
        </div>

        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-purple-50 text-purple-700 dark:bg-purple-950/80 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
          <Sparkles className="w-3 h-3 mr-1 text-purple-500" />
          {aiPowered ? 'Gemini 3.8 AI Ranked' : 'Catalog Smart Match'}
        </span>
      </div>

      {/* Grid of Recommended Books with "Why this book?" */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {recommendations.map(item => (
          <div key={item.book.id} className="flex flex-col">
            {/* Why This Book Explanation Pill */}
            <div className="mb-2 px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/50 flex items-start space-x-1.5 text-xs text-indigo-900 dark:text-indigo-300 shadow-xs">
              <HelpCircle className="w-3.5 h-3.5 text-indigo-500 mt-0.5 shrink-0" />
              <div className="min-w-0">
                <span className="font-semibold text-indigo-700 dark:text-indigo-400">Why this book? </span>
                <span className="line-clamp-2">{item.reason}</span>
              </div>
            </div>

            {/* Book Card */}
            <div className="flex-1">
              <BookCard book={item.book} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
