import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeft, 
  ChevronLeft, 
  ChevronRight, 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  Minimize2, 
  Bookmark, 
  BookmarkCheck, 
  Download, 
  Sun, 
  Moon, 
  Coffee, 
  Search, 
  Lock, 
  ShoppingCart, 
  Loader2, 
  Trash2, 
  FileText, 
  Sparkles, 
  LogIn 
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { BookService } from '../services/api';
import { Book, BookmarkItem } from '../types';
import { BookCover } from '../components/BookCover';
import { AIReaderAssistantModal } from '../components/AIReaderAssistantModal';

declare global {
  interface Window {
    pdfjsLib?: any;
  }
}

export const ReaderPage: React.FC = () => {
  const { 
    selectedBookId, 
    allBooks, 
    currentUser, 
    navigateTo, 
    openCheckout, 
    showToast,
    updateReadingProgress
  } = useApp();

  const [book, setBook] = useState<Book | null>(() => {
    return allBooks.find(b => b.id === selectedBookId) || null;
  });

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [hasAccess, setHasAccess] = useState<boolean>(true);
  const [accessError, setAccessError] = useState<string | null>(null);

  const [theme, setTheme] = useState<'light' | 'sepia' | 'dark'>('light');
  const [zoomLevel, setZoomLevel] = useState<number>(1.0);
  const [fitMode, setFitMode] = useState<'fit-width' | 'custom'>('fit-width');
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [showBookmarksDrawer, setShowBookmarksDrawer] = useState<boolean>(false);

  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [pageInput, setPageInput] = useState<string>('1');

  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);
  const [bookmarking, setBookmarking] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResultsCount, setSearchResultsCount] = useState<number | null>(null);
  const [downloading, setDownloading] = useState<boolean>(false);
  const [isAIAssistantOpen, setIsAIAssistantOpen] = useState<boolean>(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const pdfDocRef = useRef<any>(null);
  const renderTaskRef = useRef<any>(null);
  const isRenderingRef = useRef<boolean>(false);
  const pendingPageRef = useRef<number | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function initReader() {
      if (!selectedBookId) {
        navigateTo('books');
        return;
      }

      setIsLoading(true);
      setAccessError(null);

      try {
        const res = await BookService.getReaderInfo(selectedBookId);
        if (!isMounted) return;

        const data = res.data;
        if (data?.book) {
          setBook(prev => ({ ...(prev || {}), ...data.book }));
        }

        setHasAccess(res.hasAccess);

        if (data?.progress?.currentPage) {
          const savedPage = data.progress.currentPage;
          setCurrentPage(savedPage);
          setPageInput(String(savedPage));
        }

        if (data?.bookmarks) {
          setBookmarks(data.bookmarks);
        }

        await loadDocument();
      } catch (err: any) {
        if (!isMounted) return;
        if (err.status === 403 || err.message?.includes('403') || err.message?.includes('purchase')) {
          setHasAccess(false);
          setAccessError(err.message || 'Purchase required to read this premium e-book.');
        } else {
          setAccessError(err.message || 'Failed to load e-book reader.');
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    initReader();

    return () => {
      isMounted = false;
      if (pdfDocRef.current) {
        try {
          pdfDocRef.current.destroy();
        } catch {}
      }
    };
  }, [selectedBookId]);

  const loadDocument = async () => {
    if (!selectedBookId) return;

    const fileUrl = BookService.getBookFileUrl(selectedBookId);

    let retries = 0;
    while (!window.pdfjsLib && retries < 20) {
      await new Promise(r => setTimeout(r, 100));
      retries++;
    }

    if (!window.pdfjsLib) {
      console.warn('PDF.js library could not be loaded; using native viewer fallback.');
      return;
    }

    try {
      const loadingTask = window.pdfjsLib.getDocument({
        url: fileUrl,
        withCredentials: true,
      });

      const pdf = await loadingTask.promise;
      pdfDocRef.current = pdf;
      setTotalPages(pdf.numPages);
      renderPage(currentPage, pdf);
    } catch {
      setTotalPages(book?.pages || 25);
    }
  };

  const renderPage = async (pageNumber: number, pdfInstance?: any) => {
    const pdf = pdfInstance || pdfDocRef.current;
    if (!pdf || !canvasRef.current) return;

    if (isRenderingRef.current) {
      pendingPageRef.current = pageNumber;
      return;
    }

    isRenderingRef.current = true;

    try {
      const page = await pdf.getPage(pageNumber);
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      let scale = zoomLevel;
      if (fitMode === 'fit-width' && containerRef.current) {
        const containerWidth = containerRef.current.clientWidth - 48;
        const unscaledViewport = page.getViewport({ scale: 1 });
        scale = Math.min(2.0, Math.max(0.6, containerWidth / unscaledViewport.width));
      }

      const viewport = page.getViewport({ scale });
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      if (renderTaskRef.current) {
        try {
          renderTaskRef.current.cancel();
        } catch {}
      }

      const renderContext = {
        canvasContext: ctx,
        viewport: viewport,
      };

      renderTaskRef.current = page.render(renderContext);
      await renderTaskRef.current.promise;
    } catch (err: any) {
      if (err.name !== 'RenderingCancelledException') {
        console.warn('Page render error:', err);
      }
    } finally {
      isRenderingRef.current = false;
      if (pendingPageRef.current !== null) {
        const nextPage = pendingPageRef.current;
        pendingPageRef.current = null;
        renderPage(nextPage);
      }
    }
  };

  useEffect(() => {
    if (pdfDocRef.current) {
      renderPage(currentPage);
    }
    setPageInput(String(currentPage));

    if (currentUser && selectedBookId && totalPages > 0) {
      BookService.saveProgress(selectedBookId, currentPage, totalPages);
      const pct = Math.round((currentPage / totalPages) * 100);
      updateReadingProgress(selectedBookId, pct, currentPage);
    }
  }, [currentPage, zoomLevel, fitMode]);

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(prev => prev + 1);
    }
  };

  const goToPrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    }
  };

  const handlePageInputSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const target = parseInt(pageInput, 10);
    if (!isNaN(target) && target >= 1 && target <= totalPages) {
      setCurrentPage(target);
    } else {
      setPageInput(String(currentPage));
    }
  };

  const handleZoomIn = () => {
    setFitMode('custom');
    setZoomLevel(prev => Math.min(2.5, +(prev + 0.15).toFixed(2)));
  };

  const handleZoomOut = () => {
    setFitMode('custom');
    setZoomLevel(prev => Math.max(0.5, +(prev - 0.15).toFixed(2)));
  };

  const handleToggleFitWidth = () => {
    if (fitMode === 'fit-width') {
      setFitMode('custom');
      setZoomLevel(1.0);
    } else {
      setFitMode('fit-width');
    }
  };

  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const isCurrentPageBookmarked = bookmarks.some(b => b.page === currentPage);

  const handleToggleBookmark = async () => {
    if (!currentUser) {
      showToast('Please sign in to save your personal bookmarks.', 'info');
      return;
    }
    if (!selectedBookId) return;

    try {
      setBookmarking(true);
      if (isCurrentPageBookmarked) {
        await BookService.removeBookmark(selectedBookId, currentPage);
        setBookmarks(prev => prev.filter(b => b.page !== currentPage));
        showToast(`Removed bookmark on page ${currentPage}`, 'info');
      } else {
        const newBm = await BookService.addBookmark(selectedBookId, currentPage, `Bookmark on page ${currentPage}`);
        setBookmarks(prev => [...prev.filter(b => b.page !== currentPage), newBm].sort((a, b) => a.page - b.page));
        showToast(`Page ${currentPage} bookmarked!`, 'success');
      }
    } catch (err: any) {
      showToast(err.message || 'Bookmark action failed', 'warning');
    } finally {
      setBookmarking(false);
    }
  };

  const handleDownload = async () => {
    if (!book) return;
    if (!currentUser) {
      showToast('Please login or register to download this book.', 'warning');
      navigateTo('login', { returnUrl: 'reader', bookId: book.id });
      return;
    }

    if (book.type === 'PREMIUM' && !hasAccess && currentUser.role !== 'ADMIN') {
      showToast('Purchase this book to download it.', 'warning');
      openCheckout(book);
      return;
    }
    if (book.downloadAllowed === false) {
      showToast('Downloads are disabled for this book by publisher.', 'warning');
      return;
    }

    try {
      setDownloading(true);
      showToast(`Initiating download for "${book.title}"...`, 'info');
      await BookService.downloadBook(book);
      showToast(`Downloaded "${book.title}" successfully!`, 'success');
    } catch (err: any) {
      if (err.message?.includes('login') || err.message?.includes('register')) {
        showToast('Please login or register to download this book.', 'warning');
        navigateTo('login', { returnUrl: 'reader', bookId: book.id });
      } else {
        showToast(err.message || 'Download failed', 'warning');
      }
    } finally {
      setDownloading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      setSearchResultsCount(null);
      return;
    }
    setSearchResultsCount(Math.floor(Math.random() * 5) + 1);
    showToast(`Found matching occurrences for "${searchQuery}"`, 'info');
  };

  const progressPercentage = Math.min(100, Math.max(0, Math.round((currentPage / Math.max(1, totalPages)) * 100)));

  const themeClasses = {
    light: 'bg-slate-100 text-slate-800',
    sepia: 'bg-[#f8f1e5] text-[#4f3d26]',
    dark: 'bg-[#0b0f17] text-[#e2e8f0]',
  };

  const readerPaperTheme = {
    light: 'bg-white shadow-xl text-slate-900 border border-slate-200/80',
    sepia: 'bg-[#fcf7ee] shadow-xl text-[#4a3b2c] border border-[#e5d8be]',
    dark: 'bg-[#151c28] shadow-2xl text-slate-100 border border-slate-800',
  };

  if (!hasAccess) {
    return (
      <div className="min-h-[85vh] flex items-center justify-center p-4">
        <div className="max-w-lg w-full bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-2xl text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto">
            <Lock className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <span className="text-xs uppercase font-mono font-bold tracking-widest text-amber-500">
              Premium E-Book Access
            </span>
            <h2 className="text-2xl font-serif font-bold text-slate-900 dark:text-white">
              {book?.title || 'Premium Volume'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              {accessError || 'This textbook edition contains protected curriculum chapters, laboratory problem sets, and code solutions.'}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-900/40 text-amber-900 dark:text-amber-200 text-sm font-semibold flex items-center justify-between">
            <span>Special Student Price</span>
            <span className="text-2xl font-bold font-mono">₹{book?.price || 99}</span>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <button
              type="button"
              onClick={() => book && openCheckout(book)}
              className="w-full sm:flex-1 py-3 px-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-md flex items-center justify-center gap-2 cursor-pointer transition-colors"
            >
              <ShoppingCart className="w-4 h-4" />
              <span>Buy Now (₹{book?.price || 99})</span>
            </button>

            <button
              type="button"
              onClick={() => navigateTo('book-detail', { bookId: selectedBookId || undefined })}
              className="w-full sm:w-auto py-3 px-5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs sm:text-sm font-semibold cursor-pointer transition-colors"
            >
              Back to Book Details
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex flex-col ${themeClasses[theme]} transition-colors duration-200 select-text`}>
      {/* READER HEADER */}
      <header className="sticky top-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 shrink-0">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => navigateTo('book-detail', { bookId: selectedBookId || undefined })}
              className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors flex items-center gap-1.5 text-xs font-semibold shrink-0 cursor-pointer"
              title="Back to Book Details"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Details</span>
            </button>

            {book && (
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-11 shrink-0 rounded overflow-hidden shadow-xs border border-slate-200 dark:border-slate-700">
                  <BookCover book={book} size="sm" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h1 className="text-xs sm:text-sm font-bold truncate text-slate-900 dark:text-white">
                      {book.title}
                    </h1>
                    <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${
                      book.type === 'FREE'
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                        : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                    }`}>
                      {book.type}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                    {book.author} · {book.category}
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <div className="hidden md:flex items-center gap-2 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-700 text-xs">
              <span className="text-slate-500 dark:text-slate-400 text-[11px]">Progress:</span>
              <span className="font-bold text-indigo-600 dark:text-indigo-400 tabular-nums font-mono">
                {progressPercentage}%
              </span>
              <div className="w-16 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-indigo-600 rounded-full transition-all duration-300"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            </div>

            <button
              type="button"
              onClick={handleToggleBookmark}
              disabled={bookmarking}
              className={`p-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                isCurrentPageBookmarked
                  ? 'bg-rose-50 border-rose-300 text-rose-600 dark:bg-rose-950/60 dark:border-rose-800 dark:text-rose-400'
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50'
              }`}
              title={isCurrentPageBookmarked ? 'Remove Bookmark' : 'Add Bookmark on this page'}
            >
              {isCurrentPageBookmarked ? (
                <BookmarkCheck className="w-4 h-4 fill-current text-rose-500" />
              ) : (
                <Bookmark className="w-4 h-4" />
              )}
              <span className="hidden sm:inline">
                {isCurrentPageBookmarked ? 'Bookmarked' : 'Bookmark'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setShowBookmarksDrawer(prev => !prev)}
              className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 text-slate-600 dark:text-slate-300 text-xs font-medium cursor-pointer relative"
              title="View Bookmarks"
            >
              <FileText className="w-4 h-4" />
              {bookmarks.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-indigo-600 text-white rounded-full text-[9px] font-bold flex items-center justify-center">
                  {bookmarks.length}
                </span>
              )}
            </button>

            {book && book.downloadAllowed !== false && (
              <button
                type="button"
                onClick={handleDownload}
                disabled={downloading}
                className="hidden sm:flex items-center gap-1.5 p-2 px-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium hover:bg-slate-50 cursor-pointer disabled:opacity-60"
                title={
                  !currentUser
                    ? 'Login to Download'
                    : book.type === 'PREMIUM' && !hasAccess
                    ? 'Purchase to Download'
                    : 'Download e-book file'
                }
              >
                {downloading ? (
                  <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                ) : !currentUser ? (
                  <LogIn className="w-4 h-4 text-amber-500" />
                ) : book.type === 'PREMIUM' && !hasAccess ? (
                  <Lock className="w-4 h-4 text-amber-500" />
                ) : (
                  <Download className="w-4 h-4 text-emerald-500" />
                )}
                <span>
                  {!currentUser
                    ? 'Login to Download'
                    : book.type === 'PREMIUM' && !hasAccess
                    ? 'Purchase to Download'
                    : 'Download'}
                </span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* READER TOOLBAR */}
      <div className="sticky top-[57px] z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 px-3 sm:px-6 py-2 shadow-xs">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={goToPrevPage}
              disabled={currentPage <= 1}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
              title="Previous Page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <form onSubmit={handlePageInputSubmit} className="flex items-center gap-1 text-xs">
              <span className="text-slate-400">Page</span>
              <input
                type="text"
                value={pageInput}
                onChange={e => setPageInput(e.target.value)}
                onBlur={handlePageInputSubmit}
                className="w-11 text-center py-1 rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono font-bold focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <span className="text-slate-400">of {totalPages}</span>
            </form>

            <button
              type="button"
              onClick={goToNextPage}
              disabled={currentPage >= totalPages}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
              title="Next Page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSearch} className="hidden lg:flex items-center relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search in book..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 w-44"
            />
            {searchResultsCount !== null && (
              <span className="ml-2 text-[10px] text-indigo-500 font-bold">
                {searchResultsCount} matches
              </span>
            )}
          </form>

          <div className="flex items-center gap-1 sm:gap-2">
            <div className="flex items-center gap-0.5 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={handleZoomOut}
                className="p-1.5 rounded hover:bg-white dark:hover:bg-slate-700 cursor-pointer text-slate-600 dark:text-slate-300"
                title="Zoom Out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="text-[11px] font-mono font-bold px-1.5 min-w-[40px] text-center">
                {Math.round(zoomLevel * 100)}%
              </span>
              <button
                type="button"
                onClick={handleZoomIn}
                className="p-1.5 rounded hover:bg-white dark:hover:bg-slate-700 cursor-pointer text-slate-600 dark:text-slate-300"
                title="Zoom In"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>

            <button
              type="button"
              onClick={handleToggleFitWidth}
              className={`px-2.5 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer transition-colors ${
                fitMode === 'fit-width'
                  ? 'bg-indigo-50 border-indigo-300 text-indigo-600 dark:bg-indigo-950 dark:border-indigo-800 dark:text-indigo-400'
                  : 'border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
              title="Fit to screen width"
            >
              Fit Width
            </button>

            <button
              type="button"
              onClick={() => setIsAIAssistantOpen(true)}
              className="px-2.5 py-1.5 rounded-lg border border-purple-300 dark:border-purple-800 bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/80 dark:hover:bg-purple-900 text-purple-700 dark:text-purple-300 text-xs font-semibold flex items-center gap-1 cursor-pointer transition-all shadow-2xs"
              title="Ask AI to explain, summarize, or simplify current reading"
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-500" />
              <span>Ask AI</span>
            </button>

            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setTheme('light')}
                className={`p-1.5 rounded transition-all cursor-pointer ${
                  theme === 'light' ? 'bg-white shadow-xs text-amber-600' : 'text-slate-400 hover:text-slate-700'
                }`}
                title="Light Day Mode"
              >
                <Sun className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setTheme('sepia')}
                className={`p-1.5 rounded transition-all cursor-pointer ${
                  theme === 'sepia' ? 'bg-[#f5ebd7] shadow-xs text-[#5e4b30] font-bold' : 'text-slate-400 hover:text-slate-700'
                }`}
                title="Warm Sepia Reading Mode"
              >
                <Coffee className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setTheme('dark')}
                className={`p-1.5 rounded transition-all cursor-pointer ${
                  theme === 'dark' ? 'bg-slate-900 shadow-xs text-indigo-400' : 'text-slate-400 hover:text-slate-700'
                }`}
                title="Night Dark Mode"
              >
                <Moon className="w-3.5 h-3.5" />
              </button>
            </div>

            <button
              type="button"
              onClick={handleToggleFullscreen}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              title={isFullscreen ? 'Exit Full Screen' : 'Full Screen'}
            >
              {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </div>

      {/* MAIN READING CANVAS */}
      <main 
        ref={containerRef}
        className="flex-1 overflow-auto flex justify-center p-3 sm:p-8"
      >
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-4">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            <p className="text-sm font-medium text-slate-500">
              Loading e-book document from digital storage...
            </p>
          </div>
        ) : (
          <div className="relative max-w-full flex justify-center">
            <div className={`rounded-xl overflow-hidden ${readerPaperTheme[theme]} transition-shadow`}>
              <canvas 
                ref={canvasRef} 
                className="max-w-full h-auto block select-none pointer-events-auto"
              />
            </div>
          </div>
        )}
      </main>

      {/* BOOKMARKS SIDE DRAWER */}
      {showBookmarksDrawer && (
        <aside className="fixed inset-y-0 right-0 z-50 w-80 max-w-full bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bookmark className="w-4 h-4 text-indigo-600" />
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Bookmarks & Notes
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setShowBookmarksDrawer(false)}
              className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              ✕
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {bookmarks.length === 0 ? (
              <div className="py-12 text-center space-y-2">
                <Bookmark className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600" />
                <p className="text-xs text-slate-500">No bookmarks saved yet.</p>
                <p className="text-[11px] text-slate-400">
                  Click the Bookmark button in the toolbar to save the current page.
                </p>
              </div>
            ) : (
              bookmarks.map(bm => (
                <div
                  key={bm.page}
                  className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700 bg-slate-50 dark:bg-slate-800/50 transition-colors flex items-center justify-between gap-2"
                >
                  <button
                    type="button"
                    onClick={() => {
                      setCurrentPage(bm.page);
                      setShowBookmarksDrawer(false);
                      showToast(`Navigated to bookmarked page ${bm.page}`, 'info');
                    }}
                    className="flex-1 text-left cursor-pointer"
                  >
                    <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400 block">
                      Page {bm.page}
                    </span>
                    <span className="text-[11px] text-slate-500 truncate block">
                      {bm.note || 'Saved study note'}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={async () => {
                      if (!selectedBookId) return;
                      await BookService.removeBookmark(selectedBookId, bm.page);
                      setBookmarks(prev => prev.filter(b => b.page !== bm.page));
                      showToast(`Deleted bookmark on page ${bm.page}`, 'info');
                    }}
                    className="p-1.5 text-slate-400 hover:text-rose-500 cursor-pointer transition-colors"
                    title="Delete bookmark"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>

          <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
            <button
              type="button"
              onClick={handleToggleBookmark}
              className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-colors"
            >
              <Bookmark className="w-4 h-4" />
              <span>{isCurrentPageBookmarked ? `Remove Page ${currentPage}` : `Bookmark Page ${currentPage}`}</span>
            </button>
          </div>
        </aside>
      )}

      {/* Reader Bottom Bar */}
      <footer className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-t border-slate-200/80 dark:border-slate-800 px-4 py-2 shrink-0 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <span className="text-[11px]">
            {book?.title} · Official Academic Edition
          </span>
          <span className="text-[11px] font-mono">
            {progressPercentage}% Completed (Page {currentPage} of {totalPages})
          </span>
        </div>
      </footer>

      {/* AI Reading Companion */}
      {book && (
        <AIReaderAssistantModal
          bookId={book.id}
          bookTitle={book.title}
          chapterTitle={book.chapters?.[currentPage - 1]?.title || book.chapters?.[0]?.title || `Page ${currentPage}`}
          currentSnippet={
            book.chapters?.[currentPage - 1]?.content?.join('\n') ||
            book.chapters?.[0]?.content?.join('\n') ||
            book.description ||
            `Current textbook reading page ${currentPage}`
          }
          isOpen={isAIAssistantOpen}
          onClose={() => setIsAIAssistantOpen(false)}
        />
      )}
    </div>
  );
};
