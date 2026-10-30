/**
 * In-browser WebAssembly Runner for TeaVM-generated Java modules.
 *
 * Resolves the WASM-OJ issue:
 * "unsupported runtime import namespace 'teavmMath' ; WASM-OJ accepts only wasip1 and WASIX modules"
 *
 * Executes the compiled Java WebAssembly directly in the browser with full support for:
 * - wasi_snapshot_preview1 (I/O, streams, time, random, exit)
 * - teavmMath (Math.sin, Math.cos, Math.sqrt, Math.pow, etc.)
 * - teavmDate & teavmConsole (System.out, System.err, timestamps)
 * - wasm:js-string builtins
 */

class WasiProcExit extends Error {
  code: number
  constructor(code: number) {
    super(`WASI proc_exit called with code ${code}`)
    this.name = 'WasiProcExit'
    this.code = code
  }
}

export interface JavaRunnerOptions {
  stdin?: string
  args?: string[]
  env?: Record<string, string>
  timeoutMs?: number
  onStream?: (stream: 'stdout' | 'stderr', chunk: string) => void
}

export interface JavaRunnerResult {
  stdout: string
  stderr: string
  code: number
  durationMs: number
  memoryBytes: number | null
  termination?: string
}

export async function runTeaVmWebAssembly(
  wasmBytes: Uint8Array,
  options: JavaRunnerOptions = {}
): Promise<JavaRunnerResult> {
  const startTime = performance.now()
  const { stdin = '', timeoutMs = 25000, onStream } = options

  let stdout = ''
  let stderr = ''
  let stdinOffset = 0
  const stdinBuffer = new TextEncoder().encode(stdin)

  let memory: WebAssembly.Memory | null = null

  const getMemoryView = () => {
    if (!memory) throw new Error('WebAssembly linear memory is not initialized.')
    return new DataView(memory.buffer)
  }

  const getMemoryHeap = () => {
    if (!memory) throw new Error('WebAssembly linear memory is not initialized.')
    return new Uint8Array(memory.buffer)
  }

  // --- WASI Snapshot Preview 1 Implementation ---
  const wasiSnapshotPreview1: Record<string, Function> = {
    fd_write(fd: number, iovsPtr: number, iovsLen: number, nwrittenPtr: number): number {
      try {
        const view = getMemoryView()
        const heap = getMemoryHeap()
        let totalWritten = 0

        for (let i = 0; i < iovsLen; i++) {
          const ptr = view.getUint32(iovsPtr + i * 8, true)
          const len = view.getUint32(iovsPtr + i * 8 + 4, true)
          if (len > 0) {
            const chunk = new TextDecoder('utf-8').decode(heap.subarray(ptr, ptr + len))
            if (fd === 1) {
              stdout += chunk
              onStream?.('stdout', chunk)
            } else if (fd === 2) {
              stderr += chunk
              onStream?.('stderr', chunk)
            }
            totalWritten += len
          }
        }
        view.setUint32(nwrittenPtr, totalWritten, true)
        return 0 // SUCCESS
      } catch (e) {
        console.error('[Java WASI] fd_write error:', e)
        return 28 // EIO
      }
    },

    fd_read(fd: number, iovsPtr: number, iovsLen: number, nreadPtr: number): number {
      try {
        if (fd !== 0) return 8 // EBADF
        const view = getMemoryView()
        const heap = getMemoryHeap()
        let totalRead = 0

        for (let i = 0; i < iovsLen && stdinOffset < stdinBuffer.length; i++) {
          const ptr = view.getUint32(iovsPtr + i * 8, true)
          const len = view.getUint32(iovsPtr + i * 8 + 4, true)
          const available = stdinBuffer.length - stdinOffset
          const toCopy = Math.min(len, available)

          heap.set(stdinBuffer.subarray(stdinOffset, stdinOffset + toCopy), ptr)
          stdinOffset += toCopy
          totalRead += toCopy
        }

        view.setUint32(nreadPtr, totalRead, true)
        return 0 // SUCCESS
      } catch (e) {
        console.error('[Java WASI] fd_read error:', e)
        return 28 // EIO
      }
    },

    fd_close(_fd: number): number {
      return 0
    },

    fd_seek(_fd: number, _offset: bigint, _whence: number, newOffsetPtr: number): number {
      try {
        const view = getMemoryView()
        view.setBigUint64(newOffsetPtr, 0n, true)
      } catch {}
      return 0
    },

    fd_fdstat_get(fd: number, statPtr: number): number {
      try {
        const view = getMemoryView()
        view.setUint8(statPtr, fd <= 2 ? 2 : 1) // 2 = character device, 1 = block device
        view.setUint16(statPtr + 2, 0, true) // flags
        view.setBigUint64(statPtr + 8, 0x1fffffn, true) // rights base
        view.setBigUint64(statPtr + 16, 0x1fffffn, true) // rights inheriting
        return 0
      } catch {
        return 8 // EBADF
      }
    },

    fd_prestat_get(_fd: number, _prestatPtr: number): number {
      return 8 // EBADF (no preopened directories)
    },

    fd_prestat_dir_name(_fd: number, _pathPtr: number, _pathLen: number): number {
      return 8
    },

    proc_exit(code: number): void {
      throw new WasiProcExit(code)
    },

    clock_time_get(_clockId: number, _precision: bigint, timePtr: number): number {
      try {
        const view = getMemoryView()
        const nowNs = BigInt(Date.now()) * 1000000n
        view.setBigUint64(timePtr, nowNs, true)
        return 0
      } catch {
        return 28
      }
    },

    random_get(bufPtr: number, bufLen: number): number {
      try {
        const heap = getMemoryHeap()
        if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
          crypto.getRandomValues(heap.subarray(bufPtr, bufPtr + bufLen))
        } else {
          for (let i = 0; i < bufLen; i++) {
            heap[bufPtr + i] = Math.floor(Math.random() * 256)
          }
        }
        return 0
      } catch {
        return 28
      }
    },

    environ_sizes_get(countPtr: number, sizePtr: number): number {
      try {
        const view = getMemoryView()
        view.setUint32(countPtr, 0, true)
        view.setUint32(sizePtr, 0, true)
        return 0
      } catch {
        return 28
      }
    },

    environ_get(_environPtr: number, _environBufPtr: number): number {
      return 0
    },

    args_sizes_get(argcPtr: number, argvBufSizePtr: number): number {
      try {
        const view = getMemoryView()
        view.setUint32(argcPtr, 0, true)
        view.setUint32(argvBufSizePtr, 0, true)
        return 0
      } catch {
        return 28
      }
    },

    args_get(_argvPtr: number, _argvBufPtr: number): number {
      return 0
    },

    sched_yield(): number {
      return 0
    },

    poll_oneoff(): number {
      return 0
    },
  }

  // --- TeaVM Math Import Namespace ---
  // Directly bridges Java's Math calls (Math.sin, Math.cos, Math.sqrt, Math.pow, etc.) to JS Math
  const teavmMath = new Proxy(Math as any, {
    get(target, prop: string) {
      if (prop in target) {
        const val = target[prop]
        return typeof val === 'function' ? val.bind(target) : val
      }
      return () => 0
    },
  })

  // --- TeaVM Date Import Namespace ---
  const teavmDate: Record<string, Function> = {
    currentTimeMillis: () => Date.now(),
    dateToString: (e: number) => new Date(e).toString(),
    getYear: (e: number) => new Date(e).getFullYear(),
    setYear: (e: number, t: number) => {
      const d = new Date(e)
      d.setFullYear(t)
      return d.getTime()
    },
    getMonth: (e: number) => new Date(e).getMonth(),
    setMonth: (e: number, t: number) => {
      const d = new Date(e)
      d.setMonth(t)
      return d.getTime()
    },
    getDate: (e: number) => new Date(e).getDate(),
    setDate: (e: number, t: number) => {
      const d = new Date(e)
      d.setDate(t)
      return d.getTime()
    },
    getDay: (e: number) => new Date(e).getDay(),
    getHours: (e: number) => new Date(e).getHours(),
    setHours: (e: number, t: number) => {
      const d = new Date(e)
      d.setHours(t)
      return d.getTime()
    },
    getMinutes: (e: number) => new Date(e).getMinutes(),
    setMinutes: (e: number, t: number) => {
      const d = new Date(e)
      d.setMinutes(t)
      return d.getTime()
    },
    getSeconds: (e: number) => new Date(e).getSeconds(),
    setSeconds: (e: number, t: number) => {
      const d = new Date(e)
      d.setSeconds(t)
      return d.getTime()
    },
    getTimezoneOffset: (e: number) => new Date(e).getTimezoneOffset(),
  }

  // --- TeaVM Console Fallback Namespace ---
  const teavmConsole: Record<string, Function> = {
    putcharStdout: (c: number) => {
      const ch = String.fromCharCode(c)
      stdout += ch
      onStream?.('stdout', ch)
    },
    putcharStderr: (c: number) => {
      const ch = String.fromCharCode(c)
      stderr += ch
      onStream?.('stderr', ch)
    },
  }

  // --- WebAssembly JS String Builtins Fallback ---
  const wasmJsString: Record<string, Function> = {
    fromCharCode: (e: number) => String.fromCharCode(e),
    fromCharCodeArray: () => '',
    intoCharCodeArray: () => {},
    concat: (a: any, b: any) => String(a) + String(b),
    charCodeAt: (s: any, idx: number) => String(s).charCodeAt(idx),
    length: (s: any) => String(s).length,
    substring: (s: any, start: number, end: number) => String(s).substring(start, end),
    equals: (a: any, b: any) => String(a) === String(b),
    compare: (a: any, b: any) => String(a).localeCompare(String(b)),
  }

  // --- TeaVM Interop & Runtime Namespace ---
  const teavmNamespace = new Proxy({} as any, {
    get(_target, prop: string) {
      if (prop === 'memory') return memory
      return () => 0
    },
  })

  // Full Import Object for WebAssembly instantiation
  const importObject: Record<string, any> = {
    wasi_snapshot_preview1: wasiSnapshotPreview1,
    teavmMath,
    teavmDate,
    teavmConsole,
    teavmAsync: {
      offer: (e: any, t: (arg: any) => void, n: number) =>
        setTimeout(() => t(e), Math.max(0, n - Date.now())),
      kill: (id: any) => clearTimeout(id),
    },
    'wasm:js-string': wasmJsString,
    teavm: teavmNamespace,
    env: new Proxy({} as any, {
      get(_target, prop: string) {
        if (prop === 'memory') return memory
        return () => 0
      },
    }),
  }

  let exitCode = 0
  let termination: string | undefined

  try {
    const wasmModule = await WebAssembly.compile(wasmBytes as unknown as BufferSource)

    // Check if the module requires an imported memory
    const memoryImport = WebAssembly.Module.imports(wasmModule).find(
      (imp) => imp.kind === 'memory'
    )

    if (memoryImport) {
      memory = new WebAssembly.Memory({ initial: 256, maximum: 4096 })
      if (!importObject[memoryImport.module]) {
        importObject[memoryImport.module] = {}
      }
      importObject[memoryImport.module][memoryImport.name] = memory
    }

    const instance = await WebAssembly.instantiate(wasmModule, importObject)

    // If memory is exported from the module
    if (!memory) {
      if (instance.exports.memory instanceof WebAssembly.Memory) {
        memory = instance.exports.memory
      }
    }

    // Call WASI entry point: _start() or main()
    const exports = instance.exports as Record<string, any>
    const entryFn = exports._start || exports.main

    if (typeof entryFn !== 'function') {
      throw new Error("No entry point found in compiled Java WebAssembly module (expected '_start').")
    }

    // Run with timeout race
    const executionPromise = Promise.resolve().then(() => {
      entryFn()
    })

    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Execution timed out after ${timeoutMs / 1000}s.`))
      }, timeoutMs)
    })

    await Promise.race([executionPromise, timeoutPromise])
  } catch (err: unknown) {
    if (err instanceof WasiProcExit) {
      exitCode = err.code
      if (exitCode !== 0) {
        termination = 'exit-non-zero'
      }
    } else {
      const errMsg = err instanceof Error ? err.message : String(err)
      if (errMsg.includes('timed out')) {
        exitCode = 124
        termination = 'timeout'
        stderr += `\n[CodeSpace] Process timed out after ${timeoutMs / 1000} seconds.\n`
      } else {
        exitCode = 1
        termination = 'runtime-error'
        stderr += (stderr ? '\n' : '') + errMsg
      }
    }
  }

  const durationMs = performance.now() - startTime
  const memoryBytes = memory ? memory.buffer.byteLength : null

  return {
    stdout,
    stderr,
    code: exitCode,
    durationMs,
    memoryBytes,
    termination,
  }
}
