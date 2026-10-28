import type { ILanguageRuntime, RuntimeRunOptions } from '../types'
import type { Language, ProjectFile, ExecutionResult, RuntimeCapabilities } from '../../types'
import {
  getSharedWasmOjEngine,
  isWasmOjEngineReady,
  executeWasmOjProject,
  stopWasmOjExecution,
  prefetchToolchains,
  precompileWasmOjProject,
} from '../wasmOjShared'

export class CRuntime implements ILanguageRuntime {
  readonly language: Language = 'c'
  readonly name = 'C (Clang / WebAssembly)'

  async initialize(onProgress?: (progress: number, message: string) => void): Promise<void> {
    await getSharedWasmOjEngine(onProgress)
    prefetchToolchains('c').catch(() => {})
  }

  isReady(): boolean {
    return isWasmOjEngineReady()
  }

  async precompile(files: ProjectFile[], entryPoint?: string): Promise<void> {
    await precompileWasmOjProject('c', files, entryPoint)
  }

  async run(
    files: ProjectFile[],
    options: RuntimeRunOptions
  ): Promise<ExecutionResult> {
    return executeWasmOjProject('c', files, options)
  }

  async stop(): Promise<void> {
    await stopWasmOjExecution()
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
      inBrowserCompiler: true,
      clientSideExecution: true,
      notes: 'Real Clang 22.0.0 WebAssembly toolchain compiling C99/C11 code to WebAssembly / WASI in browser workers.',
      limitations: [
        'Architecture is 32-bit WebAssembly (wasm32-wasip1). Pointer sizes are 4 bytes.',
        'Direct POSIX socket networking and fork/exec are unavailable in sandboxed WASI.',
        'Standard C libraries (stdio, stdlib, math, string, ctype) are fully supported.',
      ],
    }
  }
}
