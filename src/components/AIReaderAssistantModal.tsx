import React, { useState } from 'react';
import { Sparkles, X, Lightbulb, FileText, Smile, HelpCircle, Send, Loader2, Bot, AlertCircle, Copy, Check } from 'lucide-react';
import { AIService } from '../services/api';

interface AIReaderAssistantModalProps {
  bookId: string;
  bookTitle: string;
  chapterTitle?: string;
  currentSnippet: string;
  isOpen: boolean;
  onClose: () => void;
}

export const AIReaderAssistantModal: React.FC<AIReaderAssistantModalProps> = ({
  bookId,
  bookTitle,
  chapterTitle,
  currentSnippet,
  isOpen,
  onClose,
}) => {
  const [action, setAction] = useState<'explain' | 'summarize' | 'simplify' | 'ask'>('explain');
  const [userQuestion, setUserQuestion] = useState('');
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleAction = async (targetAction: 'explain' | 'summarize' | 'simplify' | 'ask', customQ?: string) => {
    setAction(targetAction);
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await AIService.askReaderAssistant({
        bookId,
        chapterTitle,
        snippet: currentSnippet,
        action: targetAction,
        userQuestion: customQ || userQuestion,
      });
      setResult(res.result);
    } catch (err: any) {
      setError(err.message || 'AI Reader Assistant is temporarily unavailable.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (result) {
      navigator.clipboard.writeText(result);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div className="w-full max-w-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/90 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white text-sm">
                AI Reading Companion
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-xs">
                {chapterTitle || bookTitle}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action Tabs / Quick Actions */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40">
          <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-2">
            Select Reading Assistance Mode:
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button
              onClick={() => handleAction('explain')}
              className={`p-2 rounded-xl text-xs font-medium flex flex-col items-center justify-center gap-1 border transition-all cursor-pointer ${
                action === 'explain'
                  ? 'bg-indigo-50 dark:bg-indigo-950 border-indigo-500 text-indigo-700 dark:text-indigo-300 font-semibold shadow-xs'
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-indigo-300'
              }`}
            >
              <Lightbulb className="w-4 h-4 text-amber-500" />
              <span>Explain</span>
            </button>

            <button
              onClick={() => handleAction('summarize')}
              className={`p-2 rounded-xl text-xs font-medium flex flex-col items-center justify-center gap-1 border transition-all cursor-pointer ${
                action === 'summarize'
                  ? 'bg-indigo-50 dark:bg-indigo-950 border-indigo-500 text-indigo-700 dark:text-indigo-300 font-semibold shadow-xs'
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-indigo-300'
              }`}
            >
              <FileText className="w-4 h-4 text-blue-500" />
              <span>Summarize</span>
            </button>

            <button
              onClick={() => handleAction('simplify')}
              className={`p-2 rounded-xl text-xs font-medium flex flex-col items-center justify-center gap-1 border transition-all cursor-pointer ${
                action === 'simplify'
                  ? 'bg-indigo-50 dark:bg-indigo-950 border-indigo-500 text-indigo-700 dark:text-indigo-300 font-semibold shadow-xs'
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-indigo-300'
              }`}
            >
              <Smile className="w-4 h-4 text-emerald-500" />
              <span>Simplify</span>
            </button>

            <button
              onClick={() => setAction('ask')}
              className={`p-2 rounded-xl text-xs font-medium flex flex-col items-center justify-center gap-1 border transition-all cursor-pointer ${
                action === 'ask'
                  ? 'bg-indigo-50 dark:bg-indigo-950 border-indigo-500 text-indigo-700 dark:text-indigo-300 font-semibold shadow-xs'
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-indigo-300'
              }`}
            >
              <HelpCircle className="w-4 h-4 text-purple-500" />
              <span>Ask Question</span>
            </button>
          </div>
        </div>

        {/* Custom Question Box (if action === 'ask') */}
        {action === 'ask' && (
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
            <form
              onSubmit={e => {
                e.preventDefault();
                if (userQuestion.trim()) handleAction('ask', userQuestion);
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={userQuestion}
                onChange={e => setUserQuestion(e.target.value)}
                placeholder="Ask about this specific concept (English, Hindi, Marathi)..."
                className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="submit"
                disabled={!userQuestion.trim() || loading}
                className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-medium transition-colors disabled:opacity-50 flex items-center gap-1 shrink-0 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        )}

        {/* Active Snippet & Response Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Active Context Snippet */}
          <div className="p-3 bg-slate-100 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300">
            <span className="font-semibold text-slate-800 dark:text-slate-200 block mb-1">
              Active Reading Context:
            </span>
            <p className="italic line-clamp-3 leading-relaxed">
              "{currentSnippet || 'Current chapter section'}"
            </p>
          </div>

          {/* Loader */}
          {loading && (
            <div className="py-8 flex flex-col items-center justify-center text-center">
              <Loader2 className="w-6 h-6 text-indigo-600 dark:text-indigo-400 animate-spin mb-2" />
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Synthesizing response with Gemini AI...
              </p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 rounded-xl text-xs text-red-600 dark:text-red-400 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* AI Result Card */}
          {result && !loading && (
            <div className="p-4 rounded-xl bg-gradient-to-br from-indigo-50/70 via-purple-50/40 to-slate-50 dark:from-indigo-950/30 dark:via-purple-950/20 dark:to-slate-900 border border-indigo-100 dark:border-indigo-900/40 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> AI Explanation
                </span>
                <button
                  onClick={handleCopy}
                  className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs flex items-center gap-1 cursor-pointer"
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                  <span className="text-[10px]">{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <div className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">
                {result}
              </div>
            </div>
          )}

          {!result && !loading && !error && (
            <div className="py-6 text-center text-xs text-slate-400">
              Click an action above to get an instant explanation, summary, or simplification of your current reading.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
