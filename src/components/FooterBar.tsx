import React from 'react'
import type { Language, ExecutionState } from '../types'

interface FooterBarProps {
  language: Language
  executionState: ExecutionState
  cursorPosition: { line: number; column: number }
  tabSize: number
}

const TOOLCHAIN_NAMES: Record<Language, string> = {
  java: 'OpenJDK 17.0.2 • TeaVM WebAssembly',
  c: 'Clang 22.0.0 • WebAssembly',
  cpp: 'Clang 22.0.0 (C++20) • WebAssembly',
  python: 'Python 3.12.7 • Pyodide WebAssembly',
  javascript: 'ECMAScript 2024 • Native Worker',
}

const TOOLCHAIN_SHORT: Record<Language, string> = {
  java: 'TeaVM Wasm',
  c: 'Clang Wasm',
  cpp: 'Clang++ Wasm',
  python: 'Pyodide Wasm',
  javascript: 'V8 Worker',
}

export const FooterBar: React.FC<FooterBarProps> = ({
  language,
  executionState,
  cursorPosition,
  tabSize,
}) => {
  const isBusy = executionState === 'compiling' || executionState === 'running' || executionState === 'initializing'
  const isWaiting = executionState === 'waiting-input'

  return (
    <footer
      className="h-6 bg-slate-100 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between px-2 sm:px-3 text-[11px] text-slate-500 dark:text-slate-400 shrink-0 select-none overflow-hidden"
      data-purpose="status-bar"
    >
      <div className="flex items-center gap-2 sm:gap-3 truncate">
        {isBusy ? (
          <span className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 font-medium shrink-0">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
            Executing
          </span>
        ) : isWaiting ? (
          <span className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-medium shrink-0">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            Input Needed
          </span>
        ) : (
          <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium shrink-0">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Ready
          </span>
        )}
        <span className="text-slate-300 dark:text-slate-700">|</span>
        <span className="font-mono hidden sm:inline">{TOOLCHAIN_NAMES[language] || 'WebAssembly'}</span>
        <span className="font-mono sm:hidden">{TOOLCHAIN_SHORT[language] || 'Wasm'}</span>
      </div>

      <div className="flex items-center gap-2 sm:gap-3 font-mono shrink-0">
        <span className="hidden sm:inline">
          Ln {cursorPosition.line}, Col {cursorPosition.column}
        </span>
        <span className="text-slate-300 dark:text-slate-700 hidden sm:inline">|</span>
        <span className="hidden xs:inline">Spaces: {tabSize}</span>
        <span className="text-slate-300 dark:text-slate-700 hidden sm:inline">|</span>
        <span className="text-indigo-600 dark:text-indigo-400 font-sans font-medium hidden sm:inline">
          Serverless
        </span>
      </div>
    </footer>
  )
}
