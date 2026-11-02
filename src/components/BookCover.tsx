import React from 'react';
import { Book } from '../types';
import { 
  Network, 
  Code, 
  Cpu, 
  Grid, 
  Database, 
  ShieldCheck, 
  Sigma, 
  Brain, 
  BookOpen 
} from 'lucide-react';

interface BookCoverProps {
  book: Book;
  size?: 'sm' | 'md' | 'lg' | 'hero';
  className?: string;
  showSpine?: boolean;
}

export const BookCover: React.FC<BookCoverProps> = ({
  book,
  size = 'md',
  className = '',
  showSpine = true,
}) => {
  const isFree = book.type === 'FREE' || book.bookType === 'FREE';
  const theme = book.coverTheme || {
    gradient: isFree
      ? 'from-blue-900 via-indigo-950 to-slate-900'
      : 'from-amber-950 via-slate-950 to-stone-900',
    accent: isFree ? '#38bdf8' : '#fbbf24',
    pattern: 'network' as const,
  };

  const getPatternIcon = () => {
    switch (theme.pattern) {
      case 'network':
        return <Network className="w-full h-full opacity-25" />;
      case 'code':
        return <Code className="w-full h-full opacity-25" />;
      case 'circuit':
        return <Cpu className="w-full h-full opacity-25" />;
      case 'grid':
        return <Grid className="w-full h-full opacity-25" />;
      case 'database':
        return <Database className="w-full h-full opacity-25" />;
      case 'shield':
        return <ShieldCheck className="w-full h-full opacity-25" />;
      case 'math':
        return <Sigma className="w-full h-full opacity-25" />;
      case 'ai':
        return <Brain className="w-full h-full opacity-25" />;
      default:
        return <BookOpen className="w-full h-full opacity-25" />;
    }
  };

  const sizeClasses = {
    sm: 'w-24 h-34 text-[10px]',
    md: 'w-full aspect-[3/4] max-w-[240px] text-xs',
    lg: 'w-full aspect-[3/4] max-w-[320px] text-sm',
    hero: 'w-64 h-88 sm:w-72 sm:h-96 md:w-80 md:h-[420px] text-sm',
  };

  return (
    <div
      className={`relative select-none rounded-r-md rounded-l-sm overflow-hidden shadow-lg transition-transform duration-300 group-hover:scale-[1.02] flex flex-col justify-between p-4 bg-gradient-to-br ${theme.gradient} text-white font-sans ${sizeClasses[size]} ${className}`}
      style={{
        boxShadow:
          '0 10px 25px -5px rgba(0, 0, 0, 0.4), 0 8px 10px -6px rgba(0, 0, 0, 0.3)',
      }}
    >
      {/* Book Spine Crease & Lighting Effect */}
      {showSpine && (
        <div className="absolute top-0 bottom-0 left-0 w-3 bg-gradient-to-r from-black/40 via-white/10 to-transparent pointer-events-none z-10" />
      )}
      <div className="absolute top-0 bottom-0 left-3 w-[1px] bg-black/25 pointer-events-none z-10" />

      {/* Background Vector Art Pattern */}
      <div className="absolute inset-0 p-6 flex items-center justify-center overflow-hidden pointer-events-none">
        <div
          className="w-36 h-36 md:w-44 md:h-44 transition-transform duration-500 group-hover:scale-110"
          style={{ color: theme.accent }}
        >
          {getPatternIcon()}
        </div>
      </div>

      {/* Geometric Decorative Borders */}
      <div className="absolute inset-2 border border-white/10 rounded-sm pointer-events-none" />

      {/* Header Info: Category Ribbon & Publisher */}
      <div className="relative z-10 flex items-start justify-between">
        <span
          className="text-[9px] md:text-[10px] font-bold tracking-widest uppercase py-0.5 px-1.5 rounded bg-black/35 backdrop-blur-xs border border-white/10"
          style={{ color: theme.accent }}
        >
          {book.category}
        </span>
        <span className="text-[9px] font-mono text-white/50 tracking-wider">
          {(book.edition || 'Ed.').split(' ')[0]}
        </span>
      </div>

      {/* Center: Book Title */}
      <div className="relative z-10 my-auto py-2">
        <h3 className="font-serif font-bold tracking-tight text-white leading-snug drop-shadow-sm line-clamp-3 text-sm md:text-base">
          {book.title}
        </h3>
        <div
          className="h-0.5 w-8 my-2 rounded-full"
          style={{ backgroundColor: theme.accent }}
        />
      </div>

      {/* Bottom: Author & Monogram */}
      <div className="relative z-10 pt-2 border-t border-white/15 flex items-end justify-between">
        <div className="min-w-0 pr-2">
          <p className="text-[10px] md:text-xs text-white/90 font-medium truncate">
            {book.author}
          </p>
          <p className="text-[8px] md:text-[9px] text-white/50 truncate">
            {book.publisher}
          </p>
        </div>
        <div
          className="shrink-0 w-5 h-5 rounded-full border border-white/20 flex items-center justify-center text-[8px] font-mono font-bold"
          style={{ color: theme.accent }}
        >
          BS
        </div>
      </div>

      {/* Type corner indicator */}
      <div className="absolute top-2 right-2 z-10">
        <span
          className={`text-[8px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${
            book.type === 'FREE'
              ? 'bg-emerald-500/90 text-white'
              : 'bg-amber-500/90 text-slate-950 font-extrabold'
          }`}
        >
          {book.type}
        </span>
      </div>
    </div>
  );
};
