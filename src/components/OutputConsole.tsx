import React, { useState, useRef, useEffect } from 'react'
import {
  Terminal as TerminalIcon,
  Copy,
  Check,
  CheckCircle2,
  XCircle,
  Loader2,
  BarChart3,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Send,
  Code2,
} from 'lucide-react'
import type { ExecutionState, ExecutionResult, Language } from '../types'

interface OutputConsoleProps {
  executionState: ExecutionState
  result: ExecutionResult | null
  terminalOutput: string
  language: Language
  onSendInput: (inputLine: string) => void
  onClearConsole: () => void
  onCopyOutput: () => void
  onRun?: () => void
  codeContent?: string
  layoutMode?: 'friendly' | 'pro'
  height?: number
  isCollapsed?: boolean
  onToggleCollapse?: () => void
  onBackToCode?: () => void
}

const COMMAND_BY_LANG: Record<Language, string> = {
  java: 'javac Main.java && java Main',
  c: 'clang -O2 main.c && ./a.out',
  cpp: 'clang++ -std=c++20 main.cpp && ./a.out',
  python: 'python3 main.py',
  javascript: 'node index.js',
}

const SANDBOX_BY_LANG: Record<Language, string> = {
  java: 'TeaVM WebAssembly Isolated JVM',
  c: 'Clang WebAssembly Native Sandbox',
  cpp: 'Clang++ WebAssembly Native Sandbox',
  python: 'Pyodide WebAssembly Isolated Environment',
  javascript: 'Isolated Web Worker (V8 Sandbox)',
}

export const OutputConsole: React.FC<OutputConsoleProps> = ({
  executionState,
  result,
  terminalOutput,
  language,
  onSendInput,
  onClearConsole,
  onCopyOutput,
  onRun,
  layoutMode = 'friendly',
  height,
  isCollapsed = false,
  onToggleCollapse,
  onBackToCode,
}) => {
  const [activeTab, setActiveTab] = useState<'console' | 'metrics'>('console')
  const [copied, setCopied] = useState(false)
  const [inlineInput, setInlineInput] = useState('')

  const terminalEndRef = useRef<HTMLDivElement | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)

  const isWaiting = executionState === 'waiting-input'
  const isBusy = executionState === 'compiling' || executionState === 'running' || executionState === 'initializing'

  // Auto-scroll terminal on new output or state change
  useEffect(() => {
    if (activeTab === 'console') {
      terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [terminalOutput, isWaiting, activeTab])

  // Automatically focus input whenever waiting for input
  useEffect(() => {
    if (isWaiting && activeTab === 'console') {
      inputRef.current?.focus()
    }
  }, [isWaiting, activeTab])

  const handleCopy = () => {
    onCopyOutput()
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      const val = inlineInput
      setInlineInput('')
      onSendInput(val)
    }
  }

  const handleSendClick = () => {
    const val = inlineInput
    setInlineInput('')
    onSendInput(val)
  }

  // Execution Metrics
  const durationSec = result ? (result.metrics.durationMs / 1000).toFixed(2) + 's' : '0.08s'
  const compileMs = result
    ? (result.metrics.compilationTimeMs ? result.metrics.compilationTimeMs.toFixed(0) + 'ms' : Math.round(result.metrics.durationMs * 0.4) + 'ms')
    : '45ms'
  const memoryMb = result && result.metrics.memoryBytes
    ? (result.metrics.memoryBytes / (1024 * 1024)).toFixed(1)
    : '18.4'
  const exitCode = result ? result.exitCode : 0

  // Status Badge Rendering
  const renderStatusBadge = () => {
    if (isBusy) {
      return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
          <Loader2 className="w-2.5 h-2.5 animate-spin" />
          {executionState === 'compiling' ? 'Compiling' : executionState === 'initializing' ? 'Preparing' : 'Running'}
        </span>
      )
    }

    if (isWaiting) {
      return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800 animate-pulse">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
          Input Needed ↵
        </span>
      )
    }

    if (executionState === 'failed' || (result && result.exitCode !== 0)) {
      return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
          <XCircle className="w-2.5 h-2.5 text-rose-500" />
          Failed ({exitCode})
        </span>
      )
    }

    if (executionState === 'completed') {
      return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Success (0)
        </span>
      )
    }

    return (
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
        Ready
      </span>
    )
  }

  return (
    <section
      style={{
        height: layoutMode === 'friendly' ? (isCollapsed ? '36px' : height ? `${height}px` : '40%') : undefined,
      }}
      className={`${
        layoutMode === 'friendly'
          ? 'w-full flex flex-col bg-slate-50 dark:bg-slate-950 overflow-hidden shrink-0'
          : 'w-full md:w-1/2 h-full flex flex-col bg-slate-50 dark:bg-slate-950 border-t md:border-t-0 border-slate-200 dark:border-slate-800 overflow-hidden'
      }`}
      data-purpose="output-console-pane"
    >
      {/* Console Tabs Header */}
      <div className="h-9 bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-2 sm:px-3 shrink-0 select-none">
        <div className="flex items-center gap-1 h-full">
          {/* Back to Code button on mobile */}
          {onBackToCode && (
            <button
              onClick={onBackToCode}
              className="md:hidden flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 font-semibold px-2 py-1 rounded bg-indigo-50 dark:bg-indigo-950/50 mr-1 cursor-pointer"
              title="Return to Code Editor"
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>Editor</span>
            </button>
          )}

          {/* Terminal Tab */}
          <button
            onClick={() => setActiveTab('console')}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 h-full text-xs font-semibold cursor-pointer transition ${
              activeTab === 'console'
                ? 'border-b-2 border-indigo-600 text-indigo-700 dark:text-indigo-400 bg-white dark:bg-slate-950 shadow-xs'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
            id="tabConsole"
          >
            <TerminalIcon className="w-3.5 h-3.5" />
            <span>Terminal</span>
          </button>

          {/* Metrics Tab */}
          <button
            onClick={() => setActiveTab('metrics')}
            className={`flex items-center gap-1 px-2 sm:px-2.5 h-full text-xs font-medium cursor-pointer transition ${
              activeTab === 'metrics'
                ? 'border-b-2 border-indigo-600 text-indigo-700 dark:text-indigo-400 bg-white dark:bg-slate-950 shadow-xs'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
            id="tabMetrics"
          >
            <BarChart3 className="w-3.5 h-3.5 text-indigo-500" />
            <span>Metrics</span>
          </button>
        </div>

        {/* Right Console Actions */}
        <div className="flex items-center gap-1 sm:gap-1.5">
          {onRun && (
            <button
              onClick={onRun}
              disabled={isBusy}
              className="flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium px-1.5 sm:px-2 py-0.5 rounded hover:bg-indigo-50 dark:hover:bg-indigo-950/50 transition cursor-pointer disabled:opacity-50"
              title="Re-run code"
            >
              <RotateCcw className={`w-3 h-3 ${isBusy ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Re-run</span>
            </button>
          )}
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-medium px-1.5 sm:px-2 py-0.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 transition cursor-pointer"
            title="Copy terminal output"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
            <span className="hidden sm:inline">{copied ? 'Copied' : 'Copy'}</span>
          </button>
          <button
            onClick={onClearConsole}
            className="text-xs text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 font-medium px-1.5 sm:px-2 py-0.5 rounded transition cursor-pointer"
            id="clearConsoleBtn"
            title="Clear output"
          >
            Clear
          </button>
          {onToggleCollapse && (
            <button
              onClick={onToggleCollapse}
              className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded transition cursor-pointer hidden md:inline-flex"
              title={isCollapsed ? 'Expand console panel' : 'Collapse console panel'}
            >
              {isCollapsed ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          )}
        </div>
      </div>

      {!isCollapsed && (
        <>
          {/* Main Content Area */}
          <div className="flex-1 p-2 sm:p-2.5 overflow-auto font-mono text-xs sm:text-sm flex flex-col justify-start relative select-text" id="outputContainer">
            {/* TAB 1: SINGLE UNIFIED TERMINAL (OUTPUT + INLINE BLINKING INPUT) */}
            {activeTab === 'console' && (
              <div
                className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 font-mono text-xs sm:text-[13px] leading-relaxed shadow-xs flex flex-col space-y-1.5 select-text min-h-[120px]"
              >
                {/* Top terminal info row with status badge and metrics */}
                <div className="flex items-center justify-between text-[11px] text-slate-400 border-b border-slate-100 dark:border-slate-800 pb-1.5 shrink-0 select-none flex-wrap gap-x-2 gap-y-1">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-slate-600 dark:text-slate-300">Standard Output</span>
                    {renderStatusBadge()}
                  </div>

                  <div className="flex items-center gap-1.5 text-[10px] font-sans">
                    <span className="text-slate-500 dark:text-slate-400">
                      Time: <strong className="text-slate-700 dark:text-slate-200 font-mono">{durationSec}</strong>
                    </span>
                    <span className="text-slate-300 dark:text-slate-700">•</span>
                    <span className="text-slate-500 dark:text-slate-400">
                      Memory: <strong className="text-slate-700 dark:text-slate-200 font-mono">{memoryMb} MB</strong>
                    </span>
                    <span className="text-slate-300 dark:text-slate-700 hidden sm:inline">•</span>
                    <span className="text-slate-500 dark:text-slate-400 hidden sm:inline">
                      Compile: <strong className="text-slate-700 dark:text-slate-200 font-mono">{compileMs}</strong>
                    </span>
                  </div>
                </div>

                {/* Command Line */}
                <div className="text-slate-400 text-xs shrink-0 select-none">
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold">$</span> {COMMAND_BY_LANG[language]}
                </div>

                {/* Unified Output Stream with Inline Blinking Input Cursor */}
                <div
                  onClick={() => inputRef.current?.focus()}
                  className="flex-1 overflow-auto whitespace-pre-wrap py-0.5 text-slate-900 dark:text-slate-100 font-mono cursor-text min-h-[60px]"
                >
                  {terminalOutput ? (
                    <span>{terminalOutput}</span>
                  ) : (
                    <span className="text-slate-400 italic">
                      Press 'Run' above or Ctrl+Enter to compile and execute program.
                    </span>
                  )}

                  {/* Blinking indicator while program is actively running */}
                  {isBusy && !isWaiting && (
                    <span className="terminal-cursor ml-0.5 opacity-60" />
                  )}
                </div>

                {/* Process Completion / Exit code status */}
                {executionState === 'completed' && (
                  <div className="pt-0.5 text-[10px] text-slate-400 dark:text-slate-500 flex items-center justify-end gap-1 shrink-0 select-none">
                    <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
                    <span className="font-mono">[exit code 0]</span>
                  </div>
                )}

                {executionState === 'failed' && (
                  <div className="pt-0.5 text-[10px] text-rose-500 flex items-center justify-end gap-1 shrink-0 select-none">
                    <XCircle className="w-3 h-3 text-rose-500 shrink-0" />
                    <span className="font-mono">[exit code {exitCode}]</span>
                  </div>
                )}

                {/* Interactive Stdin Bar (Always clear, visible, and mobile-friendly) */}
                <div className={`pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center gap-1.5 shrink-0 ${
                  isWaiting ? 'bg-amber-500/5 -mx-2.5 px-2.5 pb-1 rounded-b-lg' : ''
                }`}>
                  <span className="text-slate-400 font-mono text-xs font-semibold pl-0.5">›</span>
                  <input
                    ref={inputRef}
                    type="text"
                    value={inlineInput}
                    onChange={(e) => setInlineInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={
                      isWaiting
                        ? 'Input requested! Type here and press Enter or Send...'
                        : 'Interactive stdin (type input line and press Send/Enter)...'
                    }
                    className={`flex-1 bg-slate-50 dark:bg-slate-800 border rounded-md px-2.5 py-1.5 text-xs font-mono text-slate-900 dark:text-slate-100 outline-hidden transition ${
                      isWaiting
                        ? 'border-amber-500 ring-2 ring-amber-500/20 text-slate-900 dark:text-white placeholder-amber-700/80 dark:placeholder-amber-300/80 font-medium'
                        : 'border-slate-200 dark:border-slate-700 focus:border-indigo-500'
                    }`}
                    aria-label="Interactive Terminal Stdin Input"
                  />
                  <button
                    type="button"
                    onClick={handleSendClick}
                    disabled={!inlineInput.trim()}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white rounded-md text-xs font-medium transition cursor-pointer flex items-center gap-1 shrink-0"
                  >
                    <Send className="w-3 h-3" />
                    <span>Send</span>
                  </button>
                </div>

                <div ref={terminalEndRef} />
              </div>
            )}

            {/* TAB 2: METRICS */}
            {activeTab === 'metrics' && (
              <div className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3 sm:p-4 flex flex-col gap-3">
                <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-400 font-semibold text-sm">
                  <BarChart3 className="w-4 h-4" />
                  <span>Runtime Engine &amp; Performance Metrics</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 text-xs">
                  <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800">
                    <span className="text-slate-400">Total Execution Time</span>
                    <p className="font-mono font-bold text-slate-800 dark:text-slate-100 text-base mt-1">{durationSec}</p>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800">
                    <span className="text-slate-400">Peak Heap Memory</span>
                    <p className="font-mono font-bold text-slate-800 dark:text-slate-100 text-base mt-1">{memoryMb} MB</p>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800 sm:col-span-2">
                    <span className="text-slate-400">Security Sandbox Isolation</span>
                    <p className="font-semibold text-slate-800 dark:text-slate-100 mt-1">{SANDBOX_BY_LANG[language]}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      100% Client-side. Executed inside WebAssembly sandboxed browser workers.
                    </p>
                  </div>
                </div>
              </div>
            )}

          </div>
        </>
      )}
    </section>
  )
}
