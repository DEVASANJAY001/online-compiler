import React, { useState } from 'react'
import { ChevronDown, ChevronUp, HelpCircle, Play, Sparkles } from 'lucide-react'
import { SeoNav } from '../components/SeoNav'
import { SeoFooter } from '../components/SeoFooter'

interface FaqPageProps {
  theme: 'dark' | 'light'
  onToggleTheme: () => void
  onLaunchCompiler: () => void
}

interface FaqItem {
  category: string
  question: string
  answer: string
}

const FAQS_LIST: FaqItem[] = [
  {
    category: 'General & Cost',
    question: 'Is CodeSpace online compiler free to use?',
    answer: 'Yes, CodeSpace is 100% free with unlimited runs, zero queue times, and no sign-up or credit card required. There are no hourly quotas or hidden paywalls.',
  },
  {
    category: 'Architecture',
    question: 'How does CodeSpace compile and run code without a server?',
    answer: 'CodeSpace uses WebAssembly (WASM) to compile and execute programs client-side inside your browser web workers. Python executes via Pyodide CPython 3.12, C and C++ compile with Clang WebAssembly, Java runs via a sandboxed WebAssembly JVM, and JavaScript executes in an isolated V8 worker sandbox.',
  },
  {
    category: 'Privacy & Security',
    question: 'Is my code secure and private on CodeSpace?',
    answer: 'Yes. Because CodeSpace compiles and runs code entirely inside your browser sandbox, your code is never transmitted to, inspected by, or stored on remote execution servers. Everything remains on your device.',
  },
  {
    category: 'Terminal & Input',
    question: 'Does CodeSpace support interactive stdin user input?',
    answer: 'Yes! CodeSpace features an integrated terminal with live input continuation. When your code prompts for input (such as input() in Python, scanf() in C, cin in C++, or Scanner in Java), you can type responses directly into the interactive terminal bar.',
  },
  {
    category: 'Supported Languages',
    question: 'Which programming languages are supported on CodeSpace?',
    answer: 'CodeSpace currently supports Python 3.12 (Pyodide), C (Clang 22.0.0), C++20 (Clang++), Java 17 (TeaVM WebAssembly JVM), and modern JavaScript (ES2024).',
  },
  {
    category: 'Offline Usage',
    question: 'Can I use CodeSpace offline?',
    answer: 'Yes! Once toolchains and assets are cached by your browser Service Worker and CacheStorage, Python, JavaScript, and compiled modules run completely offline without an active internet connection.',
  },
  {
    category: 'Projects & Files',
    question: 'Can I create multi-file projects and download my code?',
    answer: 'Yes! You can add multiple files and headers using the file tab bar, edit them seamlessly, and download either individual files or your entire project as a ZIP archive.',
  },
  {
    category: 'Mobile Devices',
    question: 'Can I use CodeSpace on a mobile phone or tablet?',
    answer: 'Yes! CodeSpace is fully responsive and optimized for mobile devices, featuring mobile screen ratio tabs (Code, Output, Split) and a quick syntax symbol keyboard bar to make typing programming brackets and punctuation effortless on mobile.',
  },
]

export const FaqPage: React.FC<FaqPageProps> = ({
  theme,
  onToggleTheme,
  onLaunchCompiler,
}) => {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors">
      <SeoNav
        currentRoute="faq"
        theme={theme}
        onToggleTheme={onToggleTheme}
        onLaunchCompiler={onLaunchCompiler}
      />

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 space-y-12">
        <section className="text-center space-y-4 pt-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Knowledge Base &amp; FAQ</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Frequently Asked Questions
          </h1>
          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 max-w-xl mx-auto">
            Everything you need to know about CodeSpace WebAssembly compiler, privacy, interactive terminal, and performance.
          </p>
        </section>

        <section className="space-y-4">
          {FAQS_LIST.map((faq, idx) => {
            const isOpen = openIndex === idx
            return (
              <div
                key={idx}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-2xs transition hover:border-slate-300 dark:hover:border-slate-700"
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? null : idx)}
                  className="w-full p-5 text-left font-semibold text-sm sm:text-base flex items-center justify-between text-slate-900 dark:text-white cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40 transition gap-4"
                >
                  <div className="space-y-1">
                    <span className="text-[11px] font-mono uppercase tracking-wider text-indigo-600 dark:text-indigo-400 block font-semibold">
                      {faq.category}
                    </span>
                    <span>{faq.question}</span>
                  </div>
                  {isOpen ? (
                    <ChevronUp className="w-5 h-5 text-slate-400 shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-slate-400 shrink-0" />
                  )}
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed border-t border-slate-100 dark:border-slate-800/60 pt-4">
                    {faq.answer}
                  </div>
                )}
              </div>
            )
          })}
        </section>

        {/* BOTTOM CTA */}
        <section className="text-center p-8 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/60 space-y-3">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Have code ready to test?</h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
            Open the IDE and start coding in your preferred language immediately.
          </p>
          <div className="pt-2">
            <button
              onClick={onLaunchCompiler}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs sm:text-sm rounded-lg shadow-sm transition active:scale-95 cursor-pointer inline-flex items-center gap-2"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Open Online IDE</span>
            </button>
          </div>
        </section>
      </main>

      <SeoFooter />
    </div>
  )
}
