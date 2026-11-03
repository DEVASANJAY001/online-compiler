import React from 'react'
import {
  Code2,
  Play,
  Sun,
  Moon,
  Layers,
  HelpCircle,
  Sparkles,
  BookOpen,
  ArrowRight,
} from 'lucide-react'
import { navigateTo, type AppRoute } from '../router'
import type { Language } from '../types'
import { renderLanguageIcon } from './LanguageStrip'

interface SeoNavProps {
  currentRoute: AppRoute
  theme: 'dark' | 'light'
  onToggleTheme: () => void
  onLaunchCompiler?: (lang?: Language) => void
}

export const SeoNav: React.FC<SeoNavProps> = ({
  currentRoute,
  theme,
  onToggleTheme,
  onLaunchCompiler,
}) => {
  const languages: Array<{ id: Language; path: string; label: string }> = [
    { id: 'python', path: '/python', label: 'Python' },
    { id: 'c', path: '/c', label: 'C' },
    { id: 'cpp', path: '/cpp', label: 'C++' },
    { id: 'java', path: '/java', label: 'Java' },
    { id: 'javascript', path: '/javascript', label: 'JavaScript' },
  ]

  const navLinks = [
    { path: '/features', label: 'Features', icon: Sparkles },
    { path: '/templates', label: 'Templates', icon: Layers },
    { path: '/faq', label: 'FAQ', icon: HelpCircle },
    { path: '/docs', label: 'Docs', icon: BookOpen },
  ]

  const handleNavClick = (e: React.MouseEvent, path: string) => {
    e.preventDefault()
    navigateTo(path)
  }

  const handleLaunchClick = () => {
    if (onLaunchCompiler) {
      onLaunchCompiler()
    } else {
      navigateTo('/')
    }
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md transition-colors select-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <a
          href="/"
          onClick={(e) => handleNavClick(e, '/')}
          className="flex items-center gap-2.5 font-bold text-lg sm:text-xl tracking-tight cursor-pointer shrink-0"
        >
          <div className="h-8 w-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-mono font-bold text-sm shadow-xs">
            &lt;/&gt;
          </div>
          <span className="text-slate-900 dark:text-white">
            Code<span className="text-indigo-600 dark:text-indigo-400">Space</span>
          </span>
          <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            WASM Online
          </span>
        </a>

        {/* Center Navigation Links (Desktop) */}
        <nav className="hidden lg:flex items-center gap-1">
          {/* Languages Dropdown / Buttons */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800/80 p-1 rounded-lg border border-slate-200/80 dark:border-slate-700/80 text-xs font-medium">
            {languages.map((lang) => {
              const isActive = currentRoute === lang.id
              return (
                <a
                  key={lang.id}
                  href={lang.path}
                  onClick={(e) => handleNavClick(e, lang.path)}
                  className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1.5 cursor-pointer ${
                    isActive
                      ? 'bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-300 shadow-xs font-semibold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <span className="w-3.5 h-3.5 flex items-center justify-center">
                    {renderLanguageIcon(lang.id, 'w-3 h-3')}
                  </span>
                  <span>{lang.label}</span>
                </a>
              )
            })}
          </div>

          <div className="h-5 w-px bg-slate-200 dark:bg-slate-800 mx-2" />

          {/* Content Pages */}
          {navLinks.map((link) => {
            const Icon = link.icon
            const isActive = currentRoute === link.path.replace('/', '')
            return (
              <a
                key={link.path}
                href={link.path}
                onClick={(e) => handleNavClick(e, link.path)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition flex items-center gap-1.5 ${
                  isActive
                    ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 font-semibold'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{link.label}</span>
              </a>
            )
          })}
        </nav>

        {/* Right Action: Launch Compiler & Theme */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <button
            onClick={onToggleTheme}
            className="p-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
          </button>

          <button
            onClick={handleLaunchClick}
            className="flex items-center gap-1.5 px-3.5 sm:px-4 py-2 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white text-xs sm:text-sm font-semibold rounded-lg shadow-sm hover:shadow-indigo-500/20 active:scale-95 transition-all cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Launch IDE</span>
            <ArrowRight className="w-3.5 h-3.5 hidden sm:inline" />
          </button>
        </div>
      </div>

      {/* Mobile Sub-Navigation Bar */}
      <div className="lg:hidden flex items-center overflow-x-auto scrollbar-none px-4 py-2 border-t border-slate-100 dark:border-slate-800 gap-1.5 bg-slate-50/50 dark:bg-slate-900/50 text-xs">
        {languages.map((lang) => (
          <a
            key={lang.id}
            href={lang.path}
            onClick={(e) => handleNavClick(e, lang.path)}
            className={`px-2.5 py-1 rounded-md shrink-0 transition flex items-center gap-1 ${
              currentRoute === lang.id
                ? 'bg-indigo-600 text-white font-semibold'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
            }`}
          >
            {renderLanguageIcon(lang.id, 'w-3 h-3')}
            <span>{lang.label}</span>
          </a>
        ))}
        <span className="text-slate-300 dark:text-slate-700 shrink-0">|</span>
        {navLinks.map((link) => (
          <a
            key={link.path}
            href={link.path}
            onClick={(e) => handleNavClick(e, link.path)}
            className={`px-2 py-1 rounded-md shrink-0 transition ${
              currentRoute === link.path.replace('/', '')
                ? 'bg-slate-200 dark:bg-slate-800 font-semibold text-slate-900 dark:text-white'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            {link.label}
          </a>
        ))}
      </div>
    </header>
  )
}
