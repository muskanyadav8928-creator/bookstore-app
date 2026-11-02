import React, { useState } from 'react';
import { 
  Heart, 
  BookMarked, 
  User, 
  Menu, 
  X, 
  Search, 
  ShieldCheck, 
  LogOut, 
  UserCheck, 
  Bell, 
  Sparkles, 
  Receipt, 
  BookOpen 
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ThemeToggle } from './ThemeToggle';
import { ActivePage } from '../types';

export const Header: React.FC = () => {
  const { 
    activePage, 
    navigateTo, 
    wishlistIds, 
    currentUser, 
    logoutUser, 
    setSelectedType,
    setSearchQuery,
    libraryItems = [],
    purchaseHistory = [],
    allBooks = []
  } = useApp();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [quickSearch, setQuickSearch] = useState('');

  const navLinks: { label: string; page: ActivePage; filterType?: 'FREE' | 'PREMIUM' }[] = [
    { label: 'Home', page: 'home' },
    { label: 'Books', page: 'books' },
    { label: 'Categories', page: 'categories' },
    { label: 'Free Books', page: 'free-books', filterType: 'FREE' },
    { label: 'Premium Books', page: 'premium-books', filterType: 'PREMIUM' },
  ];

  const handleNavClick = (link: typeof navLinks[0]) => {
    if (link.filterType) {
      setSelectedType(link.filterType);
    }
    navigateTo(link.page);
    setMobileMenuOpen(false);
  };

  const handleQuickSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (quickSearch.trim()) {
      setSearchQuery(quickSearch);
      navigateTo('books', { query: quickSearch });
      setSearchOpen(false);
      setQuickSearch('');
    }
  };

  const notifications = [
    ...(allBooks.length > 0 ? [{
      id: 'n-new-book',
      title: 'New Books Available',
      desc: `${allBooks.length} Computer Science & Programming titles active in catalog.`,
      time: 'Just now',
      icon: <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
    }] : []),
    ...(libraryItems.length > 0 ? [{
      id: 'n-reading',
      title: 'Active Reading Shelf',
      desc: `You have ${libraryItems.length} book(s) in your personal reading library.`,
      time: 'Today',
      icon: <BookOpen className="w-3.5 h-3.5 text-emerald-500" />
    }] : []),
    ...(purchaseHistory.length > 0 ? [{
      id: 'n-purchase',
      title: 'Purchased Access Confirmed',
      desc: `${purchaseHistory.length} premium digital volume(s) verified in your account.`,
      time: 'Recent',
      icon: <Receipt className="w-3.5 h-3.5 text-amber-500" />
    }] : []),
  ];

  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Zone 1: Brand Logo */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => navigateTo('home')}
              className="flex items-center gap-2.5 text-left group cursor-pointer"
              aria-label="BookStore Home"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-indigo-800 text-white flex items-center justify-center shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-5 h-5 text-white"
                >
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                  <path d="M9 7h6" />
                  <path d="M9 11h6" />
                </svg>
              </div>

              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="font-serif text-xl font-bold tracking-tight text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    BookStore
                  </span>
                  <span className="text-[10px] font-semibold uppercase px-1.5 py-0.2 bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 rounded border border-indigo-200 dark:border-indigo-800/60 hidden sm:inline-block">
                    Digital Library
                  </span>
                </div>
                <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 tracking-wider hidden lg:inline-block">
                  Read. Learn. Explore.
                </span>
              </div>
            </button>
          </div>

          {/* Zone 2: Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2">
            {navLinks.map(link => {
              const isActive = activePage === link.page;
              return (
                <button
                  key={link.label}
                  onClick={() => handleNavClick(link)}
                  className={`px-3 py-1.5 text-xs lg:text-sm font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                    isActive
                      ? 'text-indigo-600 dark:text-indigo-400 font-semibold bg-indigo-50/70 dark:bg-indigo-950/40'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/60 dark:hover:bg-slate-800/60'
                  }`}
                >
                  {link.label}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: Actions (Right) */}
          <div className="flex items-center gap-1.5 sm:gap-2.5">
            {/* Search Trigger */}
            <button
              type="button"
              onClick={() => setSearchOpen(prev => !prev)}
              className="p-2 text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              aria-label="Toggle Search"
              title="Search Books"
            >
              <Search className="w-5 h-5" />
            </button>

            {/* Wishlist Link */}
            <button
              type="button"
              onClick={() => navigateTo('wishlist')}
              className="relative p-2 text-slate-600 hover:text-rose-600 dark:text-slate-300 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              aria-label={`Wishlist (${wishlistIds.length} items)`}
              title="View Wishlist"
            >
              <Heart className={`w-5 h-5 ${wishlistIds.length > 0 ? 'text-rose-500 fill-rose-500/20' : ''}`} />
              {wishlistIds.length > 0 && (
                <span className="absolute top-1 right-1 flex items-center justify-center w-4 h-4 text-[10px] font-bold text-white bg-rose-500 rounded-full tabular-nums shadow-xs">
                  {wishlistIds.length}
                </span>
              )}
            </button>

            {/* Notifications Popover Trigger */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setNotificationsOpen(prev => !prev);
                  setProfileOpen(false);
                }}
                className="relative p-2 text-slate-600 hover:text-indigo-600 dark:text-slate-300 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                aria-label="Notifications"
                title="Notifications"
              >
                <Bell className="w-5 h-5" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-indigo-600 ring-2 ring-white dark:ring-slate-900" />
              </button>

              {notificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-4 z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <Bell className="w-4 h-4 text-indigo-600" />
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                        Library Notifications
                      </h4>
                    </div>
                    <span className="text-[10px] text-slate-400">Recent</span>
                  </div>

                  <div className="py-2 divide-y divide-slate-100 dark:divide-slate-800/60 max-h-64 overflow-y-auto">
                    {notifications.map(n => (
                      <div key={n.id} className="py-2.5 flex items-start gap-2.5">
                        <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 shrink-0 mt-0.5">
                          {n.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-slate-900 dark:text-white">{n.title}</p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">{n.desc}</p>
                          <span className="text-[10px] text-slate-400 font-mono mt-1 block">{n.time}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-center">
                    <button
                      type="button"
                      onClick={() => {
                        setNotificationsOpen(false);
                        navigateTo('books');
                      }}
                      className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                    >
                      Browse All Catalog Titles
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* My Library Button */}
            {currentUser && (
              <button
                type="button"
                onClick={() => navigateTo('library')}
                className={`hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors cursor-pointer ${
                  activePage === 'library'
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                    : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <BookMarked className="w-3.5 h-3.5" />
                <span>My Library</span>
              </button>
            )}

            {/* Admin Panel Link: ONLY SHOWN IF ROLE === 'ADMIN' */}
            {currentUser && currentUser.role === 'ADMIN' && (
              <button
                type="button"
                onClick={() => navigateTo('admin')}
                className={`hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg border transition-all cursor-pointer shadow-xs ${
                  activePage === 'admin'
                    ? 'bg-purple-600 text-white border-purple-600 shadow-purple-500/20'
                    : 'bg-purple-50 dark:bg-purple-950/60 border-purple-200 dark:border-purple-800/80 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/60'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                <span>Admin Panel</span>
              </button>
            )}

            {/* Light / Dark Mode Toggle */}
            <ThemeToggle />

            {/* User Profile / Login */}
            {currentUser ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setProfileOpen(prev => !prev);
                    setNotificationsOpen(false);
                  }}
                  className="flex items-center gap-2 pl-2 pr-1 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <div className="w-7 h-7 rounded-full bg-indigo-100 dark:bg-indigo-900/80 text-indigo-700 dark:text-indigo-300 flex items-center justify-center text-xs font-bold ring-1 ring-indigo-500/20">
                    {currentUser.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-xs font-medium text-slate-700 dark:text-slate-200 hidden lg:inline-block max-w-[100px] truncate">
                    {currentUser.name.split(' ')[0]}
                  </span>
                </button>

                {profileOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-3 z-50 animate-in fade-in slide-in-from-top-2">
                    <div className="pb-3 border-b border-slate-100 dark:border-slate-800">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {currentUser.name}
                        </p>
                        <span
                          className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase tracking-wider ${
                            currentUser.role === 'ADMIN'
                              ? 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300'
                              : 'bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300'
                          }`}
                        >
                          {currentUser.role}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                        {currentUser.email}
                      </p>
                    </div>

                    <div className="py-2 space-y-1">
                      {currentUser.role === 'ADMIN' && (
                        <button
                          type="button"
                          onClick={() => {
                            setProfileOpen(false);
                            navigateTo('admin');
                          }}
                          className="w-full text-left px-2.5 py-1.5 text-xs text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950/50 rounded-md transition-colors flex items-center gap-2 cursor-pointer font-semibold"
                        >
                          <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
                          <span>Admin Dashboard</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          setProfileOpen(false);
                          navigateTo('profile');
                        }}
                        className="w-full text-left px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors flex items-center gap-2 cursor-pointer"
                      >
                        <UserCheck className="w-3.5 h-3.5 text-indigo-500" />
                        <span>My Account Profile</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setProfileOpen(false);
                          navigateTo('library');
                        }}
                        className="w-full text-left px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors flex items-center gap-2 cursor-pointer"
                      >
                        <BookMarked className="w-3.5 h-3.5 text-indigo-500" />
                        <span>My Reading Library</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setProfileOpen(false);
                          navigateTo('wishlist');
                        }}
                        className="w-full text-left px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors flex items-center gap-2 cursor-pointer"
                      >
                        <Heart className="w-3.5 h-3.5 text-rose-500" />
                        <span>Saved Wishlist ({wishlistIds.length})</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setProfileOpen(false);
                          navigateTo('purchase-history');
                        }}
                        className="w-full text-left px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors flex items-center gap-2 cursor-pointer"
                      >
                        <Receipt className="w-3.5 h-3.5 text-amber-500" />
                        <span>Purchase History & Invoices</span>
                      </button>
                    </div>

                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                      <button
                        type="button"
                        onClick={() => {
                          setProfileOpen(false);
                          logoutUser();
                        }}
                        className="w-full text-left px-2.5 py-1.5 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-md transition-colors flex items-center gap-2 cursor-pointer"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => navigateTo('login')}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                >
                  Login
                </button>
                <button
                  type="button"
                  onClick={() => navigateTo('register')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-colors cursor-pointer shadow-xs"
                >
                  <User className="w-3.5 h-3.5" />
                  <span>Register</span>
                </button>
              </div>
            )}

            {/* Mobile Hamburger Menu Toggle */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(prev => !prev)}
              className="p-2 text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white md:hidden rounded-lg cursor-pointer"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Dropdown Quick Search Bar */}
        {searchOpen && (
          <div className="py-3 px-1 border-t border-slate-200 dark:border-slate-800 animate-in fade-in duration-150">
            <form onSubmit={handleQuickSearchSubmit} className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={quickSearch}
                  onChange={e => setQuickSearch(e.target.value)}
                  placeholder="Quick search books, authors, topics (e.g. Python, Algorithms, Database)..."
                  autoFocus
                  className="w-full pl-9 pr-3 py-2 text-sm bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg cursor-pointer shadow-xs"
              >
                Search
              </button>
              <button
                type="button"
                onClick={() => setSearchOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 pt-3 pb-6 space-y-2 shadow-xl animate-in slide-in-from-top-4 duration-200">
          <div className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-2">
            Navigation
          </div>
          {navLinks.map(link => (
            <button
              key={link.label}
              onClick={() => handleNavClick(link)}
              className={`w-full text-left px-3 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer ${
                activePage === link.page
                  ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-semibold'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {link.label}
            </button>
          ))}

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1">
            {currentUser && currentUser.role === 'ADMIN' && (
              <button
                onClick={() => {
                  navigateTo('admin');
                  setMobileMenuOpen(false);
                }}
                className="w-full text-left px-3 py-2 text-sm font-bold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/40 rounded-lg flex items-center justify-between cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-purple-600" />
                  <span>Admin Dashboard</span>
                </span>
                <span className="text-[10px] bg-purple-200 dark:bg-purple-800 px-2 py-0.5 rounded uppercase font-bold">
                  Admin
                </span>
              </button>
            )}

            <button
              onClick={() => {
                navigateTo('library');
                setMobileMenuOpen(false);
              }}
              className="w-full text-left px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg flex items-center justify-between cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <BookMarked className="w-4 h-4 text-indigo-600" />
                <span>My Library</span>
              </span>
            </button>

            <button
              onClick={() => {
                navigateTo('wishlist');
                setMobileMenuOpen(false);
              }}
              className="w-full text-left px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg flex items-center justify-between cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <Heart className="w-4 h-4 text-rose-500" />
                <span>Wishlist</span>
              </span>
              <span className="text-xs bg-rose-50 text-rose-600 dark:bg-rose-950 px-2 py-0.5 rounded font-bold">
                {wishlistIds.length}
              </span>
            </button>

            {/* Mobile Theme Toggle */}
            <div className="flex items-center justify-between px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/40 rounded-lg">
              <span>Theme Appearance</span>
              <ThemeToggle showLabel />
            </div>

            {currentUser ? (
              <div className="p-2 mt-2 bg-slate-50 dark:bg-slate-800/60 rounded-lg">
                <p className="text-xs font-semibold text-slate-900 dark:text-white">
                  {currentUser.name}
                </p>
                <p className="text-[11px] text-slate-500">{currentUser.email}</p>
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                  <button
                    onClick={() => {
                      navigateTo('profile');
                      setMobileMenuOpen(false);
                    }}
                    className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold cursor-pointer"
                  >
                    View Profile
                  </button>
                  <button
                    onClick={() => {
                      logoutUser();
                      setMobileMenuOpen(false);
                    }}
                    className="text-xs text-rose-600 dark:text-rose-400 font-semibold cursor-pointer"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={() => {
                    navigateTo('login');
                    setMobileMenuOpen(false);
                  }}
                  className="py-2 px-3 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-sm font-semibold rounded-lg text-center cursor-pointer"
                >
                  Login
                </button>
                <button
                  onClick={() => {
                    navigateTo('register');
                    setMobileMenuOpen(false);
                  }}
                  className="py-2 px-3 bg-indigo-600 text-white text-sm font-semibold rounded-lg text-center cursor-pointer shadow-xs"
                >
                  Register
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
