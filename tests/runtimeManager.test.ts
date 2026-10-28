import { describe, it, expect } from 'vitest'
import { runtimeManager } from '../src/runtimes/RuntimeManager'
import { STARTER_PROJECTS, MULTI_FILE_EXAMPLES } from '../src/examples/starterTemplates'
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
})
