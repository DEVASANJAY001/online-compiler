// Dedicated Web Worker for JavaScript Execution

interface RunMessage {
  type: 'run'
  runId: string
  code: string
  stdin?: string
  files?: Array<{ path: string; content: string }>
}

interface StdinMessage {
  type: 'stdin'
  runId: string
  chunk: string
}

type WorkerInMessage = RunMessage | StdinMessage

let activeRunId: string | null = null

self.addEventListener('message', async (event: MessageEvent<WorkerInMessage>) => {
  const data = event.data

  if (data.type === 'run') {
    activeRunId = data.runId
    const runId = data.runId
    const startTime = performance.now()

    // Create custom output buffers
    let stdoutBuffer = ''
    let stderrBuffer = ''

    const sendChunk = (stream: 'stdout' | 'stderr', chunk: string) => {
      if (activeRunId !== runId) return
      if (stream === 'stdout') stdoutBuffer += chunk
      else stderrBuffer += chunk

      self.postMessage({
        type: 'stream',
        runId,
        stream,
        chunk,
      })
    }

    // Capture console methods
    const originalConsole = {
      log: console.log,
      info: console.info,
      warn: console.warn,
      error: console.error,
    }

    const formatArgs = (...args: unknown[]): string => {
      return args
        .map((arg) => {
          if (typeof arg === 'object') {
            try {
              return JSON.stringify(arg, null, 2)
            } catch {
              return String(arg)
            }
          }
          return String(arg)
        })
        .join(' ')
    }

    console.log = (...args: unknown[]) => {
      sendChunk('stdout', formatArgs(...args) + '\n')
    }
    console.info = (...args: unknown[]) => {
      sendChunk('stdout', '[INFO] ' + formatArgs(...args) + '\n')
    }
    console.warn = (...args: unknown[]) => {
      sendChunk('stderr', '[WARN] ' + formatArgs(...args) + '\n')
    }
    console.error = (...args: unknown[]) => {
      sendChunk('stderr', '[ERROR] ' + formatArgs(...args) + '\n')
    }

    // Virtual filesystem / require or import helper
    const virtualFiles = new Map<string, string>()
    if (data.files) {
      for (const file of data.files) {
        virtualFiles.set(file.path, file.content)
        virtualFiles.set(file.path.replace(/^\.?\//, ''), file.content)
      }
    }

    // Provide standard input simulation
    const stdinLines = (data.stdin || '').split('\n')
    let stdinIndex = 0
    const readline = (): string => {
      if (stdinIndex < stdinLines.length) {
        return stdinLines[stdinIndex++]
      }
      return ''
    }

    try {
      // Create sandbox context function
      // Using AsyncFunction constructor inside the dedicated Web Worker
      const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor
      
      const runner = new AsyncFunction(
        'console',
        'readline',
        'files',
        `"use strict";
${data.code}`
      )

      await runner(console, readline, virtualFiles)

      const executionDurationMs = performance.now() - startTime

      // Memory inspection if supported
      const memory = (performance as unknown as { memory?: { usedJSHeapSize: number } }).memory
      const memoryBytes = memory ? memory.usedJSHeapSize : null

      if (activeRunId === runId) {
        self.postMessage({
          type: 'done',
          runId,
          exitCode: 0,
          stdout: stdoutBuffer,
          stderr: stderrBuffer,
          executionDurationMs,
          memoryBytes,
        })
      }
    } catch (err: unknown) {
      const error = err as Error
      const errorMessage = error?.stack || error?.message || String(err)
      sendChunk('stderr', errorMessage + '\n')

      const executionDurationMs = performance.now() - startTime

      if (activeRunId === runId) {
        self.postMessage({
          type: 'done',
          runId,
          exitCode: 1,
          stdout: stdoutBuffer,
          stderr: stderrBuffer,
          executionDurationMs,
          error: errorMessage,
        })
      }
    } finally {
      console.log = originalConsole.log
      console.info = originalConsole.info
      console.warn = originalConsole.warn
      console.error = originalConsole.error
    }
  }
})
