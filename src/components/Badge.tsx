import React from 'react';
import { BookType } from '../types';

interface BadgeProps {
  type: BookType | 'NEW' | 'POPULAR' | 'RATING';
  value?: string | number;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ type, value, className = '' }) => {
  if (type === 'FREE') {
    return (
      <span
        className={`inline-flex items-center px-2 py-0.5 text-xs font-semibold uppercase tracking-wider rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800/80 ${className}`}
      >
        FREE
      </span>
    );
  }

  if (type === 'PREMIUM') {
    return (
      <span
        className={`inline-flex items-center px-2 py-0.5 text-xs font-semibold uppercase tracking-wider rounded bg-amber-100 text-amber-900 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300 dark:border-amber-800/80 ${className}`}
      >
        PREMIUM
      </span>
    );
  }

  if (type === 'NEW') {
    return (
      <span
        className={`inline-flex items-center px-2 py-0.5 text-xs font-medium uppercase tracking-wider rounded bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-800 ${className}`}
      >
        NEW
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200 ${className}`}
    >
      {value}
    </span>
  );
};
