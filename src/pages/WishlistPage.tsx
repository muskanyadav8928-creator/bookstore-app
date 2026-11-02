import React from 'react';
import { Heart, Trash2, ArrowRight, BookOpen, ShoppingCart } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { BookCover } from '../components/BookCover';
import { Badge } from '../components/Badge';

export const WishlistPage: React.FC = () => {
  const { 
    allBooks,
    currentUser,
    wishlistIds, 
    toggleWishlist, 
    navigateTo, 
    openReader, 
    openCheckout 
  } = useApp();

  if (!currentUser) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center mx-auto">
          <Heart className="w-7 h-7" />
        </div>
        <h2 className="font-serif text-2xl font-bold text-slate-900 dark:text-white">
          Sign In to Access Your Wishlist
        </h2>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          Your saved academic books are stored in your personal account in MongoDB so you can access them anywhere.
        </p>
        <button
          type="button"
          onClick={() => navigateTo('login')}
          className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold cursor-pointer shadow-md"
        >
          Sign In
        </button>
      </div>
    );
  }

  const wishlistedBooks = allBooks.filter(b => wishlistIds.includes(b.id));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      {/* Header */}
      <div className="pb-6 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-rose-500 text-xs font-bold uppercase tracking-wider">
            <Heart className="w-4 h-4 fill-current" />
            <span>Saved Academic Reading List</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mt-1">
            My Wishlist
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Keep track of textbooks and references you plan to study or purchase later.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
            {wishlistedBooks.length} Books Saved
          </span>
        </div>
      </div>

      {/* Wishlist Items List */}
      {wishlistedBooks.length > 0 ? (
        <div className="space-y-4">
          {wishlistedBooks.map(book => (
            <div
              key={book.id}
              className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:shadow-md transition-shadow flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6"
            >
              <div
                onClick={() => navigateTo('book-detail', { bookId: book.id })}
                className="w-20 sm:w-24 shrink-0 cursor-pointer"
              >
                <BookCover book={book} size="sm" showSpine={false} />
              </div>

              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                    {book.category}
                  </span>
                  <Badge type={book.type} />
                </div>

                <h3
                  onClick={() => navigateTo('book-detail', { bookId: book.id })}
                  className="font-semibold text-base text-slate-900 dark:text-white hover:text-indigo-600 transition-colors cursor-pointer truncate"
                >
                  {book.title}
                </h3>

                <p className="text-xs text-slate-500 truncate">
                  by {book.author} · {book.pages} pages · ISBN: {book.isbn}
                </p>

                <p className="text-xs text-slate-400 line-clamp-1 hidden sm:block">
                  {book.description}
                </p>
              </div>

              <div className="shrink-0 text-left sm:text-right">
                <span className="text-xs text-slate-400 block">Price</span>
                {book.type === 'FREE' ? (
                  <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                    ₹0 <span className="text-xs font-normal">Free</span>
                  </span>
                ) : (
                  <span className="text-lg font-bold text-slate-900 dark:text-white tabular-nums">
                    ₹{book.price}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800">
                {book.type === 'FREE' ? (
                  <button
                    type="button"
                    onClick={() => openReader(book)}
                    className="flex-1 sm:flex-none px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>Read Now</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => openCheckout(book)}
                    className="flex-1 sm:flex-none px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                  >
                    <ShoppingCart className="w-3.5 h-3.5" />
                    <span>Buy Now</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => navigateTo('book-detail', { bookId: book.id })}
                  className="px-3 py-2 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                >
                  View Details
                </button>

                <button
                  type="button"
                  onClick={() => toggleWishlist(book.id)}
                  className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition-colors cursor-pointer"
                  title="Remove from wishlist"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 px-4 bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 max-w-md mx-auto space-y-4">
          <div className="w-14 h-14 rounded-full bg-rose-50 dark:bg-rose-950/60 text-rose-500 flex items-center justify-center mx-auto">
            <Heart className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Your Wishlist is Empty
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
              Save books by clicking the heart icon on any card to access them quickly here.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigateTo('books')}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <span>Explore Books</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};
