import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, 
  Send, 
  Bot, 
  User as UserIcon, 
  RotateCcw, 
  ShieldCheck, 
  Copy, 
  Check, 
  AlertCircle, 
  HelpCircle, 
  Info, 
  Maximize2, 
  Minimize2 
} from 'lucide-react';
import { AIService } from '../services/api';
import { Book } from '../types';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  aiPowered?: boolean;
}

interface AIBookDetailsChatProps {
  book: Book;
  compact?: boolean;
  className?: string;
  onOpenModal?: () => void;
}

const PRESET_QUESTIONS = [
  'What key topics does this book cover?',
  'Is this book suitable for beginners?',
  'What prerequisites should I know first?',
  'Explain the core concept in simple terms',
  'यह पुस्तक किस विषय पर है? (Hindi)',
  'या पुस्तकातून काय शिकायला मिळेल? (Marathi)',
];

export const AIBookDetailsChat: React.FC<AIBookDetailsChatProps> = ({
  book,
  compact = false,
  className = '',
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMessages([
      {
        id: `welcome-${book.id}`,
        role: 'assistant',
        content: `👋 Hello! I am your AI Assistant for **${book.title}** by ${book.author}.\n\nI can answer questions about the curriculum, difficulty level, prerequisites, and key topics based strictly on the verified catalog metadata and descriptions.\n\n*Feel free to ask in English, Hindi, Hinglish, or Marathi!*`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        aiPowered: true,
      },
    ]);
    setErrorMsg(null);
  }, [book.id, book.title, book.author]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = async (customPrompt?: string) => {
    const textToSend = (customPrompt || input).trim();
    if (!textToSend || loading) return;

    setErrorMsg(null);
    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const updatedHistory = [...messages, userMsg];
    setMessages(updatedHistory);
    setInput('');
    setLoading(true);

    try {
      const serverHistory = updatedHistory
        .filter(m => !m.id.startsWith('welcome-'))
        .map(m => ({ role: m.role, content: m.content }));

      const res = await AIService.askBookAssistant(book.id, textToSend, serverHistory);

      const assistantMsg: Message = {
        id: `asst-${Date.now()}`,
        role: 'assistant',
        content: res.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        aiPowered: res.aiPowered,
      };

      setMessages(prev => [...prev, assistantMsg]);
    } catch (err: any) {
      setErrorMsg(
        err.message || 'AI Assistant is temporarily busy. Please try again in a few moments.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setMessages([
      {
        id: `welcome-${book.id}-reset`,
        role: 'assistant',
        content: `Chat history cleared. How can I help you explore **${book.title}**?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        aiPowered: true,
      },
    ]);
    setErrorMsg(null);
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div
      className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden flex flex-col transition-all duration-300 ${
        isExpanded ? 'h-[650px]' : compact ? 'h-[440px]' : 'h-[520px]'
      } ${className}`}
    >
      {/* Header */}
      <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-slate-50 via-purple-50/30 to-indigo-50/30 dark:from-slate-900 dark:via-purple-950/20 dark:to-indigo-950/20 flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-3 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-xs shrink-0">
            <Bot className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center space-x-2">
              <h4 className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm truncate">
                AI Book Assistant
              </h4>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 shrink-0">
                <Sparkles className="w-2.5 h-2.5 mr-1 text-purple-500" />
                Gemini 3.8
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-500 shrink-0" />
              <span>Grounded on verified metadata • Respects Copyright</span>
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-1">
          <button
            type="button"
            onClick={handleClear}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            title="Reset conversation"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          {!compact && (
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              title={isExpanded ? 'Collapse' : 'Expand chat'}
            >
              {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>
          )}
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5 bg-slate-50/50 dark:bg-slate-900/40">
        {messages.map(msg => (
          <div
            key={msg.id}
            className={`flex items-start gap-2.5 ${
              msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'
            }`}
          >
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs shadow-2xs ${
                msg.role === 'user'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gradient-to-tr from-purple-100 to-indigo-100 dark:from-purple-950 dark:to-indigo-950 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800'
              }`}
            >
              {msg.role === 'user' ? <UserIcon className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
            </div>

            <div
              className={`group relative max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm leading-relaxed shadow-2xs ${
                msg.role === 'user'
                  ? 'bg-indigo-600 text-white rounded-tr-none'
                  : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-tl-none border border-slate-200/80 dark:border-slate-700/70'
              }`}
            >
              <div className="whitespace-pre-wrap">{msg.content}</div>

              <div
                className={`mt-1 flex items-center justify-between gap-2 text-[10px] ${
                  msg.role === 'user' ? 'text-indigo-200' : 'text-slate-400 dark:text-slate-400'
                }`}
              >
                <span>{msg.timestamp}</span>
                {msg.role === 'assistant' && (
                  <button
                    type="button"
                    onClick={() => handleCopy(msg.id, msg.content)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                    title="Copy text"
                  >
                    {copiedId === msg.id ? (
                      <Check className="w-3 h-3 text-emerald-500" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-start gap-2.5">
            <div className="w-7 h-7 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-800 flex items-center justify-center shrink-0">
              <Bot className="w-3.5 h-3.5" />
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-2xl rounded-tl-none px-3.5 py-2.5 border border-slate-200 dark:border-slate-700 flex items-center space-x-2">
              <div className="w-1.5 h-1.5 rounded-full bg-purple-600 animate-bounce" />
              <div className="w-1.5 h-1.5 rounded-full bg-purple-600 animate-bounce [animation-delay:0.2s]" />
              <div className="w-1.5 h-1.5 rounded-full bg-purple-600 animate-bounce [animation-delay:0.4s]" />
              <span className="text-xs text-slate-500 dark:text-slate-400 ml-1.5">
                Reviewing metadata with Gemini...
              </span>
            </div>
          </div>
        )}

        {errorMsg && (
          <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 rounded-xl text-xs text-red-600 dark:text-red-400 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div ref={chatBottomRef} />
      </div>

      {/* Suggested Quick Questions */}
      <div className="px-3.5 py-2 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-x-auto no-scrollbar shrink-0">
        <div className="flex items-center gap-1.5 whitespace-nowrap">
          <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1 shrink-0">
            <HelpCircle className="w-3.5 h-3.5 text-purple-500" /> Ask:
          </span>
          {PRESET_QUESTIONS.map((q, idx) => (
            <button
              key={idx}
              type="button"
              disabled={loading}
              onClick={() => handleSend(q)}
              className="px-2.5 py-1 text-[11px] rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-purple-50 dark:hover:bg-purple-950 hover:text-purple-600 dark:hover:text-purple-300 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700 transition-colors cursor-pointer disabled:opacity-50"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Input Form & Copyright Guardrail Footnote */}
      <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 space-y-2">
        <form
          onSubmit={e => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Ask about this book (English, Hindi, Marathi)..."
            disabled={loading}
            className="flex-1 px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-medium text-xs sm:text-sm flex items-center justify-center transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-xs shrink-0 cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>

        <div className="flex items-center justify-between text-[10px] text-slate-400 px-1">
          <span className="flex items-center gap-1">
            <Info className="w-3 h-3 text-slate-400 shrink-0" />
            AI answers strictly synthesize verified book metadata. Full text is protected by copyright.
          </span>
          <span className="hidden sm:inline text-purple-600 dark:text-purple-400 font-medium">
            Multilingual Ready
          </span>
        </div>
      </div>
    </div>
  );
};
