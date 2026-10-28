import type { ILanguageRuntime, RuntimeRunOptions } from '../types'
import type { Language, ProjectFile, ExecutionResult, RuntimeCapabilities, Diagnostic } from '../../types'

export class JavaScriptRuntime implements ILanguageRuntime {
  readonly language: Language = 'javascript'
  readonly name = 'JavaScript (V8/Browser Worker)'

  private worker: Worker | null = null
  private activeRunId: string | null = null
  private activeReject: ((reason?: unknown) => void) | null = null
  private activeTimer: ReturnType<typeof setTimeout> | null = null
  private ready = false

  async initialize(): Promise<void> {
    this.ensureWorker()
    this.ready = true
  }

  isReady(): boolean {
    return this.ready
  }

  private ensureWorker(): Worker {
    if (!this.worker) {
      this.worker = new Worker(
        new URL('../../workers/javascript.worker.ts', import.meta.url),
        { type: 'module' }
      )
    }
    return this.worker
  }

  async run(
    files: ProjectFile[],
    options: RuntimeRunOptions
  ): Promise<ExecutionResult> {
    this.ensureWorker()
    const { runId, entryPoint, stdin, timeoutMs = 15000, onStream, onProgress } = options
    this.activeRunId = runId

    const startTime = performance.now()
    onProgress?.('running', 0.1, 'Executing JavaScript in dedicated Web Worker...')

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
            // Attempt to parse line number from error stack
            const match = /<anonymous>:(\d+):(\d+)/.exec(data.error) || /:(\d+):(\d+)/.exec(data.error)
            const line = match ? parseInt(match[1], 10) : undefined
            const column = match ? parseInt(match[2], 10) : undefined

            diagnostics.push({
              severity: 'error',
              message: data.error,
              file: entryFile.path,
              line,
              column,
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

      // Set timeout
      this.activeTimer = setTimeout(() => {
        if (this.activeRunId === runId) {
          this.stop()
          resolve({
            stdout: stdoutAccumulator,
            stderr: stderrAccumulator + `\n[CodeSpace] Execution timed out after ${timeoutMs / 1000}s limit.`,
            exitCode: 124,
            diagnostics: [
              {
                severity: 'error',
                message: `Execution timed out (${timeoutMs / 1000}s limit exceeded). Possible infinite loop.`,
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

      // Post execution message to worker
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
    this.ensureWorker()
  }

  async dispose(): Promise<void> {
    await this.stop()
    if (this.worker) {
      this.worker.terminate()
      this.worker = null
    }
    this.ready = false
  }

  getCapabilities(): RuntimeCapabilities {
    return {
      supportsMultiFile: true,
      supportsInteractiveStdin: false,
      supportsPreloadedStdin: true,
      supportsMemoryMetrics: typeof performance !== 'undefined' && 'memory' in performance,
      inBrowserCompiler: false,
      clientSideExecution: true,
      notes: 'Runs directly in a dedicated Web Worker using the browser JS engine.',
      limitations: [
        'Web Worker context does not have access to document or window DOM.',
        'Network fetch calls subject to standard browser CORS policies.',
        'Worker isolation is not an absolute hardware security boundary.',
      ],
    }
  }
}
