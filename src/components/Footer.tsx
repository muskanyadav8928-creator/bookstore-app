import React from 'react';
import { 
  Github, 
  Linkedin, 
  Twitter, 
  GraduationCap, 
  Code
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export const Footer: React.FC = () => {
  const { navigateTo, setSelectedType } = useApp();

  return (
    <footer className="w-full bg-slate-900 text-slate-300 border-t border-slate-800 transition-colors">
      {/* College Project Banner */}
      <div className="bg-indigo-950/80 border-b border-indigo-900/50 py-2.5 px-4 text-center">
        <p className="text-xs text-indigo-200 flex items-center justify-center gap-1.5 flex-wrap">
          <GraduationCap className="w-4 h-4 text-indigo-400 shrink-0" />
          <span>B.Sc. Computer Science Final Year Project</span>
          <span className="text-indigo-400">·</span>
          <span className="font-semibold text-white">Book Store Management System</span>
          <span className="text-indigo-400">·</span>
          <span className="bg-indigo-800/80 text-[10px] font-mono uppercase px-2 py-0.5 rounded text-indigo-100">
            Full-Stack React, Express, MongoDB & Gemini AI
          </span>
        </p>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12">
          {/* Brand Info */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-5 h-5"
                >
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                </svg>
              </div>
              <div>
                <span className="font-serif text-xl font-bold text-white tracking-tight">
                  BookStore
                </span>
                <p className="text-xs text-indigo-400 font-medium">Read. Learn. Explore.</p>
              </div>
            </div>

            <p className="text-sm text-slate-400 max-w-sm leading-relaxed">
              A modern digital bookstore management system tailored for computer science students and educators, offering curated free textbooks and high-grade premium technical volumes.
            </p>

            <div className="flex items-center gap-3 pt-2">
              <a
                href="#github"
                onClick={e => e.preventDefault()}
                className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-indigo-600 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
                aria-label="GitHub Repository"
                title="GitHub Repo"
              >
                <Github className="w-4 h-4" />
              </a>
              <a
                href="#linkedin"
                onClick={e => e.preventDefault()}
                className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-indigo-600 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
                aria-label="LinkedIn"
                title="LinkedIn"
              >
                <Linkedin className="w-4 h-4" />
              </a>
              <a
                href="#twitter"
                onClick={e => e.preventDefault()}
                className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-indigo-600 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
                aria-label="Twitter"
                title="Twitter"
              >
                <Twitter className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4">
              Explore Books
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <button
                  onClick={() => navigateTo('books')}
                  className="text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  All Books
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    setSelectedType('FREE');
                    navigateTo('books');
                  }}
                  className="text-slate-400 hover:text-emerald-400 transition-colors cursor-pointer"
                >
                  Free E-Books (₹0)
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    setSelectedType('PREMIUM');
                    navigateTo('books');
                  }}
                  className="text-slate-400 hover:text-amber-400 transition-colors cursor-pointer"
                >
                  Premium E-Books
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigateTo('categories')}
                  className="text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  Categories Directory
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigateTo('library')}
                  className="text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  Student Library
                </button>
              </li>
            </ul>
          </div>

          {/* Project & About */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4">
              Project Architecture
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <span className="text-slate-400 hover:text-white transition-colors">
                  About Project
                </span>
              </li>
              <li>
                <span className="text-slate-400 hover:text-white transition-colors">
                  Frontend: React 19 & Tailwind CSS
                </span>
              </li>
              <li>
                <span className="text-slate-400 hover:text-white transition-colors">
                  Backend: Express, MongoDB & JWT
                </span>
              </li>
              <li>
                <span className="text-slate-400 hover:text-white transition-colors">
                  Payment: Razorpay & Demo Sandbox
                </span>
              </li>
              <li>
                <span className="text-slate-400 hover:text-white transition-colors">
                  AI: Gemini 3.8 Intelligence Engine
                </span>
              </li>
            </ul>
          </div>

          {/* Legal & Compliance */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4">
              Information & Legal
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <span className="text-slate-400 hover:text-white transition-colors">
                  Contact Department
                </span>
              </li>
              <li>
                <span className="text-slate-400 hover:text-white transition-colors">
                  Privacy Policy
                </span>
              </li>
              <li>
                <span className="text-slate-400 hover:text-white transition-colors">
                  Terms & Conditions
                </span>
              </li>
              <li>
                <span className="text-slate-400 hover:text-white transition-colors">
                  Fair Use & Academic License
                </span>
              </li>
              <li>
                <span className="text-slate-400 hover:text-white transition-colors">
                  Feedback & Issue Tracker
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© 2026 BookStore (Book Store Management System). All rights reserved.</p>
          <div className="flex items-center gap-4">
            <span className="inline-flex items-center gap-1 text-slate-400">
              <Code className="w-3.5 h-3.5 text-indigo-400" />
              Crafted for B.Sc. Computer Science
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};
