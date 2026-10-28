import React from 'react'
import type { Language } from '../types'
import { Settings as SettingsIcon, Code2 } from 'lucide-react'

interface LanguageStripProps {
  currentLanguage: Language
  onLanguageChange: (lang: Language) => void
  onOpenSettings: () => void
  disabled?: boolean
}

// Authentic official programming language vector logos with transparent backgrounds
export const JavaLogo: React.FC<{ className?: string }> = ({ className = 'w-5 h-5 drop-shadow-xs' }) => (
  <svg viewBox="0 0 32 32" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Steam swirls (Oracle Java red/orange brand colors) */}
    <path
      d="M11.8 3.5c1.2 1.4-.4 2.9-1.6 4-1.1 1.2-1.7 2.4-1.1 3.5.4-.7 1.1-1.3 1.8-1.8 1.4-1.2 2.3-2.5 1.7-4.2-.2-.5-.4-1-.8-1.5z"
      fill="#E76F00"
    />
    <path
      d="M16.2 5.2c.6 1.1-.2 2.3-1.1 3.2-.9 1-1.4 1.9-1 2.8.4-.5.9-1 1.5-1.4 1.1-.9 1.8-1.9 1.4-3.1-.2-.5-.5-.9-.8-1.5z"
      fill="#EA2D2E"
    />
    <path
      d="M13.5 10c.5.8-.1 1.6-.7 2.2-.6.7-1 1.3-.7 1.9.3-.4.6-.7 1-1 .8-.6 1.2-1.3.9-2.1-.1-.3-.3-.7-.5-1z"
      fill="#F5821F"
    />
    {/* Cup rim line */}
    <path d="M9.8 14.2c3.5 1.4 8.9 1.4 12.4 0-2.2.8-10.2.8-12.4 0z" fill="#E76F00" />
    {/* Blue Cup body */}
    <path
      d="M6.5 16.8c1.2 5.2 5.2 8.7 9.5 8.7 4.3 0 8.3-3.5 9.5-8.7H6.5z"
      fill="#5382A1"
    />
    {/* Cup handle */}
    <path
      d="M24.5 18.2c1.7.2 2.8 1.2 2.8 2.5 0 1.4-1.1 2.3-2.8 2.5v-1.4c.8-.2 1.2-.6 1.2-1.1 0-.6-.4-1-1.2-1.1v-1.4z"
      fill="#5382A1"
    />
    {/* Saucer / base curve */}
    <path d="M5 27c3.5 2 18.5 2 22 0-2.8 1.2-19.2 1.2-22 0z" fill="#007396" />
  </svg>
)

export const CLogo: React.FC<{ className?: string }> = ({ className = 'w-5 h-5 drop-shadow-xs' }) => (
  <svg viewBox="0 0 32 32" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Outer Hexagon Shield */}
    <polygon points="16,2 28.5,8.8 28.5,23.2 16,30 3.5,23.2 3.5,8.8" fill="#659AD2" />
    {/* Inner Hexagon Shield */}
    <polygon points="16,4.5 26,10 26,22 16,27.5 6,22 6,10" fill="#00599C" />
    {/* Authentic C Glyph */}
    <path
      d="M21 11.5c-1.3-1-3-1.5-4.8-1.5-4.2 0-7.2 2.8-7.2 6.8s3 6.8 7.2 6.8c1.8 0 3.5-.5 4.8-1.5l-1.4-2.4c-.9.7-2 1-3.4 1-2.5 0-4.3-1.8-4.3-3.9s1.8-3.9 4.3-3.9c1.4 0 2.5.3 3.4 1l1.4-2.4z"
      fill="#FFFFFF"
    />
  </svg>
)

export const CppLogo: React.FC<{ className?: string }> = ({ className = 'w-5 h-5 drop-shadow-xs' }) => (
  <svg viewBox="0 0 32 32" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Outer Hexagon Shield */}
    <polygon points="16,2 28.5,8.8 28.5,23.2 16,30 3.5,23.2 3.5,8.8" fill="#00599C" />
    {/* Inner Hexagon Shield */}
    <polygon points="16,4.5 26,10 26,22 16,27.5 6,22 6,10" fill="#004482" />
    {/* C glyph */}
    <path
      d="M16.5 12.2c-1-.8-2.2-1.2-3.6-1.2-3.2 0-5.4 2.2-5.4 5.3s2.2 5.3 5.4 5.3c1.4 0 2.6-.4 3.6-1.2l-1.1-1.9c-.7.5-1.5.8-2.5.8-1.8 0-3.2-1.3-3.2-3s1.4-3 3.2-3c1 0 1.8.3 2.5.8l1.1-1.9z"
      fill="#FFFFFF"
    />
    {/* Two plus signs ++ */}
    <path d="M18.8 14.8h1.2v-1.4h1v1.4h1.4v1h-1.4v1.4h-1v-1.4h-1.2v-1z" fill="#659AD2" stroke="#FFFFFF" strokeWidth="0.5" />
    <path d="M23 14.8h1.2v-1.4h1v1.4h1.4v1h-1.4v1.4h-1v-1.4h-1.2v-1z" fill="#659AD2" stroke="#FFFFFF" strokeWidth="0.5" />
  </svg>
)

export const PythonLogo: React.FC<{ className?: string }> = ({ className = 'w-5 h-5 drop-shadow-xs' }) => (
  <svg viewBox="0 0 32 32" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Top Snake (Official Python Blue) */}
    <path
      d="M15.9 3c-4.4 0-6.9 2-6.9 5.2v3.8h7.2c2.1 0 3.8 1.7 3.8 3.8v3.4h2c2.9 0 5-2.2 5-6.5V9.1c0-3.6-2.8-6.1-6.7-6.1h-4.4zm-3.4 3a1.3 1.3 0 110 2.6 1.3 1.3 0 010-2.6z"
      fill="#3776AB"
    />
    {/* Bottom Snake (Official Python Yellow) */}
    <path
      d="M16.1 29c4.4 0 6.9-2 6.9-5.2v-3.8h-7.2c-2.1 0-3.8-1.7-3.8-3.8v-3.4h-2c-2.9 0-5 2.2-5 6.5v3.6c0 3.6 2.8 6.1 6.7 6.1h4.4zm3.4-3a1.3 1.3 0 110-2.6 1.3 1.3 0 010 2.6z"
      fill="#FFD43B"
    />
  </svg>
)

export const JavaScriptLogo: React.FC<{ className?: string }> = ({ className = 'w-5 h-5 drop-shadow-xs' }) => (
  <svg viewBox="0 0 32 32" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Official JS Yellow Square */}
    <rect width="28" height="28" x="2" y="2" rx="4" fill="#F7DF1E" />
    {/* Official 'J' */}
    <path
      d="M13.2 21.2c0 2.6-1.5 3.8-3.8 3.8-2 0-3.3-.9-3.9-2.2l2.2-1.3c.3.7.8 1.1 1.5 1.1.8 0 1.3-.4 1.3-1.4v-9.4h2.7v9.4z"
      fill="#000000"
    />
    {/* Official 'S' */}
    <path
      d="M17.4 20.9c.7 1.1 1.7 1.6 3 1.6 1.2 0 2-.6 2-1.4 0-1-.9-1.4-2.2-2-2.2-.9-3.7-1.9-3.7-4 0-2 1.5-3.6 3.8-3.6 1.6 0 2.9.7 3.7 2.1l-2.1 1.3c-.4-.8-1-.1-1.6-1.1-.7 0-1.2.4-1.2 1 0 .8.6 1.1 1.8 1.6 2.3 1 4.1 1.9 4.1 4.3 0 2.3-1.8 4-4.6 4-2.5 0-4-1.2-4.8-2.7l2.2-1.3z"
      fill="#000000"
    />
  </svg>
)

interface LangItem {
  id: Language
  title: string
}

export const LANGUAGES: LangItem[] = [
  { id: 'java', title: 'Java (TeaVM WebAssembly)' },
  { id: 'c', title: 'C (Clang WebAssembly)' },
  { id: 'cpp', title: 'C++ (Clang WebAssembly)' },
  { id: 'python', title: 'Python 3.12 (Pyodide)' },
  { id: 'javascript', title: 'JavaScript (Native V8)' },
]

export function renderLanguageIcon(lang: Language, className = 'w-5 h-5 drop-shadow-xs') {
  switch (lang) {
    case 'java':
      return <JavaLogo className={className} />
    case 'c':
      return <CLogo className={className} />
    case 'cpp':
      return <CppLogo className={className} />
    case 'python':
      return <PythonLogo className={className} />
    case 'javascript':
      return <JavaScriptLogo className={className} />
    default:
      return null
  }
}

export const LanguageStrip: React.FC<LanguageStripProps> = ({
  currentLanguage,
  onLanguageChange,
  onOpenSettings,
  disabled = false,
}) => {
  return (
    <aside
      className="hidden sm:flex w-12 bg-slate-100/90 dark:bg-slate-900 flex-col items-center py-3 gap-2 shrink-0 border-r border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 select-none z-10 transition-colors"
      data-purpose="languages-strip"
    >
      {/* Top tiny icon indicator */}
      <div className="w-8 h-8 rounded flex items-center justify-center text-slate-400 dark:text-slate-500 mb-0.5" title="Language Switcher">
        <Code2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
      </div>

      {/* Language Quick Switcher with Authentic Vector Logos */}
      {LANGUAGES.map((lang) => {
        const isActive = currentLanguage === lang.id
        return (
          <button
            key={lang.id}
            onClick={() => onLanguageChange(lang.id)}
            disabled={disabled}
            title={lang.title}
            className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all cursor-pointer relative group ${
              isActive
                ? 'bg-white dark:bg-slate-800/90 shadow-xs ring-2 ring-indigo-500 scale-105 opacity-100'
                : 'hover:bg-slate-200/80 dark:hover:bg-slate-800/60 hover:scale-105 opacity-80 hover:opacity-100 text-slate-600 dark:text-slate-400'
            } ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
            aria-label={lang.title}
          >
            {renderLanguageIcon(lang.id)}

            {/* Active indicator bar on left border */}
            {isActive && (
              <span className="absolute -left-1.5 w-1 h-4 bg-indigo-600 dark:bg-indigo-500 rounded-r-full" />
            )}
          </button>
        )
      })}

      {/* Bottom Settings Button */}
      <div className="mt-auto flex flex-col items-center gap-2">
        <button
          onClick={onOpenSettings}
          className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white text-slate-500 dark:text-slate-400 transition cursor-pointer"
          title="Compiler Settings"
        >
          <SettingsIcon className="w-4 h-4" />
        </button>
      </div>
    </aside>
  )
}
