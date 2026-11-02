import React from 'react';
import { Heart, Star, BookOpen, ArrowRight, ShoppingCart } from 'lucide-react';
import { Book } from '../types';
import { useApp } from '../context/AppContext';
import { BookCover } from './BookCover';
import { Badge } from './Badge';

interface BookCardProps {
  book: Book;
  showDate?: boolean;
  actionVariant?: 'default' | 'free' | 'premium';
}

export const BookCard: React.FC<BookCardProps> = ({
  book,
  showDate = false,
  actionVariant = 'default',
}) => {
  const { navigateTo, isInWishlist, toggleWishlist, openReader, openCheckout, purchaseHistory, currentUser } = useApp();
  const wishlisted = isInWishlist(book.id);

  const isPurchased = Boolean(
    currentUser &&
    (currentUser.role === 'ADMIN' || purchaseHistory.some(p => p.bookId === book.id && (p.status === 'Completed' || p.status === 'PAID')))
  );

  const handleCardClick = () => {
    navigateTo('book-detail', { bookId: book.id });
  };

  return (
    <div
      onClick={handleCardClick}
      className="group relative flex flex-col bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl p-3 sm:p-4 hover:shadow-xl hover:border-indigo-200 dark:hover:border-indigo-900/60 transition-all duration-200 cursor-pointer overflow-hidden"
    >
      {/* Top Cover Display */}
      <div className="relative w-full flex justify-center items-center py-2 sm:py-3 bg-slate-50 dark:bg-slate-950/50 rounded-lg overflow-hidden">
        <BookCover book={book} size="md" />

        {/* Wishlist Floating Button */}
        <button
          type="button"
          onClick={e => {
            e.stopPropagation();
            toggleWishlist(book.id);
          }}
          className={`absolute top-2 right-2 p-2 rounded-full backdrop-blur-md transition-all duration-150 z-20 cursor-pointer ${
            wishlisted
              ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/80 dark:text-rose-400 shadow-sm'
              : 'bg-white/80 dark:bg-slate-900/80 text-slate-500 hover:text-rose-600 dark:text-slate-300 dark:hover:text-rose-400'
          }`}
          aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          title={wishlisted ? 'In Wishlist' : 'Add to Wishlist'}
        >
          <Heart className={`w-4 h-4 ${wishlisted ? 'fill-current' : ''}`} />
        </button>

        {/* Quick Read Overlay Button */}
        <button
          type="button"
          onClick={e => {
            e.stopPropagation();
            if (book.type === 'FREE') {
              openReader(book);
            } else {
              openCheckout(book);
            }
          }}
          className="absolute bottom-3 inset-x-4 py-2 px-3 bg-slate-900/90 dark:bg-indigo-600/90 hover:bg-slate-900 text-white text-xs font-medium rounded-lg backdrop-blur-xs opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200 flex items-center justify-center gap-1.5 shadow-md"
        >
          {book.type === 'FREE' ? (
            <>
              <BookOpen className="w-3.5 h-3.5" />
              <span>Quick Preview</span>
            </>
          ) : (
            <>
              <ShoppingCart className="w-3.5 h-3.5" />
              <span>Quick Buy (₹{book.price})</span>
            </>
          )}
        </button>
      </div>

      {/* Book Meta & Details */}
      <div className="flex flex-col flex-1 pt-3">
        {/* Category & Badge Row */}
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400 truncate">
            {book.category}
          </span>
          <Badge type={book.type} />
        </div>

        {/* Title */}
        <h4 className="font-semibold text-slate-900 dark:text-white text-sm sm:text-base line-clamp-2 leading-snug group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
          {book.title}
        </h4>

        {/* Author */}
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 truncate">
          by {book.author}
        </p>

        {/* Date Added (if enabled) */}
        {showDate && (
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
            Added on {new Date(book.dateAdded).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </p>
        )}

        {/* Rating and Price Row */}
        <div className="flex items-center justify-between mt-auto pt-3 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-1 text-xs">
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 shrink-0" />
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              {book.rating.toFixed(1)}
            </span>
            <span className="text-slate-400 dark:text-slate-500 text-[11px]">
              ({book.reviewsCount})
            </span>
          </div>

          <div className="text-right">
            {book.type === 'FREE' ? (
              <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                ₹0 <span className="text-[10px] font-normal uppercase text-slate-400">Free</span>
              </span>
            ) : (
              <span className="text-sm font-bold text-slate-900 dark:text-white tabular-nums">
                ₹{book.price}
              </span>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2 mt-3 pt-2">
          {actionVariant === 'free' || (actionVariant === 'default' && book.type === 'FREE') || isPurchased ? (
            <button
              type="button"
              onClick={e => {
                e.stopPropagation();
                openReader(book);
              }}
              className="w-full py-1.5 px-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-colors"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Read Now</span>
            </button>
          ) : actionVariant === 'premium' || (actionVariant === 'default' && book.type === 'PREMIUM') ? (
            <button
              type="button"
              onClick={e => {
                e.stopPropagation();
                openCheckout(book);
              }}
              className="w-full py-1.5 px-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-colors"
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              <span>Buy Now</span>
            </button>
          ) : null}

          <button
            type="button"
            onClick={e => {
              e.stopPropagation();
              handleCardClick();
            }}
            className="w-full py-1.5 px-2 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-medium flex items-center justify-center gap-1 transition-colors"
          >
            <span>View Details</span>
            <ArrowRight className="w-3 h-3 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
};
