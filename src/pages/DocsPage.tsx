import React from 'react'
import {
  BookOpen,
  Command,
  FolderTree,
  Terminal,
  Zap,
  Download,
  Settings,
  Play,
  ArrowRight,
} from 'lucide-react'
import { SeoNav } from '../components/SeoNav'
import { SeoFooter } from '../components/SeoFooter'

interface DocsPageProps {
  theme: 'dark' | 'light'
  onToggleTheme: () => void
  onLaunchCompiler: () => void
}

export const DocsPage: React.FC<DocsPageProps> = ({
  theme,
  onToggleTheme,
  onLaunchCompiler,
}) => {
  const hotkeys = [
    { key: 'Ctrl + Enter', desc: 'Compile & Execute current program instantly' },
    { key: 'Ctrl + S', desc: 'Save current active file to browser IndexedDB' },
    { key: 'Tab', desc: 'Indent code by configured tab size (default 2 spaces)' },
    { key: 'Alt + Click', desc: 'Place multiple cursor carets in Monaco Editor' },
    { key: 'Ctrl + F', desc: 'Find and replace within the current file' },
    { key: 'Ctrl + /', desc: 'Toggle line comments for active line or selection' },
  ]

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors">
      <SeoNav
        currentRoute="docs"
        theme={theme}
        onToggleTheme={onToggleTheme}
        onLaunchCompiler={onLaunchCompiler}
      />

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 space-y-12">
        <section className="text-center space-y-4 pt-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Developer Guide &amp; Reference</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            CodeSpace Documentation &amp; Shortcuts
          </h1>
          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 max-w-xl mx-auto">
            Everything you need to master multi-file projects, interactive terminal input, and compiler settings.
          </p>
        </section>

        {/* KEYBOARD SHORTCUTS */}
        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 space-y-4 shadow-xs">
          <div className="flex items-center gap-2.5">
            <Command className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Keyboard Hotkeys</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            {hotkeys.map((hk, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 text-xs"
              >
                <span className="text-slate-600 dark:text-slate-400 font-medium">{hk.desc}</span>
                <kbd className="px-2 py-1 rounded bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-mono text-[11px] font-semibold border border-slate-200 dark:border-slate-700 shadow-2xs shrink-0">
                  {hk.key}
                </kbd>
              </div>
            ))}
          </div>
        </section>

        {/* MULTI-FILE PROJECTS */}
        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 space-y-4 shadow-xs">
          <div className="flex items-center gap-2.5">
            <FolderTree className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Multi-File Project Management</h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            CodeSpace supports full multi-file architectures. Click the <code className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono text-xs">+</code> tab button on top of the editor to add new files (e.g. <code className="font-mono text-xs">utils.h</code>, <code className="font-mono text-xs">helper.py</code>, or <code className="font-mono text-xs">Student.java</code>). All files are mounted into the runtime virtual filesystem and compiled together.
          </p>
          <div className="pt-2">
            <div className="p-4 rounded-xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200/60 dark:border-purple-800/60 text-xs text-purple-900 dark:text-purple-300 space-y-1">
              <span className="font-semibold">Tip: Double click any tab to rename</span>
              <p className="text-purple-700 dark:text-purple-400">
                You can inline rename files by double-clicking the tab name and pressing Enter.
              </p>
            </div>
          </div>
        </section>

        {/* INTERACTIVE INPUT GUIDE */}
        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 space-y-4 shadow-xs">
          <div className="flex items-center gap-2.5">
            <Terminal className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Interactive Terminal &amp; Stdin</h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            When running programs that request user input (<code className="font-mono text-xs">input()</code>, <code className="font-mono text-xs">scanf()</code>, <code className="font-mono text-xs">cin &gt;&gt;</code>, or <code className="font-mono text-xs">Scanner.nextLine()</code>), the terminal enters <span className="font-semibold text-amber-600 dark:text-amber-400">Input Needed ↵</span> mode. Type your response in the bottom input bar and press Enter. The stream continues execution automatically.
          </p>
        </section>

        {/* BOTTOM CTA */}
        <section className="text-center p-8 rounded-2xl bg-gradient-to-r from-indigo-600 to-indigo-700 text-white space-y-3">
          <h2 className="text-xl font-bold">Start Writing Code Now</h2>
          <p className="text-xs sm:text-sm text-indigo-100">
            Open the CodeSpace online editor and build your next program.
          </p>
          <div className="pt-1">
            <button
              onClick={onLaunchCompiler}
              className="px-6 py-2.5 bg-white text-indigo-700 hover:bg-slate-100 font-bold text-xs sm:text-sm rounded-lg shadow-sm transition active:scale-95 cursor-pointer inline-flex items-center gap-2"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Launch IDE</span>
            </button>
          </div>
        </section>
      </main>

      <SeoFooter />
    </div>
  )
}
