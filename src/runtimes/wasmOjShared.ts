import { BrowserCompiler, BrowserRunner, prefetchBrowserToolchain } from '@wasm-oj/browser'
import { browserSource as clangSource } from '@wasm-oj/toolchain-clang'
import { browserSource as javaSource } from '@wasm-oj/toolchain-java'
import { runTeaVmWebAssembly } from './java/JavaWasiRunner'
import type { Language, ProjectFile, ExecutionResult, Diagnostic } from '../types'
import type { RuntimeRunOptions } from './types'

let sharedCompiler: BrowserCompiler | null = null
let sharedRunner: BrowserRunner | null = null
let isEngineInitializing = false
let engineInitPromise: Promise<void> | null = null

interface CachedArtifact {
  artifact: unknown
  diagnostics: Diagnostic[]
  compilationTimeMs: number
  timestamp: number
}

// High-speed In-Memory Artifact Cache
const buildArtifactCache = new Map<string, CachedArtifact>()
const inFlightBuildPromises = new Map<
  string,
  Promise<{ buildResult: { success: boolean; artifact?: unknown; diagnostics?: unknown[] }; compilationTimeMs: number; diagnostics: Diagnostic[] }>
>()

// Global serialization queues for single-threaded WASM-OJ workers (BrowserCompiler and BrowserRunner accept only 1 active operation)
let compilerQueue: Promise<unknown> = Promise.resolve()
let runnerQueue: Promise<unknown> = Promise.resolve()
let activeCompilerBuildCount = 0
let latestPrecompileKey: string | null = null

export function runWithCompilerLock<T>(task: () => Promise<T>): Promise<T> {
  const previous = compilerQueue
  let release: () => void
  const current = new Promise<void>((resolve) => {
    release = resolve
  })
  compilerQueue = current

  return (async () => {
    try {
      await previous.catch(() => {})
      return await task()
    } finally {
      release!()
    }
  })()
}

export function runWithRunnerLock<T>(task: () => Promise<T>): Promise<T> {
  const previous = runnerQueue
  let release: () => void
  const current = new Promise<void>((resolve) => {
    release = resolve
  })
  runnerQueue = current

  return (async () => {
    try {
      await previous.catch(() => {})
      return await task()
    } finally {
      release!()
    }
  })()
}

function getBaseUrl(): string {
  if (typeof window !== 'undefined' && window.location?.origin) {
    return `${window.location.origin}/toolchains/`
  }
  return 'https://unpkg.com/'
}

export function computeProjectCacheKey(
  language: Language,
  entryPoint: string,
  files: Array<{ path: string; content: string }>
): string {
  const sorted = [...files].sort((a, b) => a.path.localeCompare(b.path))
  let hash1 = 5381
  let hash2 = 52711
  const payload = `${language}:${entryPoint}:` + sorted.map((f) => `${f.path}=>${f.content}`).join('\n')
  for (let i = 0; i < payload.length; i++) {
    const char = payload.charCodeAt(i)
    hash1 = ((hash1 << 5) + hash1) ^ char
    hash2 = ((hash2 << 5) + hash2) ^ char
  }
  const hex1 = (hash1 >>> 0).toString(16)
  const hex2 = (hash2 >>> 0).toString(16)
  return `art-${language}-${hex1}-${hex2}`
}

export async function getSharedWasmOjEngine(
  onProgress?: (progress: number, message: string) => void
): Promise<{ compiler: BrowserCompiler; runner: BrowserRunner }> {
  if (sharedCompiler && sharedRunner) {
    return { compiler: sharedCompiler, runner: sharedRunner }
  }

  if (engineInitPromise) {
    await engineInitPromise
    return { compiler: sharedCompiler!, runner: sharedRunner! }
  }

  engineInitPromise = (async () => {
    isEngineInitializing = true
    onProgress?.(0.1, 'Configuring browser WebAssembly toolchain engine...')

    const baseUrl = getBaseUrl()

    const clang = clangSource(baseUrl)
    const java = javaSource(baseUrl)
    const toolchains = [clang, java]

    onProgress?.(0.3, 'Instantiating sandboxed Compiler Worker...')
    sharedCompiler = new BrowserCompiler({ toolchains })

    onProgress?.(0.6, 'Instantiating WASI Runner Worker...')
    sharedRunner = new BrowserRunner({ toolchains })

    onProgress?.(0.9, 'Connecting WebAssembly workers...')
    await Promise.all([sharedCompiler.ready(), sharedRunner.ready()])

    onProgress?.(1.0, 'Toolchain workers active.')
    isEngineInitializing = false
  })()

  await engineInitPromise
  return { compiler: sharedCompiler!, runner: sharedRunner! }
}

export function isWasmOjEngineReady(): boolean {
  return sharedCompiler !== null && sharedRunner !== null && !isEngineInitializing
}

const prefetchedToolchains = new Set<Language>()

export async function prefetchToolchains(
  language: Language,
  onProgress?: (loadedBytes: number, totalBytes: number) => void
): Promise<void> {
  try {
    const baseUrl = getBaseUrl()
    const clang = clangSource(baseUrl)
    const java = javaSource(baseUrl)
    const toolchains = [clang, java]

    if (language === 'c' || language === 'cpp') {
      await prefetchBrowserToolchain(toolchains, {
        language: language as 'c' | 'cpp',
        target: 'wasip1',
        optimization: 'debug',
        libcxxPrecompiledHeader: language === 'cpp',
        onProgress: onProgress ? ({ loadedBytes, totalBytes }) => onProgress(loadedBytes, totalBytes) : undefined,
      })
      prefetchedToolchains.add('c')
      if (language === 'cpp') prefetchedToolchains.add('cpp')
    } else if (language === 'java') {
      await prefetchBrowserToolchain(toolchains, {
        language: 'java',
        target: 'wasip1',
        optimization: 'debug',
        onProgress: onProgress ? ({ loadedBytes, totalBytes }) => onProgress(loadedBytes, totalBytes) : undefined,
      })
      prefetchedToolchains.add('java')
    }
  } catch {
    // Ignore prefetch background errors
  }
}

export async function precompileWasmOjProject(
  language: Language,
  files: ProjectFile[],
  entryPoint?: string
): Promise<void> {
  try {
    const entryFile = files.find((f) => f.path === entryPoint) || files[0]
    if (!entryFile) return
    const cleanEntry = entryFile.path.replace(/^\.?\//, '')
    const projectFiles = files.map((f) => ({
      path: f.path.replace(/^\.?\//, ''),
      language,
      content: f.content,
    }))

    const cacheKey = computeProjectCacheKey(language, cleanEntry, projectFiles)
    latestPrecompileKey = cacheKey

    // Fast return if already cached or an identical build is in flight
    if (buildArtifactCache.has(cacheKey) || inFlightBuildPromises.has(cacheKey)) {
      return
    }

    // If compiler is already actively building another project, avoid queuing a stale background precompile
    if (activeCompilerBuildCount > 0) {
      return
    }

    const { compiler } = await getSharedWasmOjEngine()
    if (!compiler) return

    const wasmProject = {
      id: `proj-${language}`,
      name: 'codespace_run',
      files: projectFiles,
      activeFile: cleanEntry,
      updatedAt: 1000,
      config: {
        language,
        target: 'wasip1' as const,
        optimization: 'debug' as const,
        entry: cleanEntry,
        args: [] as string[],
        stdin: '',
        env: {
          USER: 'codespace',
          LANG: 'C.UTF-8',
        },
        determinism: {
          randomSeed: 1337,
          realtimeEpochMs: 1000,
          clockStepNs: 1000,
        },
        resources: {
          instructionBudget: 5e9,
          logicalTimeLimitMs: 60000,
          memoryLimitBytes: 256 * 1024 * 1024,
          outputLimitBytes: 4 * 1024 * 1024,
          filesystemWriteLimitBytes: 32 * 1024 * 1024,
          filesystemEntryLimit: 1024,
          wallTimeLimitMs: 60000,
        },
      },
    }

    const buildPromise = runWithCompilerLock(async () => {
      // Discard if user made newer edits or if already completed while waiting in queue
      if (latestPrecompileKey !== cacheKey) {
        return { buildResult: { success: false }, compilationTimeMs: 0, diagnostics: [] }
      }
      if (buildArtifactCache.has(cacheKey)) {
        const c = buildArtifactCache.get(cacheKey)!
        return { buildResult: { success: true, artifact: c.artifact }, compilationTimeMs: c.compilationTimeMs, diagnostics: c.diagnostics }
      }

      activeCompilerBuildCount++
      try {
        const compileStart = performance.now()
        const result = await compiler.build(wasmProject, cacheKey)
        const compilationTimeMs = performance.now() - compileStart
        const diagnostics: Diagnostic[] = (result.diagnostics || []).map((d) => ({
          severity: d.severity,
          message: d.message,
          file: d.file,
          line: d.line,
          column: d.column,
          source: d.source,
        }))

        if (result.success && result.artifact) {
          if (buildArtifactCache.size >= 25) {
            const oldestKey = buildArtifactCache.keys().next().value
            if (oldestKey) buildArtifactCache.delete(oldestKey)
          }
          buildArtifactCache.set(cacheKey, {
            artifact: result.artifact,
            diagnostics,
            compilationTimeMs,
            timestamp: Date.now(),
          })
        }
        return { buildResult: result, compilationTimeMs, diagnostics }
      } finally {
        activeCompilerBuildCount = Math.max(0, activeCompilerBuildCount - 1)
      }
    })

    inFlightBuildPromises.set(cacheKey, buildPromise)
    try {
      await buildPromise
    } finally {
      inFlightBuildPromises.delete(cacheKey)
    }
  } catch {
    // Ignore background precompilation errors
  }
}

export async function stopWasmOjExecution(): Promise<void> {
  if (sharedCompiler) {
    try {
      sharedCompiler.cancel()
    } catch {
      // ignore
    }
  }
  if (sharedRunner) {
    try {
      sharedRunner.cancel()
    } catch {
      // ignore
    }
  }
}

export async function executeWasmOjProject(
  language: Language,
  files: ProjectFile[],
  options: RuntimeRunOptions
): Promise<ExecutionResult> {
  const { runId, entryPoint, stdin = '', timeoutMs = 25000, onStream, onProgress } = options
  const formattedStdin = stdin && !stdin.endsWith('\n') ? stdin + '\n' : stdin
  const startTime = performance.now()

  const { compiler, runner } = await getSharedWasmOjEngine((p, msg) => {
    onProgress?.('initializing', p, msg)
  })

  // Ensure compiler toolchains are prefetched and cached in persistent CacheStorage
  // to prevent hitting the strict 60,000ms compiler request boundary on cold network downloads
  if (!prefetchedToolchains.has(language) && (language === 'c' || language === 'cpp' || language === 'java')) {
    onProgress?.('initializing', 0.2, `Preparing ${language.toUpperCase()} WebAssembly compiler toolchain...`)
    await prefetchToolchains(language, (loaded, total) => {
      const pct = total > 0 ? loaded / total : 0.5
      const loadedMb = (loaded / (1024 * 1024)).toFixed(1)
      const totalMb = (total / (1024 * 1024)).toFixed(1)
      onProgress?.(
        'initializing',
        0.2 + pct * 0.2,
        `Downloading ${language.toUpperCase()} toolchain (${loadedMb}MB / ${totalMb}MB)...`
      )
    })
  }

  // Format entry file and secondary files
  const entryFile = files.find((f) => f.path === entryPoint) || files[0]
  if (!entryFile) {
    throw new Error(`Entry file '${entryPoint}' not found in project.`)
  }

  const projectFiles = files.map((f) => ({
    path: f.path.replace(/^\.?\//, ''),
    language,
    content: f.content,
  }))

  const cleanEntry = entryFile.path.replace(/^\.?\//, '')
  const wallTimeLimit = Math.min(timeoutMs, 60000)

  const wasmProject = {
    id: `proj-${language}`,
    name: 'codespace_run',
    files: projectFiles,
    activeFile: cleanEntry,
    updatedAt: 1000,
    config: {
      language,
      target: 'wasip1' as const,
      optimization: 'debug' as const,
      entry: cleanEntry,
      args: [] as string[],
      stdin: formattedStdin,
      env: {
        USER: 'codespace',
        LANG: 'C.UTF-8',
      },
      determinism: {
        randomSeed: 1337,
        realtimeEpochMs: 1000,
        clockStepNs: 1000,
      },
      resources: {
        instructionBudget: 5e9,
        logicalTimeLimitMs: wallTimeLimit,
        memoryLimitBytes: 256 * 1024 * 1024,
        outputLimitBytes: 4 * 1024 * 1024,
        filesystemWriteLimitBytes: 32 * 1024 * 1024,
        filesystemEntryLimit: 1024,
        wallTimeLimitMs: wallTimeLimit,
      },
    },
  }

  // Fast In-Memory Cache Lookup
  const cacheKey = computeProjectCacheKey(language, cleanEntry, projectFiles)
  const cached = buildArtifactCache.get(cacheKey)

  let buildResult: { success: boolean; artifact?: unknown; diagnostics?: unknown[] }
  let compilationTimeMs = 0
  let diagnostics: Diagnostic[] = []

  if (cached) {
    // ⚡ INSTANT CACHE HIT: 0ms compilation!
    buildResult = { success: true, artifact: cached.artifact }
    diagnostics = cached.diagnostics
    compilationTimeMs = 0
  } else {
    // Check if an identical build is already running
    let inFlight = inFlightBuildPromises.get(cacheKey)

    if (!inFlight) {
      onProgress?.('compiling', 0.4, `Compiling ${cleanEntry} client-side via WebAssembly compiler...`)

      inFlight = runWithCompilerLock(async () => {
        // Re-check cache once inside the lock in case precompile finished just now!
        const cachedInside = buildArtifactCache.get(cacheKey)
        if (cachedInside) {
          return {
            buildResult: { success: true, artifact: cachedInside.artifact },
            compilationTimeMs: cachedInside.compilationTimeMs,
            diagnostics: cachedInside.diagnostics,
          }
        }

        activeCompilerBuildCount++
        const compileStart = performance.now()
        const unsubscribeProgress = compiler.onProgress((prog) => {
          const fraction = prog.progress || 0.5
          onProgress?.('compiling', 0.4 + fraction * 0.4, prog.label || 'Compiling...')
        })

        try {
          const res = await compiler.build(wasmProject, cacheKey)
          const timeMs = performance.now() - compileStart
          const diags: Diagnostic[] = (res.diagnostics || []).map((d) => ({
            severity: d.severity,
            message: d.message,
            file: d.file,
            line: d.line,
            column: d.column,
            source: d.source,
          }))

          if (res.success && res.artifact) {
            if (buildArtifactCache.size >= 25) {
              const oldestKey = buildArtifactCache.keys().next().value
              if (oldestKey) buildArtifactCache.delete(oldestKey)
            }
            buildArtifactCache.set(cacheKey, {
              artifact: res.artifact,
              diagnostics: diags,
              compilationTimeMs: timeMs,
              timestamp: Date.now(),
            })
          }
          return { buildResult: res, compilationTimeMs: timeMs, diagnostics: diags }
        } finally {
          unsubscribeProgress()
          activeCompilerBuildCount = Math.max(0, activeCompilerBuildCount - 1)
        }
      })

      inFlightBuildPromises.set(cacheKey, inFlight)
    }

    try {
      const buildOutcome = await inFlight
      buildResult = buildOutcome.buildResult
      compilationTimeMs = buildOutcome.compilationTimeMs
      diagnostics = buildOutcome.diagnostics
    } finally {
      inFlightBuildPromises.delete(cacheKey)
    }
  }

  if (!buildResult.success || !buildResult.artifact) {
    const errorDetails = diagnostics
      .map((d) => `${d.file || cleanEntry}:${d.line || 0}:${d.column || 0}: ${d.severity}: ${d.message}`)
      .join('\n')

    onStream?.('stderr', errorDetails + '\n')

    return {
      stdout: '',
      stderr: errorDetails || 'Compilation failed with unspecified errors.',
      exitCode: 1,
      diagnostics,
      metrics: {
        durationMs: performance.now() - startTime,
        compilationTimeMs,
      },
      termination: 'compilation-error',
    }
  }

  onProgress?.('running', 0.9, 'Running WebAssembly guest module in WASI sandbox...')
  const execStart = performance.now()

  let stdoutAccum = ''
  let stderrAccum = ''

  const unsubscribeStream = runner.onStream((stream, chunk) => {
    if (stream === 'stdout') {
      stdoutAccum += chunk
    } else {
      stderrAccum += chunk
    }
    onStream?.(stream, chunk)
  })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let runResult: any
  try {
    const rawArtifact = buildResult.artifact as any
    const javaBytes = rawArtifact?.bytes || rawArtifact?.wasm
    if (language === 'java' && javaBytes instanceof Uint8Array) {
      // Execute Java WebAssembly directly in browser runner with full teavmMath and WASI support,
      // avoiding WASM-OJ Wasmer rejection: "unsupported runtime import namespace 'teavmMath'"
      const javaRes = await runTeaVmWebAssembly(javaBytes, {
        stdin: formattedStdin,
        timeoutMs: wallTimeLimit,
        onStream: (stream, chunk) => {
          if (stream === 'stdout') {
            stdoutAccum += chunk
          } else {
            stderrAccum += chunk
          }
          onStream?.(stream, chunk)
        },
      })
      runResult = {
        stdout: javaRes.stdout,
        stderr: javaRes.stderr,
        code: javaRes.code,
        metrics: {
          memoryBytes: javaRes.memoryBytes,
          cost: null,
        },
        termination: javaRes.termination,
      }
    } else {
      runResult = await runWithRunnerLock(async () => {
        return runner.run(buildResult.artifact as Parameters<typeof runner.run>[0], {
          args: [],
          stdin: formattedStdin,
          env: wasmProject.config.env,
          determinism: wasmProject.config.determinism,
          resources: wasmProject.config.resources,
        })
      })
    }
  } finally {
    unsubscribeStream()
  }

  const executionTimeMs = performance.now() - execStart
  const totalDuration = performance.now() - startTime

  return {
    stdout: runResult.stdout || stdoutAccum,
    stderr: runResult.stderr || stderrAccum,
    exitCode: runResult.code,
    diagnostics,
    metrics: {
      durationMs: totalDuration,
      compilationTimeMs,
      executionTimeMs,
      memoryBytes: runResult.metrics?.memoryBytes ?? null,
      cost: runResult.metrics?.cost ?? null,
      terminationReason: runResult.termination,
    },
    termination: runResult.termination,
  }
}
