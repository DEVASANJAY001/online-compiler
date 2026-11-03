import React from 'react'
import {
  Zap,
  ShieldCheck,
  Cpu,
  Layers,
  Terminal,
  Download,
  FolderTree,
  EyeOff,
  CheckCircle2,
  XCircle,
  Play,
  ArrowRight,
} from 'lucide-react'
import { SeoNav } from '../components/SeoNav'
import { SeoFooter } from '../components/SeoFooter'
import { navigateTo } from '../router'

interface FeaturesPageProps {
  theme: 'dark' | 'light'
  onToggleTheme: () => void
  onLaunchCompiler: () => void
}

export const FeaturesPage: React.FC<FeaturesPageProps> = ({
  theme,
  onToggleTheme,
  onLaunchCompiler,
}) => {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors">
      <SeoNav
        currentRoute="features"
        theme={theme}
        onToggleTheme={onToggleTheme}
        onLaunchCompiler={onLaunchCompiler}
      />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 space-y-16">
        {/* HERO */}
        <section className="text-center space-y-4 max-w-3xl mx-auto pt-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Next-Generation Architecture</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Client-Side WebAssembly vs. Traditional Cloud Compilers
          </h1>
          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 leading-relaxed">
            Discover why CodeSpace executes code with 0ms queue times, 100% privacy, and zero server bottlenecks.
          </p>
        </section>

        {/* COMPARISON TABLE */}
        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-200 dark:border-slate-800">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Direct Comparison Matrix</h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              CodeSpace client-side execution vs typical cloud compilers (Judge0, JDoodle, Programiz, Replit free tier).
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="p-4">Feature / Metric</th>
                  <th className="p-4 text-indigo-600 dark:text-indigo-400 font-bold">CodeSpace (WebAssembly)</th>
                  <th className="p-4 text-slate-500">Traditional Server Compilers</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                <tr>
                  <td className="p-4 font-medium text-slate-800 dark:text-slate-200">Execution Start Latency</td>
                  <td className="p-4 text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>0ms Queue (Instant client-side)</span>
                  </td>
                  <td className="p-4 text-slate-500 flex items-center gap-1.5">
                    <XCircle className="w-4 h-4 text-rose-500 shrink-0" />
                    <span>3,000ms – 10,000ms server queue</span>
                  </td>
                </tr>
                <tr>
                  <td className="p-4 font-medium text-slate-800 dark:text-slate-200">Code Privacy &amp; Security</td>
                  <td className="p-4 text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>100% Private (Never leaves device)</span>
                  </td>
                  <td className="p-4 text-slate-500 flex items-center gap-1.5">
                    <XCircle className="w-4 h-4 text-rose-500 shrink-0" />
                    <span>Transmitted and logged on backend</span>
                  </td>
                </tr>
                <tr>
                  <td className="p-4 font-medium text-slate-800 dark:text-slate-200">Offline Functionality</td>
                  <td className="p-4 text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>Works offline once cached</span>
                  </td>
                  <td className="p-4 text-slate-500 flex items-center gap-1.5">
                    <XCircle className="w-4 h-4 text-rose-500 shrink-0" />
                    <span>Strictly requires live internet</span>
                  </td>
                </tr>
                <tr>
                  <td className="p-4 font-medium text-slate-800 dark:text-slate-200">Rate Limits &amp; Cost</td>
                  <td className="p-4 text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>Unlimited free runs, no paywalls</span>
                  </td>
                  <td className="p-4 text-slate-500 flex items-center gap-1.5">
                    <XCircle className="w-4 h-4 text-rose-500 shrink-0" />
                    <span>Throttled quotas or subscriptions</span>
                  </td>
                </tr>
                <tr>
                  <td className="p-4 font-medium text-slate-800 dark:text-slate-200">Interactive User Input (stdin)</td>
                  <td className="p-4 text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>Live continuation terminal bar</span>
                  </td>
                  <td className="p-4 text-slate-500 flex items-center gap-1.5">
                    <XCircle className="w-4 h-4 text-rose-500 shrink-0" />
                    <span>Static batch text inputs only</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* CORE PLATFORM PILLARS */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Cpu className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-lg text-slate-900 dark:text-white">WebAssembly Native Runtimes</h3>
            <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm leading-relaxed">
              We compile your C and C++ source code with LLVM Clang 22.0.0 directly into wasm32-wasip1 binaries. Java executes via TeaVM JVM, and Python runs official CPython 3.12 through Pyodide.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-lg text-slate-900 dark:text-white">Hardware-Enforced Sandboxing</h3>
            <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm leading-relaxed">
              Every execution runs inside isolated Web Workers with zero access to your local file system, cookies, or external tokens. The memory heap is bounded and safely discarded.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <FolderTree className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-lg text-slate-900 dark:text-white">Multi-File Project Support</h3>
            <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm leading-relaxed">
              Organize complex applications into multiple files, headers, and helper modules. Download your complete project as a standard ZIP archive at any time.
            </p>
          </div>
        </section>

        {/* BOTTOM CTA */}
        <section className="text-center p-8 sm:p-12 rounded-3xl bg-gradient-to-br from-indigo-900 to-slate-950 text-white space-y-4">
          <h2 className="text-2xl sm:text-4xl font-bold">Ready to Experience Zero-Latency Coding?</h2>
          <p className="text-sm sm:text-base text-slate-300 max-w-xl mx-auto">
            No signup, no configuration. Pick a language and start writing code immediately.
          </p>
          <div className="pt-2">
            <button
              onClick={onLaunchCompiler}
              className="px-8 py-3.5 bg-white text-indigo-900 hover:bg-slate-100 font-bold text-sm sm:text-base rounded-xl shadow-lg transition active:scale-95 cursor-pointer inline-flex items-center gap-2"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Launch CodeSpace IDE Now</span>
            </button>
          </div>
        </section>
      </main>

      <SeoFooter />
    </div>
  )
}
