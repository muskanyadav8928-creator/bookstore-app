import React, { useState, useEffect } from 'react';
import { 
  X, 
  BookOpen, 
  Sun, 
  Moon, 
  Coffee, 
  ZoomIn, 
  ZoomOut, 
  ChevronLeft, 
  ChevronRight,
  Download,
  List,
  CheckCircle2,
  Loader2,
  Lock,
  LogIn
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { BookService } from '../services/api';

export const BookReaderModal: React.FC = () => {
  const { 
    readerBook, 
    closeReader, 
    showToast, 
    refreshBooks, 
    navigateTo, 
    currentUser, 
    purchaseHistory, 
    openCheckout 
  } = useApp();
  const [readingTheme, setReadingTheme] = useState<'light' | 'sepia' | 'dark'>('light');
  const [fontSize, setFontSize] = useState<number>(16);
  const [currentChapterIndex, setCurrentChapterIndex] = useState<number>(0);
  const [showToc, setShowToc] = useState<boolean>(false);
  const [downloading, setDownloading] = useState<boolean>(false);

  useEffect(() => {
    if (readerBook?.id) {
      BookService.recordBookView(readerBook.id);
    }
  }, [readerBook?.id]);

  if (!readerBook) return null;

  const isPurchased = currentUser?.role === 'ADMIN' || purchaseHistory.some(p => p.bookId === readerBook.id && (p.status === 'Completed' || p.status === 'PAID'));

  const chapters = readerBook.chapters && readerBook.chapters.length > 0
    ? readerBook.chapters
    : [
        {
          id: 'def-1',
          title: 'Chapter 1: Foundations & Core Concepts',
          readTime: '10 min',
          content: [
            `Welcome to the digital reader edition of "${readerBook.title}". This e-book is part of the college open-access repository for computer science students.`,
            readerBook.description,
            'In subsequent chapters, theoretical proofs, algorithm traces, and practical programming exercises accompany each module. Study notes can be highlighted and bookmarked in your Student Library.',
          ],
        },
      ];

  const activeChapter = chapters[currentChapterIndex] || chapters[0];

  const handleDownload = async () => {
    if (!currentUser) {
      showToast('Please login or register to download this book.', 'warning');
      closeReader();
      navigateTo('login', { returnUrl: 'book-detail', bookId: readerBook.id });
      return;
    }

    if (readerBook.type === 'PREMIUM' && !isPurchased) {
      showToast('Purchase this book to download it.', 'warning');
      closeReader();
      openCheckout(readerBook);
      return;
    }

    if (readerBook.downloadAllowed === false) {
      showToast('Offline download is restricted for this book by publisher.', 'warning');
      return;
    }

    try {
      setDownloading(true);
      showToast(`Initiating download for "${readerBook.title}"...`, 'info');
      await BookService.downloadBook(readerBook);
      showToast(`Downloaded "${readerBook.title}" successfully!`, 'success');
      refreshBooks();
    } catch (err: any) {
      if (err.message?.includes('login') || err.message?.includes('register')) {
        showToast('Please login or register to download this book.', 'warning');
        closeReader();
        navigateTo('login', { returnUrl: 'book-detail', bookId: readerBook.id });
      } else {
        showToast(err.message || 'Failed to download document', 'warning');
      }
    } finally {
      setDownloading(false);
    }
  };

  const themeClasses = {
    light: 'bg-white text-slate-800',
    sepia: 'bg-[#fbf0d9] text-[#5f4b32]',
    dark: 'bg-[#0f172a] text-[#e2e8f0]',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200">
      <div className={`relative w-full max-w-4xl h-[92vh] max-h-[850px] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-700/30 ${themeClasses[readingTheme]}`}>
        {/* Top Control Bar */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-black/10 dark:border-white/10 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setShowToc(prev => !prev)}
              className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
              title="Table of Contents"
            >
              <List className="w-4 h-4" />
              <span className="hidden sm:inline">Chapters</span>
            </button>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-bold truncate">
                {readerBook.title}
              </h3>
              <p className="text-[11px] opacity-70 truncate">
                {readerBook.author} · {activeChapter.title}
              </p>
            </div>
          </div>

          {/* Reader Preferences */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            {/* Font Size Adjusters */}
            <div className="flex items-center gap-0.5 bg-black/5 dark:bg-white/5 rounded-lg p-0.5">
              <button
                type="button"
                onClick={() => setFontSize(prev => Math.max(13, prev - 1))}
                className="p-1.5 rounded hover:bg-black/10 dark:hover:bg-white/10 cursor-pointer text-xs"
                title="Decrease font size"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="text-[11px] font-mono px-1 font-bold">
                {fontSize}px
              </span>
              <button
                type="button"
                onClick={() => setFontSize(prev => Math.min(24, prev + 1))}
                className="p-1.5 rounded hover:bg-black/10 dark:hover:bg-white/10 cursor-pointer text-xs"
                title="Increase font size"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Reading Theme Toggle */}
            <div className="flex items-center gap-1 bg-black/5 dark:bg-white/5 rounded-lg p-0.5">
              <button
                type="button"
                onClick={() => setReadingTheme('light')}
                className={`p-1.5 rounded transition-all cursor-pointer ${
                  readingTheme === 'light' ? 'bg-white shadow-xs text-slate-900' : 'opacity-60'
                }`}
                title="Light reading mode"
              >
                <Sun className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setReadingTheme('sepia')}
                className={`p-1.5 rounded transition-all cursor-pointer ${
                  readingTheme === 'sepia' ? 'bg-[#fbf0d9] text-[#5f4b32] font-bold shadow-xs' : 'opacity-60'
                }`}
                title="Sepia warm mode"
              >
                <Coffee className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setReadingTheme('dark')}
                className={`p-1.5 rounded transition-all cursor-pointer ${
                  readingTheme === 'dark' ? 'bg-slate-900 text-white shadow-xs' : 'opacity-60'
                }`}
                title="Night reading mode"
              >
                <Moon className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Download Button */}
            {readerBook.downloadAllowed !== false && (
              <button
                type="button"
                onClick={handleDownload}
                disabled={downloading}
                className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer disabled:opacity-60"
                title={
                  !currentUser
                    ? 'Login to Download'
                    : readerBook.type === 'PREMIUM' && !isPurchased
                    ? 'Purchase to Download'
                    : 'Download Book'
                }
              >
                {downloading ? (
                  <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                ) : !currentUser ? (
                  <LogIn className="w-4 h-4 text-amber-500" />
                ) : readerBook.type === 'PREMIUM' && !isPurchased ? (
                  <Lock className="w-4 h-4 text-amber-500" />
                ) : (
                  <Download className="w-4 h-4 text-emerald-500" />
                )}
              </button>
            )}

            {/* Switch to Dedicated Fullscreen Reader */}
            <button
              type="button"
              onClick={() => {
                closeReader();
                navigateTo('reader', { bookId: readerBook.id });
              }}
              className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors text-indigo-600 dark:text-indigo-400 font-semibold text-xs flex items-center gap-1 cursor-pointer"
              title="Open in Dedicated Reader Page"
            >
              <BookOpen className="w-4 h-4" />
              <span className="hidden sm:inline">Dedicated Reader</span>
            </button>

            {/* Close */}
            <button
              type="button"
              onClick={closeReader}
              className="p-1.5 rounded-lg hover:bg-rose-100 hover:text-rose-600 dark:hover:bg-rose-950/50 dark:hover:text-rose-400 transition-colors ml-1 cursor-pointer"
              title="Close reader"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Area with Optional Table of Contents Sidebar */}
        <div className="relative flex-1 flex overflow-hidden">
          {/* Chapter Drawer */}
          {showToc && (
            <div className="w-64 sm:w-72 shrink-0 border-r border-black/10 dark:border-white/10 p-4 overflow-y-auto bg-black/5 dark:bg-black/20">
              <h4 className="text-xs font-bold uppercase tracking-wider mb-3 opacity-70">
                Table of Contents ({chapters.length} Chapters)
              </h4>
              <div className="space-y-1.5">
                {chapters.map((ch, idx) => (
                  <button
                    key={ch.id}
                    onClick={() => {
                      setCurrentChapterIndex(idx);
                      setShowToc(false);
                    }}
                    className={`w-full text-left p-2.5 rounded-lg text-xs transition-colors cursor-pointer flex items-start gap-2 ${
                      idx === currentChapterIndex
                        ? 'bg-indigo-600 text-white font-semibold shadow-xs'
                        : 'hover:bg-black/5 dark:hover:bg-white/5 opacity-85'
                    }`}
                  >
                    <BookOpen className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    <div>
                      <p className="line-clamp-2 leading-tight">{ch.title}</p>
                      <p className={`text-[10px] mt-0.5 ${idx === currentChapterIndex ? 'text-indigo-200' : 'opacity-60'}`}>
                        {ch.readTime} read
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Book Reading Text Canvas */}
          <div className="flex-1 overflow-y-auto p-6 sm:p-10 lg:p-14">
            <div className="max-w-2xl mx-auto space-y-6">
              {/* Chapter Header */}
              <div className="pb-6 border-b border-black/10 dark:border-white/10">
                <span className="text-xs uppercase tracking-widest font-semibold opacity-60">
                  {readerBook.category} · Academic Reading Mode
                </span>
                <h1 className="font-serif text-xl sm:text-2xl lg:text-3xl font-bold mt-2 leading-tight">
                  {activeChapter.title}
                </h1>
                <p className="text-xs opacity-60 mt-1">
                  Estimated read time: {activeChapter.readTime} · Pages 1 - {readerBook.pages}
                </p>
              </div>

              {/* Chapter Content Paragraphs */}
              <div
                className="space-y-5 leading-relaxed tracking-normal font-serif select-text"
                style={{ fontSize: `${fontSize}px` }}
              >
                {activeChapter.content.map((paragraph, idx) => (
                  <p key={idx} className="first-letter:text-2xl first-letter:font-bold">
                    {paragraph}
                  </p>
                ))}
              </div>

              {/* Academic Footnote / Project Notice */}
              <div className="mt-12 p-4 rounded-xl border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 text-xs space-y-2">
                <div className="flex items-center gap-1.5 font-bold text-indigo-600 dark:text-indigo-400">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Interactive Reader Preview</span>
                </div>
                <p className="opacity-80 leading-relaxed">
                  You can also switch to the dedicated full-page reader with bookmarks, progress sync, theme toggling, and PDF support.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Pagination & Progress Bar */}
        <div className="px-4 sm:px-6 py-2.5 border-t border-black/10 dark:border-white/10 flex items-center justify-between shrink-0 text-xs">
          <button
            type="button"
            onClick={() => setCurrentChapterIndex(prev => Math.max(0, prev - 1))}
            disabled={currentChapterIndex === 0}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed font-medium cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Previous Chapter</span>
          </button>

          <div className="text-center font-mono text-[11px] opacity-75">
            Chapter {currentChapterIndex + 1} of {chapters.length}
          </div>

          <button
            type="button"
            onClick={() => setCurrentChapterIndex(prev => Math.min(chapters.length - 1, prev + 1))}
            disabled={currentChapterIndex === chapters.length - 1}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed font-medium cursor-pointer"
          >
            <span>Next Chapter</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
