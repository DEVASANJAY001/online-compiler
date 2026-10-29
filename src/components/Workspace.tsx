import React, { useState, useEffect, useRef } from 'react'
import type { Project, ProjectFile, Language, ExecutionState, ExecutionResult, Settings } from '../types'
import { DEFAULT_SETTINGS } from '../types'
import { Header } from './Header'
import { LanguageStrip } from './LanguageStrip'
import { CodeEditor } from './CodeEditor'
import { OutputConsole } from './OutputConsole'
import { FooterBar } from './FooterBar'
import { SettingsModal } from './SettingsModal'
import { NewProjectModal } from './NewProjectModal'
import { StatusBanner } from './StatusBanner'
import { storageService } from '../services/storageService'
import { ExportService } from '../services/exportService'
import { runtimeManager } from '../runtimes/RuntimeManager'
import { STARTER_PROJECTS, MULTI_FILE_EXAMPLES } from '../examples/starterTemplates'
import { analyzeExecutionOutput } from '../utils/inputDetection'

export const Workspace: React.FC = () => {
  // Projects & File state
  const [projects, setProjects] = useState<Project[]>([])
  const [currentProject, setCurrentProject] = useState<Project | null>(null)
  const [dirtyFiles, setDirtyFiles] = useState<Set<string>>(new Set())
  const [activeFilePath, setActiveFilePath] = useState<string>('')

  // Responsive mobile screen detection & layout modes
  const [isMobileScreen, setIsMobileScreen] = useState<boolean>(() => {
    return typeof window !== 'undefined' ? window.innerWidth < 768 : false
  })
  // Mobile views: 'code' (full editor), 'output' (full terminal), 'split' (both)
  const [mobileView, setMobileView] = useState<'code' | 'output' | 'split'>('code')

  // Desktop Layout mode: 'friendly' (Default bottom terminal) or 'pro' (Side-by-side split)
  const [layoutMode, setLayoutMode] = useState<'friendly' | 'pro'>('friendly')
  const [bottomConsoleHeight, setBottomConsoleHeight] = useState<number>(() => {
    return typeof window !== 'undefined' && window.innerWidth < 640 ? 220 : 270
  })
  const [isConsoleCollapsed, setIsConsoleCollapsed] = useState<boolean>(false)
  const isResizingRef = useRef(false)

  // Interactive Terminal & Stdin state
  const [accumulatedStdin, setAccumulatedStdin] = useState<string>('')
  const [executionState, setExecutionState] = useState<ExecutionState>('idle')
  const [terminalOutput, setTerminalOutput] = useState<string>('')
  const [lastResult, setLastResult] = useState<ExecutionResult | null>(null)
  const prevStdoutLengthRef = useRef<number>(0)
  const precompileTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Cursor & Settings
  const [cursorPos, setCursorPos] = useState<{ line: number; column: number }>({ line: 1, column: 1 })
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    try {
      const saved = localStorage.getItem('codespace_theme')
      if (saved === 'dark' || saved === 'light') return saved
    } catch (e) {}
    return 'light'
  })
  const [settings, setSettings] = useState<Settings>({ ...DEFAULT_SETTINGS, theme: 'light' })

  // Modals state
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [isNewProjectOpen, setIsNewProjectOpen] = useState(false)

  // Screen resize listener for mobile screen ratio
  useEffect(() => {
    const handleResize = () => {
      setIsMobileScreen(window.innerWidth < 768)
    }
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Initial Load from IndexedDB
  useEffect(() => {
    const initApp = async () => {
      try {
        const loadedSettings = await storageService.getSettings()
        const savedLocal = localStorage.getItem('codespace_theme')
        const activeTheme: 'dark' | 'light' = (savedLocal === 'dark' || savedLocal === 'light')
          ? savedLocal
          : 'light'

        setTheme(activeTheme)
        setSettings({ ...loadedSettings, theme: activeTheme })

        const allProjects = await storageService.getAllProjects()
        setProjects(allProjects)

        const lastId = await storageService.getLastActiveProjectId()
        const selected = allProjects.find((p) => p.id === lastId) || allProjects[0]

        if (selected) {
          setCurrentProject(selected)
          setActiveFilePath(selected.activeFile || selected.files[0]?.path || '')
          runtimeManager.prewarm(selected.language)
          runtimeManager.precompile(selected.language, selected.files, selected.activeFile)
          runtimeManager.prewarmIdle()
        }
      } catch (err) {
        console.error('Failed to initialize storage:', err)
      }
    }
    initApp()
  }, [])

  // Theme Sync with HTML document root
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark')
      document.documentElement.classList.remove('light')
    } else {
      document.documentElement.classList.remove('dark')
      document.documentElement.classList.add('light')
    }
  }, [theme])

  // Active File Reference
  const activeFile: ProjectFile | undefined = currentProject?.files.find(
    (f) => f.path === activeFilePath
  ) || currentProject?.files[0]

  // File Content Change handler
  const handleContentChange = (newContent: string) => {
    if (!currentProject || !activeFile) return

    const updatedFiles = currentProject.files.map((file) =>
      file.path === activeFile.path ? { ...file, content: newContent } : file
    )

    const updatedProject = {
      ...currentProject,
      files: updatedFiles,
      updatedAt: Date.now(),
    }

    setCurrentProject(updatedProject)
    setDirtyFiles((prev) => new Set(prev).add(activeFile.path))

    // Autosave debouncing
    if (settings.autoSave) {
      storageService.saveProject(updatedProject).then(() => {
        setDirtyFiles((prev) => {
          const next = new Set(prev)
          next.delete(activeFile.path)
          return next
        })
      })
    }

    // Background precompile debounce (1.2s idle)
    if (precompileTimeoutRef.current) {
      clearTimeout(precompileTimeoutRef.current)
    }
    precompileTimeoutRef.current = setTimeout(() => {
      runtimeManager.precompile(updatedProject.language, updatedProject.files, updatedProject.activeFile)
    }, 1200)
  }

  // Explicit Save
  const handleSave = async () => {
    if (!currentProject) return
    await storageService.saveProject(currentProject)
    setDirtyFiles(new Set())
  }

  // Language Change handler
  const handleLanguageChange = async (newLang: Language) => {
    if (!currentProject || currentProject.language === newLang) return

    // Find or create project for this language
    let targetProj = projects.find((p) => p.language === newLang)
    if (!targetProj) {
      const template = STARTER_PROJECTS[newLang]
      targetProj = {
        id: `proj_${newLang}_${Date.now()}`,
        name: template.name,
        language: newLang,
        files: template.files.map((f) => ({ ...f })),
        activeFile: template.activeFile,
        updatedAt: Date.now(),
      }
      await storageService.saveProject(targetProj)
      setProjects((prev) => [targetProj!, ...prev])
    }

    setCurrentProject(targetProj)
    setActiveFilePath(targetProj.activeFile || targetProj.files[0]?.path || '')
    setDirtyFiles(new Set())
    setTerminalOutput('')
    setAccumulatedStdin('')
    setLastResult(null)
    setExecutionState('idle')
    prevStdoutLengthRef.current = 0
    runtimeManager.prewarm(newLang)
    runtimeManager.precompile(newLang, targetProj.files, targetProj.activeFile)
  }

  // Interactive Execution Engine with Stdin Continuation
  const executeWithStdin = async (inputData: string, isContinuation = false) => {
    if (!currentProject || !activeFile) return

    // If on mobile screen and looking at 'code' view, auto-switch to 'output' view to see execution
    if (isMobileScreen && mobileView === 'code') {
      setMobileView('output')
    }

    if (!isContinuation) {
      await handleSave()
      setTerminalOutput('')
      setAccumulatedStdin('')
      setLastResult(null)
      prevStdoutLengthRef.current = 0
    }

    // Pre-check Cross-Origin Isolation for C, C++, and Java (Wasmer / WebAssembly toolchain)
    const requiresIsolation =
      currentProject.language === 'c' ||
      currentProject.language === 'cpp' ||
      currentProject.language === 'java'

    if (requiresIsolation && typeof window !== 'undefined' && !window.crossOriginIsolated) {
      const isSecure = Boolean(window.isSecureContext)
      let msg = `[CodeSpace Environment Restriction]\n`
      msg += `WebAssembly ${currentProject.language.toUpperCase()} compilation requires Cross-Origin Isolation (COOP & COEP headers) and a Secure Context.\n\n`
      if (!isSecure) {
        msg += `Reason: This page is loaded over plain HTTP (${window.location.origin}).\n`
        msg += `Browsers (especially Mobile Safari and Mobile Chrome) strictly block SharedArrayBuffer and WebAssembly multi-threading on non-secure origins.\n\n`
        msg += `Fixes for Mobile:\n`
        msg += `• Test Python (3.12) or JavaScript — both run 100% offline in this browser without requiring Cross-Origin Isolation!\n`
        msg += `• For C, C++, or Java on mobile, serve via HTTPS (e.g. use an ngrok or Cloudflare tunnel, or 'vite --https').\n`
      } else {
        msg += `Reason: COOP and COEP response headers are not enabled by the hosting server.\n`
        msg += `Required headers:\n`
        msg += `  Cross-Origin-Opener-Policy: same-origin\n`
        msg += `  Cross-Origin-Embedder-Policy: require-corp\n\n`
        msg += `Note: Python and JavaScript do not require Cross-Origin Isolation and work immediately.\n`
      }
      setTerminalOutput(msg)
      setExecutionState('failed')
      return
    }

    setExecutionState(isContinuation ? 'running' : 'initializing')

    try {
      const result = await runtimeManager.run(
        currentProject.language,
        currentProject.files,
        {
          entryPoint: currentProject.activeFile || activeFile.path,
          stdin: inputData,
          timeoutMs: settings.timeoutSeconds * 1000,
          onProgress: (phase) => {
            if (phase === 'compiling') {
              setExecutionState('compiling')
            } else if (phase === 'running') {
              setExecutionState('running')
            }
          },
        }
      )

      setLastResult(result)

      const check = analyzeExecutionOutput(result.stdout, result.stderr, result.exitCode)

      if (check.needsInput) {
        setExecutionState('waiting-input')
        if (!isContinuation) {
          setTerminalOutput(check.cleanedStdout)
          prevStdoutLengthRef.current = check.cleanedStdout.length
        } else {
          const newChunk = check.cleanedStdout.slice(prevStdoutLengthRef.current)
          setTerminalOutput((prev) => prev + newChunk)
          prevStdoutLengthRef.current = check.cleanedStdout.length
        }
      } else {
        if (!isContinuation) {
          let fullOutput = result.stdout
          if (result.stderr && result.exitCode !== 0) {
            fullOutput += (fullOutput ? '\n' : '') + result.stderr
          }
          setTerminalOutput(fullOutput)
        } else {
          let newChunk = result.stdout.slice(prevStdoutLengthRef.current)
          if (result.stderr && result.exitCode !== 0) {
            newChunk += (newChunk ? '\n' : '') + result.stderr
          }
          setTerminalOutput((prev) => prev + newChunk)
        }
        setExecutionState(result.exitCode === 0 ? 'completed' : 'failed')
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err)
      if (errorMsg.includes('cross-origin-isolated') || errorMsg.includes('Wasmer requires')) {
        let msg = `[CodeSpace Error] Wasmer requires a cross-origin-isolated page (COOP & COEP headers).\n\n`
        if (typeof window !== 'undefined' && !window.isSecureContext) {
          msg += `The page is loaded via insecure HTTP (${window.location.origin}). Mobile browsers block SharedArrayBuffer over plain HTTP.\n`
          msg += `Tip: Switch to Python or JavaScript (both run without isolation restrictions), or serve via HTTPS for C/C++/Java.`
        } else {
          msg += `Ensure your server serves:\n  Cross-Origin-Opener-Policy: same-origin\n  Cross-Origin-Embedder-Policy: require-corp\n`
          msg += `Tip: Python and JavaScript run in all browsers without this requirement.`
        }
        setTerminalOutput((prev) => prev + `\n${msg}\n`)
      } else {
        setTerminalOutput((prev) => prev + `\n[CodeSpace Error] ${errorMsg}\n`)
      }
      setExecutionState('failed')
    }
  }

  // Run Code entry point
  const handleRun = () => {
    executeWithStdin('', false)
  }

  // Handle user input submitted directly in the terminal
  const handleSendInput = async (inputLine: string) => {
    if (inputLine.trim() === 'clear') {
      setTerminalOutput('')
      setAccumulatedStdin('')
      prevStdoutLengthRef.current = 0
      return
    }

    const nextStdin = accumulatedStdin + inputLine + '\n'
    setAccumulatedStdin(nextStdin)

    // Echo user input onto the terminal line
    setTerminalOutput((prev) => prev + inputLine + '\n')

    // Continue execution with all accumulated inputs
    await executeWithStdin(nextStdin, true)
  }

  // Stop Execution
  const handleStop = async () => {
    await runtimeManager.stop()
    setExecutionState('stopped')
    setTerminalOutput((prev) => prev + '\n[CodeSpace] Execution terminated by user.\n')
  }

  // Resizing divider mouse handler
  const handleDividerMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    isResizingRef.current = true
    const startY = e.clientY
    const startH = bottomConsoleHeight

    const onMouseMove = (moveEvent: MouseEvent) => {
      if (!isResizingRef.current) return
      const deltaY = startY - moveEvent.clientY
      const newHeight = Math.max(140, Math.min(window.innerHeight - 200, startH + deltaY))
      setBottomConsoleHeight(newHeight)
      if (isConsoleCollapsed) setIsConsoleCollapsed(false)
    }

    const onMouseUp = () => {
      isResizingRef.current = false
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }

    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
  }

  // Resizing divider touch handler for mobile screens
  const handleDividerTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length !== 1) return
    isResizingRef.current = true
    const startY = e.touches[0].clientY
    const startH = bottomConsoleHeight

    const onTouchMove = (moveEvent: TouchEvent) => {
      if (!isResizingRef.current || moveEvent.touches.length !== 1) return
      const deltaY = startY - moveEvent.touches[0].clientY
      const newHeight = Math.max(120, Math.min(window.innerHeight - 160, startH + deltaY))
      setBottomConsoleHeight(newHeight)
      if (isConsoleCollapsed) setIsConsoleCollapsed(false)
    }

    const onTouchEnd = () => {
      isResizingRef.current = false
      window.removeEventListener('touchmove', onTouchMove)
      window.removeEventListener('touchend', onTouchEnd)
    }

    window.addEventListener('touchmove', onTouchMove, { passive: true })
    window.addEventListener('touchend', onTouchEnd, { once: true })
  }

  // File and Project operations
  const handleSelectFile = (path: string) => {
    setActiveFilePath(path)
    if (currentProject) {
      setCurrentProject({ ...currentProject, activeFile: path })
    }
  }

  const handleAddFile = async () => {
    if (!currentProject) return
    const defaultExt =
      {
        java: '.java',
        c: '.c',
        cpp: '.cpp',
        python: '.py',
        javascript: '.js',
      }[currentProject.language] || ''

    const input = prompt(
      `Enter file name(s) to add (separate multiple files with commas):\ne.g. Helper${defaultExt}, Utils${defaultExt}`
    )
    if (!input || !input.trim()) return

    const rawNames = input.split(/[,;\n]+/).map((s) => s.trim()).filter(Boolean)
    if (rawNames.length === 0) return

    const existingPaths = new Set(currentProject.files.map((f) => f.path.toLowerCase()))
    const newFiles: ProjectFile[] = []

    for (const raw of rawNames) {
      const name = raw.includes('.') ? raw : `${raw}${defaultExt}`
      if (existingPaths.has(name.toLowerCase())) {
        continue
      }
      existingPaths.add(name.toLowerCase())
      newFiles.push({
        path: name,
        name: name,
        content: '',
        language: currentProject.language,
      })
    }

    if (newFiles.length === 0) {
      alert('File(s) already exist or invalid name provided.')
      return
    }

    const updatedProject = {
      ...currentProject,
      files: [...currentProject.files, ...newFiles],
      activeFile: newFiles[0].path,
      updatedAt: Date.now(),
    }

    setCurrentProject(updatedProject)
    setActiveFilePath(newFiles[0].path)
    await storageService.saveProject(updatedProject)
  }

  const handleRenameFile = async (oldPath: string, newPath: string) => {
    if (!currentProject || !newPath.trim() || oldPath === newPath.trim()) return
    const cleanNew = newPath.trim()

    if (currentProject.files.some((f) => f.path.toLowerCase() === cleanNew.toLowerCase() && f.path !== oldPath)) {
      alert(`A file named "${cleanNew}" already exists in this project.`)
      return
    }

    const updatedFiles = currentProject.files.map((file) =>
      file.path === oldPath
        ? { ...file, path: cleanNew, name: cleanNew }
        : file
    )

    const isCurrentActive = activeFilePath === oldPath
    const newActive = isCurrentActive ? cleanNew : activeFilePath

    const updatedProject = {
      ...currentProject,
      files: updatedFiles,
      activeFile: currentProject.activeFile === oldPath ? cleanNew : currentProject.activeFile,
      updatedAt: Date.now(),
    }

    setCurrentProject(updatedProject)
    setActiveFilePath(newActive)
    await storageService.saveProject(updatedProject)
  }

  const handleDeleteFile = async (path: string) => {
    if (!currentProject || currentProject.files.length <= 1) return

    const remainingFiles = currentProject.files.filter((f) => f.path !== path)
    const newActive = remainingFiles[0].path

    const updatedProject = {
      ...currentProject,
      files: remainingFiles,
      activeFile: newActive,
      updatedAt: Date.now(),
    }

    setCurrentProject(updatedProject)
    setActiveFilePath(newActive)
    await storageService.saveProject(updatedProject)
  }

  const handleCreateProject = async (newProj: Project) => {
    await storageService.saveProject(newProj)
    setProjects((prev) => [newProj, ...prev])
    setCurrentProject(newProj)
    setActiveFilePath(newProj.activeFile || newProj.files[0]?.path || '')
    setDirtyFiles(new Set())
    setTerminalOutput('')
    setAccumulatedStdin('')
    setLastResult(null)
    setExecutionState('idle')
  }

  // Load Examples
  const handleLoadExample = async (multiFile: boolean) => {
    if (!currentProject) return
    const lang = currentProject.language

    if (multiFile) {
      const template = MULTI_FILE_EXAMPLES[lang]
      const updated: Project = {
        ...currentProject,
        name: `${template.title}`,
        activeFile: template.defaultEntry,
        files: template.files.map((f) => ({
          path: f.path,
          name: f.name,
          content: f.content,
          language: lang,
          isEntry: f.path === template.defaultEntry,
        })),
        updatedAt: Date.now(),
      }
      setCurrentProject(updated)
      setActiveFilePath(template.defaultEntry)
      await storageService.saveProject(updated)
    } else {
      const starter = STARTER_PROJECTS[lang]
      const updated: Project = {
        ...currentProject,
        name: starter.name,
        activeFile: starter.activeFile,
        files: starter.files.map((f) => ({ ...f })),
        updatedAt: Date.now(),
      }
      setCurrentProject(updated)
      setActiveFilePath(starter.activeFile)
      await storageService.saveProject(updated)
    }
    setDirtyFiles(new Set())
  }

  // Auto-format code
  const handleFormatCode = () => {
    if (!activeFile) return
    const lines = activeFile.content.split('\n')
    const formatted = lines.map((l) => l.trimEnd()).join('\n')
    handleContentChange(formatted)
  }

  // Download handlers
  const handleDownloadFile = () => {
    if (!activeFile) return
    ExportService.downloadFile(activeFile.name, activeFile.content)
  }

  const handleDownloadZip = async () => {
    if (!currentProject) return
    await ExportService.downloadProjectZip(currentProject)
  }

  const handleDownloadLog = () => {
    if (!currentProject) return
    const output = terminalOutput || 'No output'
    ExportService.downloadOutputLog(
      currentProject.name,
      output,
      lastResult ? { durationMs: lastResult.metrics.durationMs, exitCode: lastResult.exitCode } : undefined
    )
  }

  const isBusy = executionState === 'compiling' || executionState === 'running' || executionState === 'initializing'

  if (!currentProject || !activeFile) {
    return (
      <div className="h-full flex items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-500 font-mono text-sm">
        Initializing CodeSpace...
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 select-none antialiased overflow-hidden">
      {/* Top Navigation Header */}
      <Header
        language={currentProject.language}
        onLanguageChange={handleLanguageChange}
        executionState={executionState}
        onRun={handleRun}
        onStop={handleStop}
        onSave={handleSave}
        isDirty={dirtyFiles.size > 0}
        isAutoSave={settings.autoSave}
        theme={theme}
        onToggleTheme={() => {
          const next = theme === 'dark' ? 'light' : 'dark'
          setTheme(next)
          try {
            localStorage.setItem('codespace_theme', next)
          } catch (e) {}
          setSettings((prev) => ({ ...prev, theme: next }))
          storageService.saveSettings({ ...settings, theme: next })
        }}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onNewProject={() => setIsNewProjectOpen(true)}
        onDownloadFile={handleDownloadFile}
        onDownloadZip={handleDownloadZip}
        onDownloadLog={handleDownloadLog}
        onLoadExample={handleLoadExample}
        onFormatCode={handleFormatCode}
        layoutMode={layoutMode}
        onToggleLayoutMode={(m) => setLayoutMode(m)}
        mobileView={mobileView}
        onSetMobileView={(v) => setMobileView(v)}
      />

      {/* Dynamic status & cross-origin isolation banner */}
      <StatusBanner />

      {/* Main Workspace Body */}
      <main className="flex-1 flex overflow-hidden">
        {/* Far Left 48px Compact Language Sidebar (Desktop/Tablet) */}
        <LanguageStrip
          currentLanguage={currentProject.language}
          onLanguageChange={handleLanguageChange}
          onOpenSettings={() => setIsSettingsOpen(true)}
          disabled={isBusy}
        />

        {isMobileScreen ? (
          /* MOBILE VIEW: Optimized Screen Ratio Tabs ('code' | 'output' | 'split') */
          <div className="flex-1 flex flex-col h-full overflow-hidden">
            {mobileView === 'code' && (
              <div className="flex-1 w-full h-full flex flex-col bg-white dark:bg-slate-900 overflow-hidden">
                <CodeEditor
                  files={currentProject.files}
                  activeFilePath={activeFile.path}
                  onSelectFile={handleSelectFile}
                  onAddFile={handleAddFile}
                  onDeleteFile={handleDeleteFile}
                  onRenameFile={handleRenameFile}
                  content={activeFile.content}
                  language={currentProject.language}
                  onChange={handleContentChange}
                  onRun={handleRun}
                  onFormat={handleFormatCode}
                  settings={settings}
                  theme={theme}
                  onCursorChange={(pos) => setCursorPos(pos)}
                  onFontSizeChange={(size) => {
                    setSettings((prev) => ({ ...prev, fontSize: size }))
                    storageService.saveSettings({ ...settings, fontSize: size })
                  }}
                  layoutMode="friendly"
                />
              </div>
            )}

            {mobileView === 'output' && (
              <div className="flex-1 w-full h-full flex flex-col bg-slate-50 dark:bg-slate-950 overflow-hidden">
                <OutputConsole
                  executionState={executionState}
                  result={lastResult}
                  terminalOutput={terminalOutput}
                  language={currentProject.language}
                  onSendInput={handleSendInput}
                  onClearConsole={() => {
                    setTerminalOutput('')
                    setAccumulatedStdin('')
                    setLastResult(null)
                    setExecutionState('idle')
                  }}
                  onCopyOutput={() => {
                    navigator.clipboard.writeText(terminalOutput)
                  }}
                  onRun={handleRun}
                  codeContent={activeFile.content}
                  layoutMode="friendly"
                  isCollapsed={false}
                  onBackToCode={() => setMobileView('code')}
                />
              </div>
            )}

            {mobileView === 'split' && (
              <div className="flex-1 flex flex-col h-full overflow-hidden">
                <div className="w-full flex-1 flex flex-col bg-white dark:bg-slate-900 overflow-hidden min-h-[120px]">
                  <CodeEditor
                    files={currentProject.files}
                    activeFilePath={activeFile.path}
                    onSelectFile={handleSelectFile}
                    onAddFile={handleAddFile}
                    onDeleteFile={handleDeleteFile}
                    onRenameFile={handleRenameFile}
                    content={activeFile.content}
                    language={currentProject.language}
                    onChange={handleContentChange}
                    onRun={handleRun}
                    onFormat={handleFormatCode}
                    settings={settings}
                    theme={theme}
                    onCursorChange={(pos) => setCursorPos(pos)}
                    onFontSizeChange={(size) => {
                      setSettings((prev) => ({ ...prev, fontSize: size }))
                      storageService.saveSettings({ ...settings, fontSize: size })
                    }}
                    layoutMode="friendly"
                  />
                </div>

                {/* Resizable Divider with Touch Support */}
                <div
                  onMouseDown={handleDividerMouseDown}
                  onTouchStart={handleDividerTouchStart}
                  className="h-2.5 bg-slate-100 hover:bg-indigo-100/70 dark:bg-slate-800 dark:hover:bg-indigo-950/70 border-y border-slate-200 dark:border-slate-700 cursor-row-resize flex items-center justify-center shrink-0 transition select-none group touch-none"
                  title="Drag to resize panes"
                >
                  <div className="w-12 h-1 bg-slate-300 dark:bg-slate-600 group-hover:bg-indigo-500 rounded-full transition-colors flex items-center justify-center gap-0.5">
                    <span className="w-1 h-0.5 bg-slate-400 group-hover:bg-white rounded-full"></span>
                    <span className="w-1 h-0.5 bg-slate-400 group-hover:bg-white rounded-full"></span>
                    <span className="w-1 h-0.5 bg-slate-400 group-hover:bg-white rounded-full"></span>
                  </div>
                </div>

                <OutputConsole
                  executionState={executionState}
                  result={lastResult}
                  terminalOutput={terminalOutput}
                  language={currentProject.language}
                  onSendInput={handleSendInput}
                  onClearConsole={() => {
                    setTerminalOutput('')
                    setAccumulatedStdin('')
                    setLastResult(null)
                    setExecutionState('idle')
                  }}
                  onCopyOutput={() => {
                    navigator.clipboard.writeText(terminalOutput)
                  }}
                  onRun={handleRun}
                  codeContent={activeFile.content}
                  layoutMode="friendly"
                  height={bottomConsoleHeight}
                  isCollapsed={isConsoleCollapsed}
                  onToggleCollapse={() => setIsConsoleCollapsed(!isConsoleCollapsed)}
                  onBackToCode={() => setMobileView('code')}
                />
              </div>
            )}
          </div>
        ) : layoutMode === 'friendly' ? (
          /* DESKTOP FRIENDLY VIEW: Top Editor, Bottom Terminal */
          <div className="flex-1 flex flex-col h-full overflow-hidden">
            <div className="w-full flex-1 flex flex-col bg-white dark:bg-slate-900 overflow-hidden min-h-[140px]">
              <CodeEditor
                files={currentProject.files}
                activeFilePath={activeFile.path}
                onSelectFile={handleSelectFile}
                onAddFile={handleAddFile}
                onDeleteFile={handleDeleteFile}
                onRenameFile={handleRenameFile}
                content={activeFile.content}
                language={currentProject.language}
                onChange={handleContentChange}
                onRun={handleRun}
                onFormat={handleFormatCode}
                settings={settings}
                theme={theme}
                onCursorChange={(pos) => setCursorPos(pos)}
                onFontSizeChange={(size) => {
                  setSettings((prev) => ({ ...prev, fontSize: size }))
                  storageService.saveSettings({ ...settings, fontSize: size })
                }}
                layoutMode="friendly"
              />
            </div>

            <div
              onMouseDown={handleDividerMouseDown}
              onTouchStart={handleDividerTouchStart}
              className="h-2 bg-slate-100 hover:bg-indigo-100/70 dark:bg-slate-800 dark:hover:bg-indigo-950/70 border-y border-slate-200 dark:border-slate-700 cursor-row-resize flex items-center justify-center shrink-0 transition select-none group touch-none"
              title="Drag to resize panes"
            >
              <div className="w-12 h-1 bg-slate-300 dark:bg-slate-600 group-hover:bg-indigo-500 rounded-full transition-colors flex items-center justify-center gap-0.5">
                <span className="w-1 h-0.5 bg-slate-400 group-hover:bg-white rounded-full"></span>
                <span className="w-1 h-0.5 bg-slate-400 group-hover:bg-white rounded-full"></span>
                <span className="w-1 h-0.5 bg-slate-400 group-hover:bg-white rounded-full"></span>
              </div>
            </div>

            <OutputConsole
              executionState={executionState}
              result={lastResult}
              terminalOutput={terminalOutput}
              language={currentProject.language}
              onSendInput={handleSendInput}
              onClearConsole={() => {
                setTerminalOutput('')
                setAccumulatedStdin('')
                setLastResult(null)
                setExecutionState('idle')
              }}
              onCopyOutput={() => {
                navigator.clipboard.writeText(terminalOutput)
              }}
              onRun={handleRun}
              codeContent={activeFile.content}
              layoutMode="friendly"
              height={bottomConsoleHeight}
              isCollapsed={isConsoleCollapsed}
              onToggleCollapse={() => setIsConsoleCollapsed(!isConsoleCollapsed)}
            />
          </div>
        ) : (
          /* DESKTOP PRO VERSION: Side-by-Side Split View */
          <div className="flex-1 flex flex-col md:flex-row h-full overflow-hidden">
            <CodeEditor
              files={currentProject.files}
              activeFilePath={activeFile.path}
              onSelectFile={handleSelectFile}
              onAddFile={handleAddFile}
              onDeleteFile={handleDeleteFile}
              onRenameFile={handleRenameFile}
              content={activeFile.content}
              language={currentProject.language}
              onChange={handleContentChange}
              onRun={handleRun}
              onFormat={handleFormatCode}
              settings={settings}
              theme={theme}
              onCursorChange={(pos) => setCursorPos(pos)}
              onFontSizeChange={(size) => {
                setSettings((prev) => ({ ...prev, fontSize: size }))
                storageService.saveSettings({ ...settings, fontSize: size })
              }}
              layoutMode="pro"
            />

            <OutputConsole
              executionState={executionState}
              result={lastResult}
              terminalOutput={terminalOutput}
              language={currentProject.language}
              onSendInput={handleSendInput}
              onClearConsole={() => {
                setTerminalOutput('')
                setAccumulatedStdin('')
                setLastResult(null)
                setExecutionState('idle')
              }}
              onCopyOutput={() => {
                navigator.clipboard.writeText(terminalOutput)
              }}
              onRun={handleRun}
              codeContent={activeFile.content}
              layoutMode="pro"
            />
          </div>
        )}
      </main>

      {/* Bottom Status Bar */}
      <FooterBar
        language={currentProject.language}
        executionState={executionState}
        cursorPosition={cursorPos}
        tabSize={settings.tabSize}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSaveSettings={(newSettings) => {
          setSettings(newSettings)
          if (newSettings.theme && newSettings.theme !== theme) {
            setTheme(newSettings.theme)
            try {
              localStorage.setItem('codespace_theme', newSettings.theme)
            } catch (e) {}
          }
          storageService.saveSettings(newSettings)
        }}
      />

      {/* New Project Modal */}
      <NewProjectModal
        isOpen={isNewProjectOpen}
        onClose={() => setIsNewProjectOpen(false)}
        onCreateProject={handleCreateProject}
      />
    </div>
  )
}
