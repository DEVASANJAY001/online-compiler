import type { Language, ProjectFile, ExecutionResult, RuntimeCapabilities } from '../types'
import type { ILanguageRuntime, RuntimeRunOptions } from './types'
import { JavaScriptRuntime } from './javascript/JavaScriptRuntime'
import { PythonRuntime } from './python/PythonRuntime'
import { CRuntime } from './c/CRuntime'
import { CppRuntime } from './cpp/CppRuntime'
import { JavaRuntime } from './java/JavaRuntime'

export class RuntimeManager {
  private static instance: RuntimeManager
  private runtimes = new Map<Language, ILanguageRuntime>()
  private activeLanguage: Language | null = null
  private currentRunId: string | null = null

  private constructor() {}

  public static getInstance(): RuntimeManager {
    if (!RuntimeManager.instance) {
      RuntimeManager.instance = new RuntimeManager()
    }
    return RuntimeManager.instance
  }

  public getRuntime(language: Language): ILanguageRuntime {
    let runtime = this.runtimes.get(language)
    if (!runtime) {
      switch (language) {
        case 'javascript':
          runtime = new JavaScriptRuntime()
          break
        case 'python':
          runtime = new PythonRuntime()
          break
        case 'c':
          runtime = new CRuntime()
          break
        case 'cpp':
          runtime = new CppRuntime()
          break
        case 'java':
          runtime = new JavaRuntime()
          break
        default:
          throw new Error(`Unsupported language: ${language}`)
      }
      this.runtimes.set(language, runtime)
    }
    return runtime
  }

  public prewarm(language: Language): void {
    try {
      const runtime = this.getRuntime(language)
      if (runtime.initialize && !runtime.isReady()) {
        runtime.initialize().catch(() => {})
      }
    } catch {
      // Ignore background prewarm errors
    }
  }

  public precompile(language: Language, files: ProjectFile[], entryPoint?: string): void {
    try {
      const runtime = this.getRuntime(language)
      if (runtime.precompile) {
        runtime.precompile(files, entryPoint).catch(() => {})
      }
    } catch {
      // Ignore background precompile errors
    }
  }

  public prewarmIdle(): void {
    if (typeof window === 'undefined') return
    const schedule = typeof window.requestIdleCallback === 'function'
      ? window.requestIdleCallback
      : (fn: () => void) => setTimeout(fn, 1500)

    schedule(() => {
      // Warm up WasmOj engines and Python worker in idle slices
      const langs: Language[] = ['c', 'cpp', 'java', 'python']
      langs.forEach((lang, idx) => {
        setTimeout(() => {
          this.prewarm(lang)
        }, idx * 1000)
      })
    })
  }

  public async run(
    language: Language,
    files: ProjectFile[],
    options: Omit<RuntimeRunOptions, 'runId'>
  ): Promise<ExecutionResult> {
    const runId = `run_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
    this.currentRunId = runId
    this.activeLanguage = language

    const runtime = this.getRuntime(language)

    const fullOptions: RuntimeRunOptions = {
      ...options,
      runId,
    }

    try {
      const result = await runtime.run(files, fullOptions)
      return result
    } finally {
      if (this.currentRunId === runId) {
        this.currentRunId = null
      }
    }
  }

  public async stop(): Promise<void> {
    if (this.activeLanguage) {
      const runtime = this.runtimes.get(this.activeLanguage)
      if (runtime) {
        await runtime.stop()
      }
      this.currentRunId = null
    }
  }

  public getCapabilities(language: Language): RuntimeCapabilities {
    return this.getRuntime(language).getCapabilities()
  }

  public async disposeAll(): Promise<void> {
    for (const runtime of this.runtimes.values()) {
      await runtime.dispose()
    }
    this.runtimes.clear()
    this.activeLanguage = null
    this.currentRunId = null
  }
}

export const runtimeManager = RuntimeManager.getInstance()
