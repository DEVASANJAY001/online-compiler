import React from 'react'
import { navigateTo } from '../router'
import {
  Code2,
  Terminal,
  ShieldCheck,
  Zap,
  Globe,
  Heart,
} from 'lucide-react'

export const SeoFooter: React.FC = () => {
  const handleLink = (e: React.MouseEvent, path: string) => {
    e.preventDefault()
    navigateTo(path)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <footer className="border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 py-12 px-4 sm:px-6 lg:px-8 text-xs text-slate-500 dark:text-slate-400 select-none">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
        {/* Brand Summary */}
        <div className="md:col-span-1 space-y-3">
          <div className="flex items-center gap-2 font-bold text-base text-slate-900 dark:text-white">
            <div className="h-6 w-6 rounded-md bg-indigo-600 text-white flex items-center justify-center font-mono font-bold text-xs">
              &lt;/&gt;
            </div>
            <span>CodeSpace</span>
          </div>
          <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-[13px]">
            Serverless client-side online compiler and IDE powered by WebAssembly. Execute code instantly with zero wait times and 100% privacy.
          </p>
          <div className="flex items-center gap-2 text-[11px] text-emerald-600 dark:text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>WebAssembly Native Engine Online</span>
          </div>
        </div>

        {/* Online Compilers Links */}
        <div>
          <h3 className="font-semibold text-slate-800 dark:text-slate-200 uppercase tracking-wider text-[11px] mb-3">
            Online Compilers
          </h3>
          <ul className="space-y-2 text-[13px]">
            <li>
              <a
                href="/python"
                onClick={(e) => handleLink(e, '/python')}
                className="hover:text-indigo-600 dark:hover:text-indigo-400 transition"
              >
                Online Python 3.12 Compiler
              </a>
            </li>
            <li>
              <a
                href="/c"
                onClick={(e) => handleLink(e, '/c')}
                className="hover:text-indigo-600 dark:hover:text-indigo-400 transition"
              >
                Online C Compiler (Clang 22)
              </a>
            </li>
            <li>
              <a
                href="/cpp"
                onClick={(e) => handleLink(e, '/cpp')}
                className="hover:text-indigo-600 dark:hover:text-indigo-400 transition"
              >
                Online C++ 20 Compiler
              </a>
            </li>
            <li>
              <a
                href="/java"
                onClick={(e) => handleLink(e, '/java')}
                className="hover:text-indigo-600 dark:hover:text-indigo-400 transition"
              >
                Online Java Compiler (TeaVM)
              </a>
            </li>
            <li>
              <a
                href="/javascript"
                onClick={(e) => handleLink(e, '/javascript')}
                className="hover:text-indigo-600 dark:hover:text-indigo-400 transition"
              >
                Online JavaScript Runner (ES2024)
              </a>
            </li>
          </ul>
        </div>

        {/* Explore Hubs */}
        <div>
          <h3 className="font-semibold text-slate-800 dark:text-slate-200 uppercase tracking-wider text-[11px] mb-3">
            Explore &amp; Guides
          </h3>
          <ul className="space-y-2 text-[13px]">
            <li>
              <a
                href="/features"
                onClick={(e) => handleLink(e, '/features')}
                className="hover:text-indigo-600 dark:hover:text-indigo-400 transition"
              >
                Architecture &amp; Features
              </a>
            </li>
            <li>
              <a
                href="/templates"
                onClick={(e) => handleLink(e, '/templates')}
                className="hover:text-indigo-600 dark:hover:text-indigo-400 transition"
              >
                Algorithm Templates Library
              </a>
            </li>
            <li>
              <a
                href="/faq"
                onClick={(e) => handleLink(e, '/faq')}
                className="hover:text-indigo-600 dark:hover:text-indigo-400 transition"
              >
                Frequently Asked Questions
              </a>
            </li>
            <li>
              <a
                href="/docs"
                onClick={(e) => handleLink(e, '/docs')}
                className="hover:text-indigo-600 dark:hover:text-indigo-400 transition"
              >
                Documentation &amp; Hotkeys
              </a>
            </li>
            <li>
              <a
                href="/sitemap.xml"
                target="_blank"
                rel="noreferrer"
                className="hover:text-indigo-600 dark:hover:text-indigo-400 transition"
              >
                XML Sitemap
              </a>
            </li>
          </ul>
        </div>

        {/* Technology Highlights */}
        <div>
          <h3 className="font-semibold text-slate-800 dark:text-slate-200 uppercase tracking-wider text-[11px] mb-3">
            Key Advantages
          </h3>
          <ul className="space-y-2 text-[12px] text-slate-600 dark:text-slate-400">
            <li className="flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span>Zero server queues • Instant run</span>
            </li>
            <li className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span>100% Client-side sandbox privacy</span>
            </li>
            <li className="flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
              <span>Interactive live stdin continuation</span>
            </li>
            <li className="flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-sky-500 shrink-0" />
              <span>Runs offline in modern web browsers</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto pt-6 border-t border-slate-200 dark:border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px]">
        <p>© {new Date().getFullYear()} CodeSpace. Free and Open WebAssembly Online IDE.</p>
        <p className="flex items-center gap-1 text-slate-500">
          Built for programmers, students, and competitive coders worldwide
        </p>
      </div>
    </footer>
  )
}
