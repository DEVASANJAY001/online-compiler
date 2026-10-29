import React, { useState, useRef, useEffect } from 'react'
import {
  Play,
  Square,
  ChevronDown,
  Sparkles,
  Save,
  Share2,
  RotateCcw,
  Sun,
  Moon,
  Layers,
  Code2,
  FileDown,
  Archive,
  Command,
  Check,
  MoreVertical,
  Sliders,
  FolderPlus,
  Terminal as TerminalIcon,
  Columns2,
  Loader2,
} from 'lucide-react'
import type { Language, ExecutionState } from '../types'
import { renderLanguageIcon } from './LanguageStrip'

interface HeaderProps {
  language: Language
  onLanguageChange: (lang: Language) => void
  executionState: ExecutionState
  onRun: () => void
  onStop: () => void
  onSave: () => void
  isDirty: boolean
  isAutoSave: boolean
  theme: 'dark' | 'light'
  onToggleTheme: () => void
  onOpenSettings: () => void
  onNewProject?: () => void
  onDownloadFile: () => void
  onDownloadZip: () => void
  onDownloadLog: () => void
  onLoadExample: (multiFile: boolean) => void
  onFormatCode: () => void
  layoutMode?: 'friendly' | 'pro'
  onToggleLayoutMode?: (mode: 'friendly' | 'pro') => void
  mobileView?: 'code' | 'output' | 'split'
  onSetMobileView?: (view: 'code' | 'output' | 'split') => void
}

interface LanguageOption {
  id: Language
  label: string
  sublabel: string
  version: string
}

const LANGUAGE_OPTIONS: LanguageOption[] = [
  { id: 'java', label: 'Java', sublabel: 'TeaVM', version: 'Java 17' },
  { id: 'c', label: 'C', sublabel: 'Clang', version: 'C (Clang 22)' },
  { id: 'cpp', label: 'C++', sublabel: 'C++20', version: 'C++ 20' },
  { id: 'python', label: 'Python', sublabel: 'Pyodide', version: 'Python 3.12' },
  { id: 'javascript', label: 'JavaScript', sublabel: 'ES2024', version: 'JavaScript' },
]

export const Header: React.FC<HeaderProps> = ({
  language,
  onLanguageChange,
  executionState,
  onRun,
  onStop,
  onSave,
  isDirty,
  theme,
  onToggleTheme,
  onOpenSettings,
  onNewProject,
  onDownloadFile,
  onDownloadZip,
  onLoadExample,
  onFormatCode,
  layoutMode = 'friendly',
  onToggleLayoutMode,
  mobileView = 'code',
  onSetMobileView,
}) => {
  const [langDropdownOpen, setLangDropdownOpen] = useState(false)
  const [templatesOpen, setTemplatesOpen] = useState(false)
  const [downloadOpen, setDownloadOpen] = useState(false)
  const [shareCopied, setShareCopied] = useState(false)
  const [showShortcuts, setShowShortcuts] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const langRef = useRef<HTMLDivElement>(null)
  const templatesRef = useRef<HTMLDivElement>(null)
  const downloadRef = useRef<HTMLDivElement>(null)
  const mobileMenuRef = useRef<HTMLDivElement>(null)

  const isBusy = executionState === 'compiling' || executionState === 'running' || executionState === 'initializing'
  const isWaiting = executionState === 'waiting-input'
  const currentLangObj = LANGUAGE_OPTIONS.find((l) => l.id === language) || LANGUAGE_OPTIONS[0]

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(e.target as Node)) {
        setLangDropdownOpen(false)
      }
      if (templatesRef.current && !templatesRef.current.contains(e.target as Node)) {
        setTemplatesOpen(false)
      }
      if (downloadRef.current && !downloadRef.current.contains(e.target as Node)) {
        setDownloadOpen(false)
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(e.target as Node)) {
        setMobileMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href)
    setShareCopied(true)
    setTimeout(() => setShareCopied(false), 2000)
  }

  return (
    <header
      className="h-14 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between px-2.5 sm:px-4 md:px-5 shrink-0 z-20 shadow-xs select-none"
      data-purpose="top-navigation"
    >
      {/* Left Navigation: Brand & Language Dropdown */}
      <div className="flex items-center gap-1.5 sm:gap-3 md:gap-4 shrink-0">
        {/* Brand Logo */}
        <div className="flex items-center gap-1.5 sm:gap-2 font-bold text-lg sm:text-xl tracking-tight cursor-pointer">
          <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-mono font-bold text-xs sm:text-sm shadow-xs">
            &lt;/&gt;
          </div>
          <span className="tracking-tight text-slate-800 dark:text-slate-100 hidden sm:inline">
            Code<span className="text-indigo-600">Space</span>
          </span>
        </div>

        {/* Language Selector Dropdown */}
        <div className="relative" ref={langRef}>
          <button
            onClick={() => setLangDropdownOpen(!langDropdownOpen)}
            disabled={isBusy}
            className="flex items-center gap-1.5 sm:gap-2 text-xs font-semibold px-2 sm:px-2.5 py-1.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-colors border border-indigo-200/60 dark:border-indigo-800/60 cursor-pointer disabled:opacity-50"
            id="langDropdownBtn"
            title="Switch programming language"
          >
            <span className="w-4 h-4 flex items-center justify-center shrink-0">
              {renderLanguageIcon(currentLangObj.id, 'w-3.5 h-3.5')}
            </span>
            <span className="hidden sm:inline" id="currentLangLabel">{currentLangObj.version}</span>
            <span className="sm:hidden font-mono text-[11px]" id="currentLangLabelMobile">{currentLangObj.label}</span>
            <ChevronDown className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0 text-indigo-500" />
          </button>

          {langDropdownOpen && (
            <div className="absolute left-0 mt-1.5 w-56 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl py-1 z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-700">
                Select Language
              </div>
              {LANGUAGE_OPTIONS.map((opt) => {
                const isSelected = opt.id === language
                return (
                  <button
                    key={opt.id}
                    onClick={() => {
                      onLanguageChange(opt.id)
                      setLangDropdownOpen(false)
                    }}
                    className={`w-full px-3 py-2 text-left text-xs flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700 transition cursor-pointer ${
                      isSelected ? 'bg-indigo-50/80 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-300 font-semibold' : 'text-slate-700 dark:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-4 h-4 flex items-center justify-center shrink-0">
                        {renderLanguageIcon(opt.id, 'w-3.5 h-3.5')}
                      </div>
                      <span>{opt.label}</span>
                    </div>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400">
                      {opt.sublabel}
                    </span>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Desktop Mode Switcher: Friendly (Default) vs PRO */}
        {onToggleLayoutMode && (
          <div className="hidden md:flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium ml-1">
            <button
              onClick={() => onToggleLayoutMode('friendly')}
              className={`px-2.5 py-1 rounded-md transition cursor-pointer flex items-center gap-1.5 ${
                layoutMode === 'friendly'
                  ? 'bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-300 shadow-xs font-semibold'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
              title="Friendly Mode: Top Editor with Bottom Terminal"
            >
              <span>Friendly</span>
              <span className="text-[9px] px-1 py-0.2 rounded bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-mono">
                Default
              </span>
            </button>
            <button
              onClick={() => onToggleLayoutMode('pro')}
              className={`px-2.5 py-1 rounded-md transition cursor-pointer flex items-center gap-1.5 ${
                layoutMode === 'pro'
                  ? 'bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-300 shadow-xs font-semibold'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
              title="PRO Mode: Side-by-Side Split View"
            >
              <span>PRO</span>
              <span className="text-[9px] px-1 py-0.2 rounded bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 font-mono">
                Split
              </span>
            </button>
          </div>
        )}
      </div>

      {/* Mobile Screen Ratio Tabs: [ Code | Output | Split ] (Visible on screens < md) */}
      {onSetMobileView && (
        <div className="flex md:hidden items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700 text-[11px] font-medium mx-1">
          <button
            onClick={() => onSetMobileView('code')}
            className={`px-2 py-1 rounded transition cursor-pointer flex items-center gap-1 ${
              mobileView === 'code'
                ? 'bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-300 shadow-xs font-semibold'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
            title="Focus Code Editor"
          >
            <Code2 className="w-3 h-3" />
            <span>Code</span>
          </button>

          <button
            onClick={() => onSetMobileView('output')}
            className={`px-2 py-1 rounded transition cursor-pointer flex items-center gap-1 relative ${
              mobileView === 'output'
                ? 'bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-300 shadow-xs font-semibold'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
            title="Focus Terminal Output"
          >
            <TerminalIcon className="w-3 h-3" />
            <span>Output</span>
            {/* Real-time status dot on Output tab when looking at Code view */}
            {mobileView !== 'output' && (
              <span className="flex h-1.5 w-1.5 ml-0.5">
                {isBusy ? (
                  <span className="animate-ping inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                ) : isWaiting ? (
                  <span className="animate-pulse inline-flex h-full w-full rounded-full bg-amber-500" />
                ) : executionState === 'completed' ? (
                  <span className="inline-flex h-full w-full rounded-full bg-emerald-500" />
                ) : executionState === 'failed' ? (
                  <span className="inline-flex h-full w-full rounded-full bg-rose-500" />
                ) : null}
              </span>
            )}
          </button>

          <button
            onClick={() => onSetMobileView('split')}
            className={`px-1.5 py-1 rounded transition cursor-pointer flex items-center ${
              mobileView === 'split'
                ? 'bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-300 shadow-xs font-semibold'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
            title="Split Code and Terminal"
          >
            <Columns2 className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Action Toolbar */}
      <div className="flex items-center gap-1 sm:gap-2">
        {/* Main RUN Action Button */}
        {isBusy ? (
          <button
            onClick={onStop}
            className="flex items-center gap-1 sm:gap-2 px-2.5 sm:px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs sm:text-sm rounded-md shadow-xs active:scale-95 transition-all cursor-pointer shrink-0"
            title="Stop running program"
          >
            <Square className="w-3.5 h-3.5 fill-current" />
            <span>Stop</span>
          </button>
        ) : (
          <button
            onClick={onRun}
            className="flex items-center gap-1 sm:gap-2 px-3 sm:px-5 py-1.5 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 text-white font-semibold text-xs sm:text-sm rounded-md shadow-xs active:scale-95 transition-all cursor-pointer shrink-0"
            data-purpose="run-code"
            id="runBtn"
            title="Run code (Ctrl + Enter)"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Run</span>
          </button>
        )}

        {/* Toggle Dark/Light (Always visible) */}
        <button
          onClick={onToggleTheme}
          className="p-1.5 text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition cursor-pointer"
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
        </button>

        {/* Mobile Settings Shortcut (Direct 1-tap Settings on mobile) */}
        <button
          onClick={onOpenSettings}
          className="md:hidden p-1.5 text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition cursor-pointer"
          title="Compiler Preferences & Settings"
        >
          <Sliders className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
        </button>

        {/* Mobile More Options Menu Button (md:hidden) */}
        <div className="relative md:hidden" ref={mobileMenuRef}>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1.5 text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition cursor-pointer"
            title="More Options"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {mobileMenuOpen && (
            <div className="absolute right-0 mt-1.5 w-52 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl py-1 z-50 animate-in fade-in zoom-in-95 duration-100">
              {/* Settings (Preferences) */}
              <button
                onClick={() => {
                  onOpenSettings()
                  setMobileMenuOpen(false)
                }}
                className="w-full px-3 py-2 text-left text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2.5 cursor-pointer font-medium"
              >
                <Sliders className="w-3.5 h-3.5 text-indigo-500" />
                <span>Preferences &amp; Settings</span>
              </button>

              {/* New Project */}
              {onNewProject && (
                <button
                  onClick={() => {
                    onNewProject()
                    setMobileMenuOpen(false)
                  }}
                  className="w-full px-3 py-2 text-left text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2.5 cursor-pointer"
                >
                  <FolderPlus className="w-3.5 h-3.5 text-emerald-500" />
                  <span>New Project</span>
                </button>
              )}

              <div className="border-t border-slate-100 dark:border-slate-700 my-1" />

              <button
                onClick={() => {
                  onFormatCode()
                  setMobileMenuOpen(false)
                }}
                className="w-full px-3 py-2 text-left text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2.5 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                <span>Format Code</span>
              </button>
              <button
                onClick={() => {
                  onSave()
                  setMobileMenuOpen(false)
                }}
                className="w-full px-3 py-2 text-left text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2.5 cursor-pointer"
              >
                <Save className="w-3.5 h-3.5 text-emerald-500" />
                <span>Save Code</span>
              </button>
              <button
                onClick={() => {
                  onLoadExample(false)
                  setMobileMenuOpen(false)
                }}
                className="w-full px-3 py-2 text-left text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5 text-amber-500" />
                <span>Reset to Starter Code</span>
              </button>
              <button
                onClick={() => {
                  onLoadExample(true)
                  setMobileMenuOpen(false)
                }}
                className="w-full px-3 py-2 text-left text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2.5 cursor-pointer"
              >
                <Layers className="w-3.5 h-3.5 text-purple-500" />
                <span>Multi-File Template</span>
              </button>

              <div className="border-t border-slate-100 dark:border-slate-700 my-1" />

              <button
                onClick={() => {
                  onDownloadFile()
                  setMobileMenuOpen(false)
                }}
                className="w-full px-3 py-2 text-left text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2.5 cursor-pointer"
              >
                <FileDown className="w-3.5 h-3.5 text-blue-500" />
                <span>Download Current File</span>
              </button>
              <button
                onClick={() => {
                  onDownloadZip()
                  setMobileMenuOpen(false)
                }}
                className="w-full px-3 py-2 text-left text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2.5 cursor-pointer"
              >
                <Archive className="w-3.5 h-3.5 text-purple-500" />
                <span>Download Project ZIP</span>
              </button>
              <button
                onClick={() => {
                  handleShare()
                  setMobileMenuOpen(false)
                }}
                className="w-full px-3 py-2 text-left text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2.5 cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5 text-sky-500" />
                <span>Share Link</span>
              </button>
              <button
                onClick={() => {
                  setShowShortcuts(true)
                  setMobileMenuOpen(false)
                }}
                className="w-full px-3 py-2 text-left text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2.5 cursor-pointer border-t border-slate-100 dark:border-slate-700"
              >
                <Command className="w-3.5 h-3.5 text-slate-500" />
                <span>Shortcuts</span>
              </button>
            </div>
          )}
        </div>

        {/* Desktop Utility Actions */}
        <div className="hidden md:flex items-center gap-1 border-l border-slate-200 dark:border-slate-800 pl-3">
          {/* Save button */}
          <button
            onClick={onSave}
            className="relative p-1.5 text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition cursor-pointer"
            title="Save code (Ctrl + S)"
          >
            <Save className="w-4 h-4" />
            {isDirty && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-amber-500 ring-1 ring-white" />
            )}
          </button>

          {/* Share button */}
          <button
            onClick={handleShare}
            className="p-1.5 text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition cursor-pointer relative"
            title="Share snapshot link"
          >
            {shareCopied ? (
              <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <Share2 className="w-4 h-4" />
            )}
          </button>

          {/* Reset Code button */}
          <button
            onClick={() => onLoadExample(false)}
            className="p-1.5 text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition cursor-pointer"
            id="clearBtn"
            title="Reset to starter code"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Tools & Dropdowns (Desktop) */}
        <div className="hidden md:flex items-center gap-1.5 border-l border-slate-200 dark:border-slate-800 pl-2.5">
          {/* Templates dropdown */}
          <div className="relative" ref={templatesRef}>
            <button
              onClick={() => setTemplatesOpen(!templatesOpen)}
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition border border-slate-200 dark:border-slate-700 shadow-xs cursor-pointer"
              title="Code starter templates"
            >
              <Layers className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>Templates</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {templatesOpen && (
              <div className="absolute right-0 mt-1.5 w-48 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl py-1 z-50">
                <button
                  onClick={() => {
                    onLoadExample(false)
                    setTemplatesOpen(false)
                  }}
                  className="w-full px-3 py-2 text-left text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2 cursor-pointer"
                >
                  <Code2 className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Single-file Starter</span>
                </button>
                <button
                  onClick={() => {
                    onLoadExample(true)
                    setTemplatesOpen(false)
                  }}
                  className="w-full px-3 py-2 text-left text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2 cursor-pointer"
                >
                  <Layers className="w-3.5 h-3.5 text-purple-500" />
                  <span>Multi-file Project</span>
                </button>
              </div>
            )}
          </div>

          {/* Export / Download dropdown */}
          <div className="relative" ref={downloadRef}>
            <button
              onClick={() => setDownloadOpen(!downloadOpen)}
              className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition border border-slate-200 dark:border-slate-700 shadow-xs cursor-pointer"
              title="Download source code"
            >
              <FileDown className="w-3.5 h-3.5 text-slate-500" />
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {downloadOpen && (
              <div className="absolute right-0 mt-1.5 w-44 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl py-1 z-50">
                <button
                  onClick={() => {
                    onDownloadFile()
                    setDownloadOpen(false)
                  }}
                  className="w-full px-3 py-1.5 text-left text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2 cursor-pointer"
                >
                  <FileDown className="w-3.5 h-3.5 text-blue-500" />
                  <span>Current File</span>
                </button>
                <button
                  onClick={() => {
                    onDownloadZip()
                    setDownloadOpen(false)
                  }}
                  className="w-full px-3 py-1.5 text-left text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2 cursor-pointer"
                >
                  <Archive className="w-3.5 h-3.5 text-amber-500" />
                  <span>Project ZIP</span>
                </button>
              </div>
            )}
          </div>

          {/* Format button */}
          <button
            onClick={onFormatCode}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded-md transition border border-slate-200 dark:border-slate-700 shadow-xs cursor-pointer"
            title="Auto-format code"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>Format</span>
          </button>

          {/* Shortcuts button */}
          <button
            onClick={() => setShowShortcuts(!showShortcuts)}
            className="p-1.5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition border border-slate-200 dark:border-slate-700 shadow-xs cursor-pointer"
            title="Keyboard Shortcuts"
          >
            <Command className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Shortcuts Popover */}
      {showShortcuts && (
        <div className="absolute top-16 right-5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3 shadow-xl z-50 text-xs w-64">
          <div className="font-semibold text-slate-800 dark:text-slate-100 pb-1.5 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
            <span>Keyboard Shortcuts</span>
            <button
              onClick={() => setShowShortcuts(false)}
              className="text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              ×
            </button>
          </div>
          <div className="mt-2 space-y-1.5 text-slate-600 dark:text-slate-300">
            <div className="flex justify-between items-center">
              <span>Run Code</span>
              <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 rounded border border-slate-200 dark:border-slate-600 font-mono text-[10px]">
                Ctrl + Enter
              </kbd>
            </div>
            <div className="flex justify-between items-center">
              <span>Save Code</span>
              <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 rounded border border-slate-200 dark:border-slate-600 font-mono text-[10px]">
                Ctrl + S
              </kbd>
            </div>
            <div className="flex justify-between items-center">
              <span>Format Code</span>
              <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 rounded border border-slate-200 dark:border-slate-600 font-mono text-[10px]">
                Shift + Alt + F
              </kbd>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
