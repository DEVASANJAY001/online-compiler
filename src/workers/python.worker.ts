// Dedicated Web Worker for Python Execution via Pyodide
declare function importScripts(...urls: string[]): void

const PYODIDE_VERSION = 'v0.26.4'
const PYODIDE_CDN = `https://cdn.jsdelivr.net/pyodide/${PYODIDE_VERSION}/full/`

interface PyodideInterface {
  runPythonAsync: (code: string) => Promise<unknown>
  setStdout: (options: { batched?: (text: string) => void }) => void
  setStderr: (options: { batched?: (text: string) => void }) => void
  FS: {
    writeFile: (path: string, content: string | Uint8Array) => void
    unlink: (path: string) => void
  }
  _module?: {
    HEAPU8?: Uint8Array
    wasmMemory?: { buffer: ArrayBuffer }
  }
}

declare function loadPyodide(options: {
  indexURL: string
  stdout?: (text: string) => void
  stderr?: (text: string) => void
}): Promise<PyodideInterface>

let pyodideInstance: PyodideInterface | null = null
let isInitializing = false
let initPromise: Promise<PyodideInterface> | null = null
let activeRunId: string | null = null

async function getPyodide(): Promise<PyodideInterface> {
  if (pyodideInstance) return pyodideInstance
  if (initPromise) return initPromise

  initPromise = (async () => {
    isInitializing = true
    self.postMessage({
      type: 'init-progress',
      progress: 0.2,
      message: 'Loading Pyodide runtime script...',
    })

    // Import Pyodide loader
    try {
      importScripts(`${PYODIDE_CDN}pyodide.js`)
    } catch {
      throw new Error(`Failed to load Pyodide from CDN: ${PYODIDE_CDN}pyodide.js`)
    }

    self.postMessage({
      type: 'init-progress',
      progress: 0.5,
      message: 'Initializing WebAssembly Python VM...',
    })

    pyodideInstance = await loadPyodide({
      indexURL: PYODIDE_CDN,
    })

    self.postMessage({
      type: 'init-progress',
      progress: 1.0,
      message: 'Pyodide ready.',
    })

    isInitializing = false
    return pyodideInstance
  })()

  return initPromise
}

self.addEventListener('message', async (event: MessageEvent) => {
  const data = event.data

  if (data.type === 'init') {
    try {
      await getPyodide()
      self.postMessage({ type: 'init-complete' })
    } catch (err) {
      self.postMessage({
        type: 'init-error',
        error: err instanceof Error ? err.message : String(err),
      })
    }
    return
  }

  if (data.type === 'run') {
    activeRunId = data.runId
    const runId = data.runId
    const startTime = performance.now()

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

    try {
      const pyodide = await getPyodide()
      if (activeRunId !== runId) return

      // Mount virtual files into Pyodide virtual filesystem
      const writtenPaths: string[] = []
      if (Array.isArray(data.files)) {
        for (const file of data.files) {
          try {
            const cleanPath = file.path.replace(/^\.?\//, '')
            pyodide.FS.writeFile(cleanPath, file.content)
            writtenPaths.push(cleanPath)
          } catch {
            // ignore fs path error
          }
        }
      }

      // Configure stdout and stderr redirects
      pyodide.setStdout({
        batched: (text: string) => {
          sendChunk('stdout', text + '\n')
        },
      })

      pyodide.setStderr({
        batched: (text: string) => {
          sendChunk('stderr', text + '\n')
        },
      })

      // Prepare standard input injection
      const stdinContent = JSON.stringify(data.stdin || '')
      const setupScript = `
import sys, io

class CodeSpaceStdin(io.StringIO):
    def __init__(self, initial_value=""):
        super().__init__(initial_value)
    def readline(self, size=-1):
        line = super().readline(size)
        return line

sys.stdin = CodeSpaceStdin(${stdinContent})
`
      await pyodide.runPythonAsync(setupScript)

      // Execute user code
      await pyodide.runPythonAsync(data.code)

      const executionDurationMs = performance.now() - startTime

      // Clean up written files
      for (const p of writtenPaths) {
        try {
          pyodide.FS.unlink(p)
        } catch {
          // ignore
        }
      }

      // Memory inspection
      let memoryBytes: number | null = null
      if (pyodide._module?.wasmMemory?.buffer) {
        memoryBytes = pyodide._module.wasmMemory.buffer.byteLength
      } else if (pyodide._module?.HEAPU8) {
        memoryBytes = pyodide._module.HEAPU8.byteLength
      }

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
      const errorMessage = error?.message || String(err)
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
    }
  }
})
