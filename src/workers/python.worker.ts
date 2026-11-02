// Dedicated Web Worker for Python Execution via Pyodide CPython WebAssembly
declare function importScripts(...urls: string[]): void

const PYODIDE_CDNS = [
  'https://cdn.jsdelivr.net/pyodide/v0.26.4/full/',
  'https://unpkg.com/pyodide@0.26.4/',
]

const CACHE_NAME = 'codespace-pyodide-v0.26.4'

interface PyodideInterface {
  runPythonAsync: (code: string) => Promise<unknown>
  runPython: (code: string) => unknown
  setStdout?: (options: { batched?: (text: string) => void; raw?: (byte: number) => void }) => void
  setStderr?: (options: { batched?: (text: string) => void; raw?: (byte: number) => void }) => void
  FS: {
    writeFile: (path: string, content: string | Uint8Array) => void
    unlink: (path: string) => void
    mkdir?: (path: string) => void
  }
  globals?: {
    set: (name: string, value: unknown) => void
    get: (name: string) => unknown
  }
  _module?: {
    HEAPU8?: Uint8Array
    wasmMemory?: { buffer: ArrayBuffer }
  }
}

type LoadPyodideFn = (options: { indexURL: string }) => Promise<PyodideInterface>

let pyodideInstance: PyodideInterface | null = null
let initPromise: Promise<PyodideInterface> | null = null
let isEnvConfigured = false
let activeRunId: string | null = null

// Intercept fetch to cache large Pyodide WebAssembly assets (.wasm, .zip, .json) in persistent CacheStorage
if (typeof self !== 'undefined' && typeof self.fetch === 'function' && typeof caches !== 'undefined') {
  const originalFetch = self.fetch.bind(self)
  self.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const urlStr = typeof input === 'string' ? input : input instanceof Request ? input.url : input.toString()
    const isPyodideAsset = PYODIDE_CDNS.some((cdn) => urlStr.startsWith(cdn))

    if (isPyodideAsset) {
      try {
        const cache = await caches.open(CACHE_NAME)
        const cached = await cache.match(urlStr)
        if (cached) {
          return cached
        }
        const networkResponse = await originalFetch(input, init)
        if (networkResponse && networkResponse.ok) {
          cache.put(urlStr, networkResponse.clone()).catch(() => {})
        }
        return networkResponse
      } catch {
        // Fallback to network
      }
    }
    return originalFetch(input, init)
  }
}

async function resolveLoadPyodide(): Promise<{ loadPyodide: LoadPyodideFn; cdnUrl: string }> {
  for (const cdn of PYODIDE_CDNS) {
    // Strategy 1: Dynamic ES module import (standard for module workers)
    try {
      const moduleUrl = `${cdn}pyodide.mjs`
      const mod = await import(/* @vite-ignore */ moduleUrl)
      if (typeof mod.loadPyodide === 'function') {
        return { loadPyodide: mod.loadPyodide, cdnUrl: cdn }
      }
    } catch (e) {
      console.warn(`[CodeSpace Python] ESM import failed from ${cdn}:`, e)
    }

    // Strategy 2: If running as classic worker where importScripts is supported
    if (typeof importScripts === 'function') {
      try {
        importScripts(`${cdn}pyodide.js`)
        const candidate = (self as unknown as { loadPyodide?: LoadPyodideFn | { loadPyodide?: LoadPyodideFn } }).loadPyodide
        if (typeof candidate === 'function') {
          return { loadPyodide: candidate, cdnUrl: cdn }
        }
        if (candidate && typeof candidate.loadPyodide === 'function') {
          return { loadPyodide: candidate.loadPyodide, cdnUrl: cdn }
        }
      } catch (e) {
        console.warn(`[CodeSpace Python] importScripts failed from ${cdn}:`, e)
      }
    }

    // Strategy 3: fetch script and evaluate in worker global scope
    try {
      const res = await fetch(`${cdn}pyodide.js`)
      if (res.ok) {
        const text = await res.text()
        const fn = new Function(
          text +
            '\nreturn (typeof loadPyodide === "function" ? loadPyodide : (typeof loadPyodide !== "undefined" && loadPyodide && typeof loadPyodide.loadPyodide === "function" ? loadPyodide.loadPyodide : self.loadPyodide));'
        )
        const candidate = fn()
        if (typeof candidate === 'function') {
          return { loadPyodide: candidate, cdnUrl: cdn }
        }
      }
    } catch (e) {
      console.warn(`[CodeSpace Python] fetch fallback failed from ${cdn}:`, e)
    }
  }

  // Strategy 4: Check if global loadPyodide was already initialized
  const globalCandidate = (self as unknown as { loadPyodide?: LoadPyodideFn }).loadPyodide
  if (typeof globalCandidate === 'function') {
    return { loadPyodide: globalCandidate, cdnUrl: PYODIDE_CDNS[0] }
  }

  throw new Error('Failed to load Pyodide from CDN. Please verify network access to jsdelivr or unpkg.')
}

async function getPyodide(): Promise<PyodideInterface> {
  if (pyodideInstance) return pyodideInstance
  if (initPromise) return initPromise

  initPromise = (async () => {
    self.postMessage({
      type: 'init-progress',
      progress: 0.2,
      message: 'Loading Pyodide CPython WebAssembly runtime...',
    })

    const { loadPyodide, cdnUrl } = await resolveLoadPyodide()

    self.postMessage({
      type: 'init-progress',
      progress: 0.5,
      message: 'Initializing WebAssembly Python VM...',
    })

    pyodideInstance = await loadPyodide({
      indexURL: cdnUrl,
    })

    // Setup base environment once during initialization for maximum execution speed
    configureBaseEnvironment(pyodideInstance)

    self.postMessage({
      type: 'init-progress',
      progress: 1.0,
      message: 'Pyodide ready.',
    })

    return pyodideInstance
  })()

  return initPromise
}

function configureBaseEnvironment(pyodide: PyodideInterface) {
  if (isEnvConfigured) return

  // Register host chunk sender function
  if (pyodide.globals && typeof pyodide.globals.set === 'function') {
    pyodide.globals.set('__codespace_send_chunk__', (stream: string, text: string) => {
      if (activeStreamChunkSender) {
        activeStreamChunkSender(stream as 'stdout' | 'stderr', text)
      }
    })
  }

  // Setup Python streams, sys.path, interactive input override, and bytecode cache dictionary
  const baseSetupScript = `
import sys, io, builtins

for _p in [".", "/home/pyodide"]:
    if _p not in sys.path:
        sys.path.insert(0, _p)

_bytecode_cache = {}

class CodeSpaceOutputStream:
    def __init__(self, stream_type):
        self.stream_type = stream_type
    def write(self, s):
        if s:
            try:
                __codespace_send_chunk__(self.stream_type, str(s))
            except Exception:
                pass
        return len(s) if s else 0
    def flush(self):
        pass
    def isatty(self):
        return False

sys.stdout = CodeSpaceOutputStream("stdout")
sys.stderr = CodeSpaceOutputStream("stderr")

def _codespace_input(prompt=""):
    if prompt:
        sys.stdout.write(str(prompt))
        sys.stdout.flush()
    line = sys.stdin.readline()
    if not line:
        raise EOFError("EOF when reading a line")
    if line.endswith("\\n"):
        line = line[:-1]
    return line

builtins.input = _codespace_input
`
  pyodide.runPython(baseSetupScript)
  isEnvConfigured = true
}

let activeStreamChunkSender: ((stream: 'stdout' | 'stderr', chunk: string) => void) | null = null

function ensureFsDir(fs: PyodideInterface['FS'], filePath: string) {
  if (!fs.mkdir) return
  const parts = filePath.split('/')
  if (parts.length <= 1) return
  let current = ''
  for (let i = 0; i < parts.length - 1; i++) {
    current = current ? `${current}/${parts[i]}` : parts[i]
    try {
      fs.mkdir(current)
    } catch {
      // directory already exists
    }
  }
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

  // Background precompilation while the user is typing code
  if (data.type === 'precompile') {
    try {
      const pyodide = await getPyodide()
      const cacheKey = data.cacheKey
      const entryFilename = data.entryPoint || 'main.py'

      // Mount files if present
      if (Array.isArray(data.files)) {
        for (const file of data.files) {
          try {
            const cleanPath = file.path.replace(/^\.?\//, '')
            ensureFsDir(pyodide.FS, cleanPath)
            pyodide.FS.writeFile(cleanPath, file.content)
          } catch {
            // ignore fs path error
          }
        }
      }

      // Precompile Python code to bytecode in cache
      if (cacheKey && data.code) {
        pyodide.runPython(`
_bytecode_cache[${JSON.stringify(cacheKey)}] = compile(
    ${JSON.stringify(data.code)},
    ${JSON.stringify(entryFilename)},
    "exec"
)
`)
      }
      self.postMessage({ type: 'precompile-complete', cacheKey })
    } catch {
      // Precompilation syntax errors are ignored until explicit run
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

    activeStreamChunkSender = sendChunk

    try {
      const pyodide = await getPyodide()
      if (activeRunId !== runId) return

      configureBaseEnvironment(pyodide)

      // Mount virtual project files into Pyodide virtual filesystem
      const writtenPaths: string[] = []
      if (Array.isArray(data.files)) {
        for (const file of data.files) {
          try {
            const cleanPath = file.path.replace(/^\.?\//, '')
            ensureFsDir(pyodide.FS, cleanPath)
            pyodide.FS.writeFile(cleanPath, file.content)
            writtenPaths.push(cleanPath)
          } catch {
            // ignore fs path error
          }
        }
      }

      // Configure current stdin
      const stdinContent = JSON.stringify(data.stdin || '')
      pyodide.runPython(`
class _CurrentStdin(io.StringIO):
    def __init__(self, initial_value=""):
        super().__init__(initial_value)
    def readline(self, size=-1):
        line = super().readline(size)
        return line

sys.stdin = _CurrentStdin(${stdinContent})
`)

      const entryFilename = data.entryPoint || 'main.py'
      const cacheKey = data.cacheKey || `py-${entryFilename}-${Date.now()}`

      const compileStart = performance.now()
      // Compile or reuse precompiled bytecode object
      pyodide.runPython(`
if ${JSON.stringify(cacheKey)} not in _bytecode_cache:
    _bytecode_cache[${JSON.stringify(cacheKey)}] = compile(
        ${JSON.stringify(data.code)},
        ${JSON.stringify(entryFilename)},
        "exec"
    )
`)
      const compilationTimeMs = performance.now() - compileStart

      // Check if user code requires async evaluation (top-level await)
      const hasTopLevelAwait = /(?:^|\n)\s*await\s+/.test(data.code) || /(?:^|\n)\s*async\s+for\b/.test(data.code)

      const executionStart = performance.now()
      if (hasTopLevelAwait) {
        await pyodide.runPythonAsync(`
__file__ = ${JSON.stringify(entryFilename)}
__name__ = "__main__"
await eval(compile(${JSON.stringify(data.code)}, __file__, "eval")) if False else None
exec(_bytecode_cache[${JSON.stringify(cacheKey)}], globals())
`)
      } else {
        // High-speed synchronous execution path (0ms event loop latency)
        pyodide.runPython(`
__file__ = ${JSON.stringify(entryFilename)}
__name__ = "__main__"
exec(_bytecode_cache[${JSON.stringify(cacheKey)}], globals())
`)
      }
      const executionDurationMs = performance.now() - executionStart

      // Clean up written files from virtual filesystem
      for (const p of writtenPaths) {
        try {
          pyodide.FS.unlink(p)
        } catch {
          // ignore
        }
      }

      // Inspect peak memory
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
          compilationTimeMs,
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
          compilationTimeMs: 0,
          executionDurationMs,
          error: errorMessage,
        })
      }
    } finally {
      activeStreamChunkSender = null
    }
  }
})
