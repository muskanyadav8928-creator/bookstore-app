import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { 
  ActivePage, 
  AdminTab, 
  Book, 
  Category,
  LibraryItem, 
  PurchaseRecord, 
  SortOption, 
  UserProfile 
} from '../types';
import { BOOKS_DATA } from '../data/booksData';
import { CATEGORIES_DATA } from '../data/categoriesData';
import { authService, wishlistService, BookService, categoryService } from '../services/api';

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'info' | 'warning';
}

interface AppContextType {
  isDark: boolean;
  toggleTheme: () => void;
  activePage: ActivePage;
  activeAdminTab: AdminTab;
  setActiveAdminTab: (tab: AdminTab) => void;
  selectedBookId: string | null;
  selectedCategorySlug: string | null;
  navigateTo: (
    page: ActivePage,
    params?: { 
      bookId?: string; 
      categorySlug?: string; 
      query?: string;
      category?: string;
      type?: 'ALL' | 'FREE' | 'PREMIUM';
      language?: string;
      sortBy?: SortOption;
      adminTab?: AdminTab;
      returnUrl?: ActivePage;
    }
  ) => void;

  // Search & Global Filters
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
  selectedType: 'ALL' | 'FREE' | 'PREMIUM';
  setSelectedType: (type: 'ALL' | 'FREE' | 'PREMIUM') => void;
  selectedLanguage: string;
  setSelectedLanguage: (lang: string) => void;
  sortBy: SortOption;
  setSortBy: (sort: SortOption) => void;
  resetAllFilters: () => void;

  // Data
  allBooks: Book[];
  refreshBooks: () => Promise<void>;
  getBookById: (id: string) => Book | undefined;
  adminBookToEdit: Book | null;
  setAdminBookToEdit: (book: Book | null) => void;
  allCategories: Category[];
  refreshCategories: () => Promise<void>;
  getCategoryBySlug: (slug: string) => Category | undefined;

  // Wishlist (User-Isolated)
  wishlistIds: string[];
  toggleWishlist: (bookId: string) => Promise<void>;
  isInWishlist: (bookId: string) => boolean;

  // Library & Reading
  libraryItems: LibraryItem[];
  updateReadingProgress: (bookId: string, progress: number, page: number) => void;
  purchaseHistory: PurchaseRecord[];
  addPurchasedBook: (book: Book) => void;

  // Real Authentication & User Roles
  currentUser: UserProfile | null;
  isAuthLoading: boolean;
  loginUser: (credentials: { email: string; password: string }) => Promise<void>;
  registerUser: (data: { name: string; email: string; password: string; confirmPassword: string }) => Promise<void>;
  logoutUser: () => Promise<void>;

  // Modals & Reader
  readerBook: Book | null;
  openReader: (book: Book, initialPage?: number) => void;
  closeReader: () => void;
  checkoutBook: Book | null;
  openCheckout: (book: Book) => void;
  closeCheckout: () => void;

  // Toasts
  toasts: Toast[];
  showToast: (message: string, type?: 'success' | 'info' | 'warning') => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const INITIAL_LIBRARY: LibraryItem[] = [
  {
    id: 'lib-1',
    bookId: 'book-1',
    status: 'reading',
    progress: 42,
    currentPage: 202,
    lastRead: '2 hours ago',
    note: 'Master Theorem formulation in chapter 1 is vital for college algorithms exam.',
  },
  {
    id: 'lib-2',
    bookId: 'book-4',
    status: 'reading',
    progress: 75,
    currentPage: 292,
    lastRead: 'Yesterday',
    note: 'Generators with yield save memory on O(1) pipelines.',
  },
  {
    id: 'lib-3',
    bookId: 'book-7',
    status: 'completed',
    progress: 100,
    currentPage: 510,
    lastRead: 'Sep 21, 2026',
    note: 'Excellent TCP packet walkthrough for networking lab.',
  },
  {
    id: 'lib-4',
    bookId: 'book-2',
    status: 'bookmarked',
    progress: 15,
    currentPage: 62,
    lastRead: 'Sep 18, 2026',
    note: 'Check Chapter 2 for REST API response standard.',
  },
];

const INITIAL_PURCHASES: PurchaseRecord[] = [
  {
    orderId: 'ORD-2026-8812',
    bookId: 'book-3',
    date: '2026-09-22',
    amount: 99,
    paymentMethod: 'UPI / Student Wallet (Demo)',
    status: 'Completed',
  },
  {
    orderId: 'ORD-2026-7491',
    bookId: 'book-5',
    date: '2026-09-24',
    amount: 149,
    paymentMethod: 'RuPay Card (Demo)',
    status: 'Completed',
  },
];

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('bookstore_theme');
      if (saved) return saved === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
      localStorage.setItem('bookstore_theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('bookstore_theme', 'light');
    }
  }, [isDark]);

  const toggleTheme = () => setIsDark(prev => !prev);

  const parseUrlRoute = useCallback(() => {
    if (typeof window === 'undefined') return { page: 'home' as ActivePage };
    const path = window.location.pathname;
    const searchParams = new URLSearchParams(window.location.search);
    const q = searchParams.get('q') || '';

    if (path.startsWith('/book/')) {
      const bookId = path.replace('/book/', '').trim();
      return { page: 'book-detail' as ActivePage, bookId };
    }
    if (path.startsWith('/read/')) {
      const bookId = path.replace('/read/', '').trim();
      return { page: 'reader' as ActivePage, bookId };
    }
    if (path.startsWith('/checkout/') || path.startsWith('/payment/')) {
      const bookId = path.replace('/checkout/', '').replace('/payment/', '').trim();
      return { page: 'payment-demo' as ActivePage, bookId };
    }
    if (path === '/purchases' || path === '/purchase-history') {
      return { page: 'purchase-history' as ActivePage };
    }
    if (path.startsWith('/category/')) {
      const categorySlug = path.replace('/category/', '').trim();
      return { page: 'category-detail' as ActivePage, categorySlug };
    }
    if (path === '/free-books') {
      return { page: 'books' as ActivePage, type: 'FREE' as const };
    }
    if (path === '/premium-books') {
      return { page: 'books' as ActivePage, type: 'PREMIUM' as const };
    }
    if (path === '/search') {
      return { page: 'books' as ActivePage, query: q };
    }
    if (path === '/books') {
      return { page: 'books' as ActivePage, query: q };
    }
    if (path === '/categories') {
      return { page: 'categories' as ActivePage };
    }
    if (path === '/wishlist') {
      return { page: 'wishlist' as ActivePage };
    }
    if (path === '/library') {
      return { page: 'library' as ActivePage };
    }
    if (path === '/login') {
      return { page: 'login' as ActivePage };
    }
    if (path === '/register') {
      return { page: 'register' as ActivePage };
    }
    if (path === '/profile') {
      return { page: 'profile' as ActivePage };
    }
    if (path === '/admin/payment-gateway' || path === '/admin/payment-gateways') {
      return { page: 'admin-payment-gateway' as ActivePage };
    }
    if (path.startsWith('/admin')) {
      return { page: 'admin' as ActivePage };
    }
    return { page: 'home' as ActivePage };
  }, []);

  const initialRoute = parseUrlRoute();

  const [activePage, setActivePage] = useState<ActivePage>(initialRoute.page);
  const [activeAdminTab, setActiveAdminTab] = useState<AdminTab>('dashboard');
  const [selectedBookId, setSelectedBookId] = useState<string | null>(initialRoute.bookId || 'book-1');
  const [selectedCategorySlug, setSelectedCategorySlug] = useState<string | null>(initialRoute.categorySlug || null);
  const [redirectAfterLogin, setRedirectAfterLogin] = useState<ActivePage | null>(null);

  const [searchQuery, setSearchQuery] = useState(initialRoute.query || '');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedType, setSelectedType] = useState<'ALL' | 'FREE' | 'PREMIUM'>(initialRoute.type || 'ALL');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<SortOption>('latest');

  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('bookstore_user');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          return null;
        }
      }
    }
    return null;
  });
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);

  const [wishlistIds, setWishlistIds] = useState<string[]>([]);

  useEffect(() => {
    const handlePopState = () => {
      const route = parseUrlRoute();
      if (route.bookId) setSelectedBookId(route.bookId);
      if (route.categorySlug) setSelectedCategorySlug(route.categorySlug);
      if (route.query !== undefined) setSearchQuery(route.query);
      if (route.type) setSelectedType(route.type);
      setActivePage(route.page);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [parseUrlRoute]);

  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: 'success' | 'info' | 'warning' = 'success') => {
    const id = Date.now().toString() + Math.random().toString(36).substring(2, 6);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3500);
  }, []);

  useEffect(() => {
    async function verifySession() {
      const token = localStorage.getItem('bookstore_token');
      if (!token) {
        setIsAuthLoading(false);
        return;
      }

      try {
        const res = await authService.getMe();
        if (res.user) {
          setCurrentUser(res.user);
          localStorage.setItem('bookstore_user', JSON.stringify(res.user));

          try {
            const list = await wishlistService.get();
            setWishlistIds(list);
          } catch {
            // wishlist fallback
          }
        }
      } catch (err: any) {
        console.warn('Session verification notice:', err.message);
        localStorage.removeItem('bookstore_token');
        localStorage.removeItem('bookstore_user');
        setCurrentUser(null);
        setWishlistIds([]);
      } finally {
        setIsAuthLoading(false);
      }
    }

    verifySession();
  }, []);

  const [libraryItems, setLibraryItems] = useState<LibraryItem[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('bookstore_library');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          return INITIAL_LIBRARY;
        }
      }
    }
    return INITIAL_LIBRARY;
  });

  useEffect(() => {
    localStorage.setItem('bookstore_library', JSON.stringify(libraryItems));
  }, [libraryItems]);

  const [purchaseHistory, setPurchaseHistory] = useState<PurchaseRecord[]>(INITIAL_PURCHASES);

  const [readerBook, setReaderBook] = useState<Book | null>(null);
  const [checkoutBook, setCheckoutBook] = useState<Book | null>(null);

  const [allBooks, setAllBooks] = useState<Book[]>(BOOKS_DATA);
  const [adminBookToEdit, setAdminBookToEdit] = useState<Book | null>(null);

  const [allCategories, setAllCategories] = useState<Category[]>(CATEGORIES_DATA);

  const refreshCategories = useCallback(async () => {
    try {
      const cats = await categoryService.getCategories();
      if (cats && cats.length > 0) {
        setAllCategories(cats);
      }
    } catch {
      // Fallback
    }
  }, []);

  const refreshBooks = useCallback(async () => {
    try {
      const books = await BookService.getBooks();
      if (books && books.length > 0) {
        setAllBooks(books);
      }
    } catch {
      // Fallback
    }
  }, []);

  useEffect(() => {
    refreshBooks();
    refreshCategories();
  }, [refreshBooks, refreshCategories]);

  const getCategoryBySlug = useCallback((slug: string) => {
    return allCategories.find(c => c.slug.toLowerCase() === slug.toLowerCase());
  }, [allCategories]);

  const getBookById = useCallback((id: string) => {
    return allBooks.find(b => b.id === id);
  }, [allBooks]);

  const resetAllFilters = useCallback(() => {
    setSearchQuery('');
    setSelectedCategory('ALL');
    setSelectedType('ALL');
    setSelectedLanguage('ALL');
    setSortBy('latest');
  }, []);

  const navigateTo = (
    page: ActivePage,
    params?: { 
      bookId?: string; 
      categorySlug?: string; 
      query?: string;
      category?: string;
      type?: 'ALL' | 'FREE' | 'PREMIUM';
      language?: string;
      sortBy?: SortOption;
      adminTab?: AdminTab;
      returnUrl?: ActivePage;
    }
  ) => {
    if (params?.bookId) setSelectedBookId(params.bookId);
    if (params?.categorySlug) setSelectedCategorySlug(params.categorySlug);
    if (params?.query !== undefined) setSearchQuery(params.query);
    if (params?.category) setSelectedCategory(params.category);
    if (params?.type) setSelectedType(params.type);
    if (params?.language) setSelectedLanguage(params.language);
    if (params?.sortBy) setSortBy(params.sortBy);
    if (params?.adminTab) setActiveAdminTab(params.adminTab);

    const isUserProtectedRoute = 
      page === 'library' || 
      page === 'wishlist' || 
      page === 'profile' || 
      page === 'purchase-history' || 
      page === 'payment-demo';
    if (isUserProtectedRoute && !currentUser) {
      setRedirectAfterLogin(page);
      showToast('Please sign in to access student account and purchase features.', 'info');
      setActivePage('login');
      try {
        window.history.pushState(null, '', '/login');
      } catch {}
      return;
    }

    if (params?.returnUrl) {
      setRedirectAfterLogin(params.returnUrl);
    }
    if (params?.bookId) {
      setSelectedBookId(params.bookId);
    }

    if (page === 'admin') {
      if (!currentUser) {
        setRedirectAfterLogin('admin');
        showToast('Administrator authentication required.', 'warning');
        setActivePage('login');
        try {
          window.history.pushState(null, '', '/login');
        } catch {}
        return;
      }

      if (currentUser.role !== 'ADMIN') {
        showToast('403 Forbidden: Administrator privileges required.', 'warning');
        setActivePage('home');
        try {
          window.history.pushState(null, '', '/');
        } catch {}
        return;
      }
    }

    let routePath = '/';
    let targetPage = page;

    if (page === 'free-books') {
      setSelectedType('FREE');
      targetPage = 'books';
      routePath = '/free-books';
    } else if (page === 'premium-books') {
      setSelectedType('PREMIUM');
      targetPage = 'books';
      routePath = '/premium-books';
    } else if (page === 'book-detail' && params?.bookId) {
      routePath = `/book/${params.bookId}`;
    } else if (page === 'reader' && params?.bookId) {
      routePath = `/read/${params.bookId}`;
    } else if (page === 'payment-demo' && params?.bookId) {
      routePath = `/checkout/${params.bookId}`;
    } else if (page === 'purchase-history') {
      routePath = '/purchases';
    } else if (page === 'category-detail' && params?.categorySlug) {
      routePath = `/category/${params.categorySlug}`;
    } else if (page === 'books') {
      routePath = params?.query ? `/search?q=${encodeURIComponent(params.query)}` : '/books';
    } else if (page === 'categories') {
      routePath = '/categories';
    } else if (page === 'wishlist') {
      routePath = '/wishlist';
    } else if (page === 'library') {
      routePath = '/library';
    } else if (page === 'profile') {
      routePath = '/profile';
    } else if (page === 'admin') {
      routePath = '/admin';
    } else if (page === 'admin-payment-gateway') {
      routePath = '/admin/payment-gateway';
    } else if (page === 'login') {
      routePath = '/login';
    } else if (page === 'register') {
      routePath = '/register';
    }

    try {
      if (window.location.pathname !== routePath) {
        window.history.pushState(null, '', routePath);
      }
    } catch {}

    setActivePage(targetPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleWishlist = async (bookId: string) => {
    if (!currentUser) {
      setRedirectAfterLogin('wishlist');
      showToast('Please sign in to save books to your personal wishlist.', 'info');
      setActivePage('login');
      return;
    }

    const book = allBooks.find(b => b.id === bookId) || BOOKS_DATA.find(b => b.id === bookId);
    const title = book ? book.title : 'Book';

    try {
      const res = await wishlistService.toggle(bookId);
      setWishlistIds(res.data);
      if (res.action === 'added') {
        showToast(`Added "${title.substring(0, 24)}..." to Wishlist`, 'success');
      } else {
        showToast(`Removed "${title.substring(0, 24)}..." from Wishlist`, 'info');
      }
    } catch {
      // Local fallback
      setWishlistIds(prev => {
        const exists = prev.includes(bookId);
        if (exists) {
          showToast(`Removed "${title.substring(0, 24)}..." from Wishlist`, 'info');
          return prev.filter(id => id !== bookId);
        } else {
          showToast(`Added "${title.substring(0, 24)}..." to Wishlist`, 'success');
          return [...prev, bookId];
        }
      });
    }
  };

  const isInWishlist = (bookId: string) => wishlistIds.includes(bookId);

  const loginUser = async (credentials: { email: string; password: string }) => {
    const res = await authService.login(credentials);
    setCurrentUser(res.user);
    localStorage.setItem('bookstore_user', JSON.stringify(res.user));

    showToast(`Welcome back, ${res.user.name}!`, 'success');

    try {
      const list = await wishlistService.get();
      setWishlistIds(list);
    } catch {}

    if (res.user.role === 'ADMIN') {
      navigateTo('admin');
    } else {
      const dest = redirectAfterLogin || 'library';
      setRedirectAfterLogin(null);
      navigateTo(dest);
    }
  };

  const registerUser = async (data: {
    name: string;
    email: string;
    password: string;
    confirmPassword: string;
  }) => {
    const res = await authService.register(data);
    setCurrentUser(res.user);
    localStorage.setItem('bookstore_user', JSON.stringify(res.user));

    showToast(`Account registered successfully as Student (${res.user.role})!`, 'success');

    const dest = redirectAfterLogin || 'library';
    setRedirectAfterLogin(null);
    navigateTo(dest);
  };

  const logoutUser = async () => {
    await authService.logout();
    setCurrentUser(null);
    setWishlistIds([]);
    showToast('You have been logged out securely.', 'info');
    navigateTo('home');
  };

  const updateReadingProgress = (bookId: string, progress: number, page: number) => {
    setLibraryItems(prev => {
      const idx = prev.findIndex(item => item.bookId === bookId);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = {
          ...updated[idx],
          progress,
          currentPage: page,
          status: progress >= 100 ? 'completed' : 'reading',
          lastRead: 'Just now',
        };
        return updated;
      } else {
        return [
          {
            id: `lib-${Date.now()}`,
            bookId,
            status: progress >= 100 ? 'completed' : 'reading',
            progress,
            currentPage: page,
            lastRead: 'Just now',
          },
          ...prev,
        ];
      }
    });
  };

  const addPurchasedBook = (book: Book) => {
    const orderId = `ORD-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const newRecord: PurchaseRecord = {
      orderId,
      bookId: book.id,
      date: new Date().toISOString().split('T')[0],
      amount: book.price,
      paymentMethod: 'UPI / NetBanking (Demo Simulated)',
      status: 'Completed',
    };
    setPurchaseHistory(prev => [newRecord, ...prev]);

    setLibraryItems(prev => {
      if (prev.some(item => item.bookId === book.id)) return prev;
      return [
        {
          id: `lib-${Date.now()}`,
          bookId: book.id,
          status: 'reading',
          progress: 5,
          currentPage: 15,
          lastRead: 'Today',
          note: 'Purchased premium edition.',
        },
        ...prev,
      ];
    });

    showToast(`Order ${orderId} successful! "${book.title}" added to My Library.`, 'success');
  };

  const openReader = (book: Book, initialPage?: number) => {
    setSelectedBookId(book.id);
    setReaderBook(book);
    navigateTo('reader', { bookId: book.id });
    if (initialPage && initialPage > 1) {
      updateReadingProgress(book.id, Math.round((initialPage / (book.pages || 100)) * 100), initialPage);
    }
  };

  const closeReader = () => setReaderBook(null);
  const openCheckout = (book: Book) => {
    setSelectedBookId(book.id);
    setCheckoutBook(book);
    navigateTo('payment-demo', { bookId: book.id });
  };
  const closeCheckout = () => setCheckoutBook(null);

  return (
    <AppContext.Provider
      value={{
        isDark,
        toggleTheme,
        activePage,
        activeAdminTab,
        setActiveAdminTab,
        selectedBookId,
        selectedCategorySlug,
        navigateTo,
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
        resetAllFilters,
        allBooks,
        refreshBooks,
        getBookById,
        adminBookToEdit,
        setAdminBookToEdit,
        allCategories,
        refreshCategories,
        getCategoryBySlug,
        wishlistIds,
        toggleWishlist,
        isInWishlist,
        libraryItems,
        updateReadingProgress,
        purchaseHistory,
        addPurchasedBook,
        currentUser,
        isAuthLoading,
        loginUser,
        registerUser,
        logoutUser,
        readerBook,
        openReader,
        closeReader,
        checkoutBook,
        openCheckout,
        closeCheckout,
        toasts,
        showToast,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
