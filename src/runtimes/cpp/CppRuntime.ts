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

export class CppRuntime implements ILanguageRuntime {
  readonly language: Language = 'cpp'
  readonly name = 'C++20 (Clang++ / WebAssembly)'

  async initialize(onProgress?: (progress: number, message: string) => void): Promise<void> {
    await getSharedWasmOjEngine(onProgress)
    prefetchToolchains('cpp').catch(() => {})
  }

  isReady(): boolean {
    return isWasmOjEngineReady()
  }

  async precompile(files: ProjectFile[], entryPoint?: string): Promise<void> {
    await precompileWasmOjProject('cpp', files, entryPoint)
  }

  async run(
    files: ProjectFile[],
    options: RuntimeRunOptions
  ): Promise<ExecutionResult> {
    return executeWasmOjProject('cpp', files, options)
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
      notes: 'Real Clang++ 22.0.0 WebAssembly compiler with LLVM libc++ standard library (C++20).',
      limitations: [
        'Multi-threading (std::thread) is limited in single-process WASI.',
        'Platform-specific native system calls and GUI libraries are not supported in WebAssembly.',
        'Modern C++ standard libraries (vector, string, iostream, algorithm, map, etc.) are fully supported.',
      ],
    }
  }
}
