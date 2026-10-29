import React, { useRef, useEffect, useState } from 'react'
import Editor, { loader, type OnMount } from '@monaco-editor/react'
import * as monaco from 'monaco-editor'
import type { Language, Settings, ProjectFile } from '../types'
import { Copy, Maximize2, Minimize2, Check, Plus, X, Edit2 } from 'lucide-react'

// Configure local monaco-editor bundle to avoid CDN latency and COEP cross-origin restrictions
loader.config({ monaco })

interface CodeEditorProps {
  files?: ProjectFile[]
  activeFilePath: string
  onSelectFile?: (path: string) => void
  onAddFile?: () => void
  onDeleteFile?: (path: string) => void
  onRenameFile?: (oldPath: string, newPath: string) => void
  content: string
  language: Language
  onChange: (value: string) => void
  onRun: () => void
  onFormat?: () => void
  settings: Settings
  theme: 'dark' | 'light'
  onCursorChange?: (pos: { line: number; column: number }) => void
  onFontSizeChange?: (newSize: number) => void
  layoutMode?: 'friendly' | 'pro'
}

function getMonacoLanguage(filePath: string, defaultLang: Language): string {
  const ext = filePath.split('.').pop()?.toLowerCase()
  switch (ext) {
    case 'c':
    case 'h':
      return 'c'
    case 'cpp':
    case 'hpp':
    case 'cc':
    case 'cxx':
      return 'cpp'
    case 'java':
      return 'java'
    case 'py':
      return 'python'
    case 'js':
    case 'mjs':
      return 'javascript'
    case 'json':
      return 'json'
    default:
      return defaultLang === 'cpp' ? 'cpp' : defaultLang
  }
}

const QUICK_SYMBOLS = ['Tab', '{', '}', '(', ')', '[', ']', ';', '"', "'", '=', '<', '>', '+', '-', ':', '_']

export const CodeEditor: React.FC<CodeEditorProps> = ({
  files = [],
  activeFilePath,
  onSelectFile,
  onAddFile,
  onDeleteFile,
  onRenameFile,
  content,
  language,
  onChange,
  onRun,
  settings,
  theme,
  onCursorChange,
  onFontSizeChange,
  layoutMode = 'friendly',
}) => {
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [copied, setCopied] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  // Inline Tab Renaming State
  const [editingFilePath, setEditingFilePath] = useState<string | null>(null)
  const [editingName, setEditingName] = useState<string>('')
  const renameInputRef = useRef<HTMLInputElement | null>(null)

  const handleStartRename = (filePath: string, currentName: string) => {
    setEditingFilePath(filePath)
    setEditingName(currentName)
    setTimeout(() => {
      renameInputRef.current?.focus()
      renameInputRef.current?.select()
    }, 50)
  }

  const handleCommitRename = () => {
    if (!editingFilePath) return
    const trimmed = editingName.trim()
    if (trimmed && trimmed !== editingFilePath && onRenameFile) {
      onRenameFile(editingFilePath, trimmed)
    }
    setEditingFilePath(null)
  }

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const handleEditorMount: OnMount = (editor, monacoInstance) => {
    editorRef.current = editor

    // Shortcut: Ctrl+Enter to Run
    editor.addCommand(
      monacoInstance.KeyMod.CtrlCmd | monacoInstance.KeyCode.Enter,
      () => onRun()
    )

    // Cursor position tracking
    editor.onDidChangeCursorPosition((e) => {
      if (onCursorChange) {
        onCursorChange({
          line: e.position.lineNumber,
          column: e.position.column,
        })
      }
    })
  }

  // Insert symbol at current cursor position (for mobile quick symbol bar)
  const handleInsertSymbol = (symbol: string) => {
    const textToInsert = symbol === 'Tab' ? ' '.repeat(settings.tabSize || 2) : symbol
    if (editorRef.current) {
      const editor = editorRef.current
      const selection = editor.getSelection()
      if (selection) {
        editor.executeEdits('quick-symbol', [
          {
            range: selection,
            text: textToInsert,
            forceMoveMarkers: true,
          },
        ])
        editor.focus()
      }
    } else {
      onChange(content + textToInsert)
    }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(content)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const toggleFullscreen = () => {
    if (!containerRef.current) return
    if (!isFullscreen) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen()
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen()
      }
    }
    setIsFullscreen(!isFullscreen)
  }

  const handleDecreaseFont = () => {
    if (onFontSizeChange && settings.fontSize > 10) {
      onFontSizeChange(settings.fontSize - 1)
    }
  }

  const handleIncreaseFont = () => {
    if (onFontSizeChange && settings.fontSize < 28) {
      onFontSizeChange(settings.fontSize + 1)
    }
  }

  const monacoLanguage = getMonacoLanguage(activeFilePath, language)
  const displayFiles = files.length > 0 ? files : [{ path: activeFilePath, name: activeFilePath }]

  return (
    <section
      ref={containerRef}
      className={`${
        layoutMode === 'friendly'
          ? 'w-full h-full flex flex-col bg-white dark:bg-slate-900 overflow-hidden'
          : 'w-full md:w-1/2 h-full flex flex-col border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden'
      } ${isFullscreen ? 'fixed inset-0 z-50 w-screen h-screen' : ''}`}
      data-purpose="code-editor-pane"
    >
      {/* Editor Tabs Header */}
      <div className="h-9 bg-slate-100/80 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700/80 flex items-center justify-between px-2 shrink-0 select-none overflow-hidden">
        <div className="flex items-center h-full overflow-x-auto touch-pan-x scrollbar-none flex-1 min-w-0 mr-2">
          {displayFiles.map((file) => {
            const isActive = file.path === activeFilePath
            const isEditing = editingFilePath === file.path

            return (
              <div
                key={file.path}
                onClick={() => onSelectFile && onSelectFile(file.path)}
                className={`group flex items-center gap-1.5 px-2.5 sm:px-3 h-full text-xs font-medium cursor-pointer transition border-r border-slate-200 dark:border-slate-700/80 shrink-0 ${
                  isActive
                    ? 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 border-t-2 border-t-indigo-600 font-semibold shadow-xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                    isActive ? 'bg-amber-500' : 'bg-slate-300 dark:bg-slate-600'
                  }`}
                />

                {isEditing ? (
                  <input
                    ref={renameInputRef}
                    type="text"
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    onBlur={handleCommitRename}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleCommitRename()
                      if (e.key === 'Escape') setEditingFilePath(null)
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="bg-white dark:bg-slate-800 border border-indigo-500 text-slate-800 dark:text-slate-100 rounded px-1.5 py-0.5 text-xs font-medium outline-hidden w-24 sm:w-28"
                    autoFocus
                  />
                ) : (
                  <span
                    onDoubleClick={(e) => {
                      e.stopPropagation()
                      handleStartRename(file.path, file.name || file.path)
                    }}
                    title="Double-click to rename file"
                    className="truncate max-w-[100px] sm:max-w-[140px]"
                  >
                    {file.name || file.path}
                  </span>
                )}

                {/* Edit file name button */}
                {!isEditing && onRenameFile && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleStartRename(file.path, file.name || file.path)
                    }}
                    className={`p-0.5 rounded transition text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer ${
                      isActive ? 'opacity-70 hover:opacity-100' : 'opacity-0 group-hover:opacity-100'
                    }`}
                    title="Rename file"
                  >
                    <Edit2 className="w-2.5 h-2.5" />
                  </button>
                )}

                {/* Delete file button */}
                {files.length > 1 && onDeleteFile && !isEditing && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onDeleteFile(file.path)
                    }}
                    className="text-slate-400 hover:text-rose-500 p-0.5 rounded cursor-pointer transition"
                    title="Close file"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            )
          })}

          {/* Add New Tab Button */}
          {onAddFile && (
            <button
              onClick={onAddFile}
              className="px-2 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-200/60 dark:hover:bg-slate-700/50 h-full flex items-center transition cursor-pointer text-sm font-semibold shrink-0"
              title="Add file(s)"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Quick font / full screen control */}
        <div className="flex items-center gap-1 sm:gap-1.5 text-slate-400 text-xs px-1 sm:px-2 shrink-0">
          {/* Copy code button */}
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 px-1.5 sm:px-2 py-0.5 text-[11px] font-medium text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-200/60 dark:hover:bg-slate-700/60 rounded transition cursor-pointer"
            title="Copy code"
          >
            {copied ? (
              <Check className="w-3 h-3 text-emerald-500" />
            ) : (
              <Copy className="w-3 h-3" />
            )}
            <span className="hidden sm:inline">{copied ? 'Copied' : 'Copy'}</span>
          </button>

          {/* Font size stepper (Tablet/Desktop) */}
          <div className="hidden sm:flex items-center border border-slate-200 dark:border-slate-700 rounded bg-white dark:bg-slate-800 px-1 gap-1 text-[11px] font-mono text-slate-600 dark:text-slate-300">
            <button
              onClick={handleDecreaseFont}
              className="hover:text-indigo-600 dark:hover:text-indigo-400 px-0.5 cursor-pointer"
              title="Decrease font size"
            >
              A-
            </button>
            <span className="text-slate-300 dark:text-slate-600">|</span>
            <button
              onClick={handleIncreaseFont}
              className="hover:text-indigo-600 dark:hover:text-indigo-400 px-0.5 font-semibold cursor-pointer"
              title="Increase font size"
            >
              A+
            </button>
          </div>

          {/* Fullscreen toggle */}
          <button
            onClick={toggleFullscreen}
            className="p-1 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 hover:bg-slate-200/60 dark:hover:bg-slate-700/60 rounded transition cursor-pointer"
            title={isFullscreen ? 'Exit fullscreen' : 'Toggle fullscreen'}
          >
            {isFullscreen ? (
              <Minimize2 className="w-3.5 h-3.5" />
            ) : (
              <Maximize2 className="w-3.5 h-3.5" />
            )}
          </button>

          {/* Encoding indicator */}
          <span className="text-[11px] font-mono text-slate-400 pl-1 hidden md:inline">UTF-8</span>
        </div>
      </div>

      {/* Mobile Quick Symbols Toolbar (Assists typing syntax on phone keyboards) */}
      {isMobile && (
        <div className="h-7 bg-slate-100/90 dark:bg-slate-800/80 border-b border-slate-200/80 dark:border-slate-700/60 flex items-center px-1 overflow-x-auto touch-pan-x scrollbar-none gap-1 shrink-0 select-none">
          {QUICK_SYMBOLS.map((sym) => (
            <button
              key={sym}
              type="button"
              onClick={() => handleInsertSymbol(sym)}
              className="h-5 min-w-[24px] px-1 rounded bg-white dark:bg-slate-700/90 text-slate-700 dark:text-slate-200 font-mono text-[11px] font-semibold border border-slate-200 dark:border-slate-600 active:bg-indigo-100 dark:active:bg-indigo-900 transition flex items-center justify-center shrink-0 shadow-2xs"
            >
              {sym}
            </button>
          ))}
        </div>
      )}

      {/* Editor Content Area: Rich Monaco Editor with Mobile Optimizations */}
      <div className="flex-1 relative overflow-hidden bg-white dark:bg-slate-900">
        <Editor
          height="100%"
          path={activeFilePath}
          language={monacoLanguage}
          value={content}
          theme={theme === 'dark' ? 'vs-dark' : 'vs'}
          onChange={(val) => onChange(val || '')}
          onMount={handleEditorMount}
          loading={
            <div className="h-full flex items-center justify-center text-slate-400 font-mono text-xs">
              Loading Code Editor...
            </div>
          }
          options={{
            fontSize: isMobile ? Math.max(settings.fontSize, 13) : settings.fontSize,
            tabSize: settings.tabSize,
            wordWrap: 'on',
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            automaticLayout: true,
            fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
            fontLigatures: true,
            lineNumbers: 'on',
            lineNumbersMinChars: isMobile ? 3 : 4,
            glyphMargin: false,
            folding: !isMobile,
            lineDecorationsWidth: isMobile ? 6 : 10,
            renderLineHighlight: 'all',
            cursorBlinking: 'smooth',
            bracketPairColorization: { enabled: true },
            padding: { top: 8, bottom: 8 },
            quickSuggestions: !isMobile,
            scrollbar: {
              verticalScrollbarSize: 5,
              horizontalScrollbarSize: 5,
            },
          }}
        />
      </div>
    </section>
  )
}
