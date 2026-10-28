import type { Language, ProjectFile, ExecutionResult, RuntimeCapabilities } from '../types'

export interface RuntimeRunOptions {
  runId: string
  entryPoint: string
  stdin?: string
  timeoutMs?: number
  onStream?: (stream: 'stdout' | 'stderr', chunk: string) => void
  onProgress?: (phase: string, progress: number, message?: string) => void
}

export interface ILanguageRuntime {
  readonly language: Language
  readonly name: string

  /**
   * Initialize runtime assets, WebAssembly modules, or workers.
   */
  initialize(onProgress?: (progress: number, message: string) => void): Promise<void>

  /**
   * Execute source files with stdin and timeout.
   */
  run(
    files: ProjectFile[],
    options: RuntimeRunOptions
  ): Promise<ExecutionResult>

  /**
   * Send interactive input chunk while running if supported.
   */
  sendInput?(chunk: string): void

  /**
   * Stop current execution immediately.
   */
  stop(): Promise<void>

  /**
   * Dispose worker/engine resources.
   */
  dispose(): Promise<void>

  /**
   * Check if the runtime has completed initialization.
   */
  isReady(): boolean

  /**
   * Precompile project in background to accelerate first run.
   */
  precompile?(files: ProjectFile[], entryPoint?: string): Promise<void>

  /**
   * Capabilities and limitations documentation.
   */
  getCapabilities(): RuntimeCapabilities
}
