import { describe, it, expect } from 'vitest'
import { runtimeManager } from '../src/runtimes/RuntimeManager'
import { STARTER_PROJECTS, MULTI_FILE_EXAMPLES } from '../src/examples/starterTemplates'
import { runWithCompilerLock, runWithRunnerLock } from '../src/runtimes/wasmOjShared'
import type { Language } from '../src/types'

describe('RuntimeManager & Language Templates', () => {
  const languages: Language[] = ['c', 'cpp', 'java', 'python', 'javascript']

  it('should instantiate and return valid runtimes for all 5 languages', () => {
    for (const lang of languages) {
      const runtime = runtimeManager.getRuntime(lang)
      expect(runtime).toBeDefined()
      expect(runtime.language).toBe(lang)
      expect(runtime.name).toBeDefined()

      const caps = runtime.getCapabilities()
      expect(caps.supportsMultiFile).toBe(true)
      expect(caps.clientSideExecution).toBe(true)
      expect(caps.limitations.length).toBeGreaterThan(0)
    }
  })

  it('should verify starter templates have valid entry files and contents', () => {
    for (const lang of languages) {
      const starter = STARTER_PROJECTS[lang]
      expect(starter).toBeDefined()
      expect(starter.files.length).toBeGreaterThan(0)

      const entry = starter.files.find((f) => f.path === starter.activeFile)
      expect(entry).toBeDefined()
      expect(entry?.content.trim().length).toBeGreaterThan(10)
    }
  })

  it('should verify multi-file examples have at least 2 files and include valid dependencies', () => {
    for (const lang of languages) {
      const example = MULTI_FILE_EXAMPLES[lang]
      expect(example).toBeDefined()
      expect(example.files.length).toBeGreaterThanOrEqual(2)

      const entry = example.files.find((f) => f.path === example.defaultEntry)
      expect(entry).toBeDefined()
    }
  })

  it('strictly serializes concurrent compiler and runner operations to prevent BrowserCompiler conflict', async () => {
    const executed: number[] = []
    let activeOperations = 0
    let maxConcurrent = 0

    const makeTask = (id: number, delayMs: number) => async () => {
      activeOperations++
      if (activeOperations > maxConcurrent) {
        maxConcurrent = activeOperations
      }
      await new Promise((resolve) => setTimeout(resolve, delayMs))
      executed.push(id)
      activeOperations--
      return id
    }

    // Launch 3 concurrent calls
    const p1 = runWithCompilerLock(makeTask(1, 20))
    const p2 = runWithCompilerLock(makeTask(2, 10))
    const p3 = runWithCompilerLock(makeTask(3, 5))

    const results = await Promise.all([p1, p2, p3])
    expect(results).toEqual([1, 2, 3])
    expect(executed).toEqual([1, 2, 3])
    expect(maxConcurrent).toBe(1) // Never more than 1 operation active at a time!

    // Also test runner serialization
    const runnerRes = await runWithRunnerLock(async () => 'ok')
    expect(runnerRes).toBe('ok')
  })
})
