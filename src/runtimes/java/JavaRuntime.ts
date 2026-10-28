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

export class JavaRuntime implements ILanguageRuntime {
  readonly language: Language = 'java'
  readonly name = 'Java (TeaVM / OpenJDK WebAssembly)'

  async initialize(onProgress?: (progress: number, message: string) => void): Promise<void> {
    await getSharedWasmOjEngine(onProgress)
    prefetchToolchains('java').catch(() => {})
  }

  isReady(): boolean {
    return isWasmOjEngineReady()
  }

  async precompile(files: ProjectFile[], entryPoint?: string): Promise<void> {
    await precompileWasmOjProject('java', files, entryPoint)
  }

  async run(
    files: ProjectFile[],
    options: RuntimeRunOptions
  ): Promise<ExecutionResult> {
    return executeWasmOjProject('java', files, options)
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
      notes: 'Browser-based Java compiler producing WebAssembly GC / WASI binaries using OpenJDK class libraries.',
      limitations: [
        'Main entry class must be named "Main" containing `public static void main(String[] args)`.',
        'Reflection and JNI (Java Native Interface) are restricted in WebAssembly.',
        'AWT/Swing desktop GUI components are not supported in serverless CLI execution.',
        'Core Java APIs (java.lang, java.util, collections, math, regex, formatting) are fully supported.',
      ],
    }
  }
}
