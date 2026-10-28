import type { ILanguageRuntime, RuntimeRunOptions } from '../types'
import type { Language, ProjectFile, ExecutionResult, RuntimeCapabilities, Diagnostic } from '../../types'

export class PythonRuntime implements ILanguageRuntime {
  readonly language: Language = 'python'
  readonly name = 'Python 3.12 (Pyodide / WebAssembly)'

  private worker: Worker | null = null
  private activeRunId: string | null = null
  private activeReject: ((reason?: unknown) => void) | null = null
  private activeTimer: ReturnType<typeof setTimeout> | null = null
  private ready = false
  private initPromise: Promise<void> | null = null

  async initialize(onProgress?: (progress: number, message: string) => void): Promise<void> {
    if (this.ready) return
    if (this.initPromise) return this.initPromise

    this.initPromise = new Promise<void>((resolve, reject) => {
      this.ensureWorker()

      const handler = (event: MessageEvent) => {
        const data = event.data
        if (data.type === 'init-progress') {
          onProgress?.(data.progress, data.message)
        } else if (data.type === 'init-complete') {
          this.worker?.removeEventListener('message', handler)
          this.ready = true
          resolve()
        } else if (data.type === 'init-error') {
          this.worker?.removeEventListener('message', handler)
          reject(new Error(data.error || 'Failed to initialize Pyodide runtime.'))
        }
      }

      this.worker!.addEventListener('message', handler)
      this.worker!.postMessage({ type: 'init' })
    })

    return this.initPromise
  }

  isReady(): boolean {
    return this.ready
  }

  private ensureWorker(): Worker {
    if (!this.worker) {
      this.worker = new Worker(
        new URL('../../workers/python.worker.ts', import.meta.url)
      )
    }
    return this.worker
  }

  async run(
    files: ProjectFile[],
    options: RuntimeRunOptions
  ): Promise<ExecutionResult> {
    const { runId, entryPoint, stdin, timeoutMs = 20000, onStream, onProgress } = options
    this.activeRunId = runId

    const startTime = performance.now()

    if (!this.ready) {
      onProgress?.('initializing', 0.2, 'Loading Pyodide CPython WebAssembly runtime...')
      await this.initialize((p, msg) => {
        onProgress?.('initializing', p, msg)
      })
    }

    onProgress?.('running', 0.9, 'Running Python script in sandboxed worker...')

    const entryFile = files.find((f) => f.path === entryPoint) || files[0]
    if (!entryFile) {
      throw new Error(`Entry point file '${entryPoint}' not found.`)
    }

    return new Promise<ExecutionResult>((resolve, reject) => {
      this.activeReject = reject

      let stdoutAccumulator = ''
      let stderrAccumulator = ''

      const cleanup = () => {
        if (this.activeTimer) {
          clearTimeout(this.activeTimer)
          this.activeTimer = null
        }
        if (this.worker) {
          this.worker.removeEventListener('message', messageHandler)
        }
        this.activeReject = null
      }

      const messageHandler = (event: MessageEvent) => {
        const data = event.data
        if (data.runId !== runId) return

        if (data.type === 'stream') {
          if (data.stream === 'stdout') {
            stdoutAccumulator += data.chunk
          } else {
            stderrAccumulator += data.chunk
          }
          onStream?.(data.stream, data.chunk)
        } else if (data.type === 'done') {
          cleanup()
          const totalDuration = performance.now() - startTime

          const diagnostics: Diagnostic[] = []
          if (data.error) {
            // Parse Python traceback: File "<exec>", line 4, in <module>
            const lineMatch = /line (\d+)/i.exec(data.error)
            const line = lineMatch ? parseInt(lineMatch[1], 10) : undefined

            diagnostics.push({
              severity: 'error',
              message: data.error,
              file: entryFile.path,
              line,
            })
          }

          resolve({
            stdout: stdoutAccumulator,
            stderr: stderrAccumulator,
            exitCode: data.exitCode,
            diagnostics,
            metrics: {
              durationMs: totalDuration,
              executionTimeMs: data.executionDurationMs || totalDuration,
              memoryBytes: data.memoryBytes ?? null,
            },
          })
        }
      }

      this.worker!.addEventListener('message', messageHandler)

      // Set execution timeout
      this.activeTimer = setTimeout(() => {
        if (this.activeRunId === runId) {
          this.stop()
          resolve({
            stdout: stdoutAccumulator,
            stderr: stderrAccumulator + `\n[CodeSpace] Python execution timed out after ${timeoutMs / 1000}s limit.`,
            exitCode: 124,
            diagnostics: [
              {
                severity: 'error',
                message: `Python execution timed out (${timeoutMs / 1000}s limit exceeded). Possible infinite loop.`,
                file: entryFile.path,
              },
            ],
            metrics: {
              durationMs: performance.now() - startTime,
              terminationReason: 'timeout',
            },
            termination: 'timeout',
          })
        }
      }, timeoutMs)

      // Post execution message
      this.worker!.postMessage({
        type: 'run',
        runId,
        code: entryFile.content,
        stdin: stdin || '',
        files: files.map((f) => ({ path: f.path, content: f.content })),
      })
    })
  }

  async stop(): Promise<void> {
    if (this.activeTimer) {
      clearTimeout(this.activeTimer)
      this.activeTimer = null
    }
    if (this.worker) {
      this.worker.terminate()
      this.worker = null
    }
    this.activeRunId = null
    this.ready = false
    this.initPromise = null
  }

  async dispose(): Promise<void> {
    await this.stop()
  }

  getCapabilities(): RuntimeCapabilities {
    return {
      supportsMultiFile: true,
      supportsInteractiveStdin: false,
      supportsPreloadedStdin: true,
      supportsMemoryMetrics: true,
      inBrowserCompiler: false,
      clientSideExecution: true,
      notes: 'Full CPython 3.12 compiled to WebAssembly via Pyodide, executing in a dedicated Web Worker.',
      limitations: [
        'Native C extensions that are not precompiled for Pyodide cannot be dynamically loaded.',
        'No direct OS subprocesses or raw socket networking.',
        'Filesystem is in-memory virtual Emscripten FS.',
      ],
    }
  }
}
