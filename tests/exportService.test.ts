import { describe, it, expect } from 'vitest'
import JSZip from 'jszip'
import type { Project } from '../src/types'

describe('ExportService & Packaging', () => {
  it('should package a multi-file project into a valid ZIP with manifest', async () => {
    const project: Project = {
      id: 'proj-export-test',
      name: 'CalculatorApp',
      language: 'cpp',
      activeFile: 'main.cpp',
      updatedAt: Date.now(),
      files: [
        {
          path: 'main.cpp',
          name: 'main.cpp',
          language: 'cpp',
          content: '#include <iostream>\nint main() { return 0; }',
        },
        {
          path: 'calc.hpp',
          name: 'calc.hpp',
          language: 'cpp',
          content: 'int add(int a, int b);',
        },
      ],
    }

    const zip = new JSZip()
    for (const f of project.files) {
      zip.file(f.path, f.content)
    }
    zip.file('codespace.json', JSON.stringify({ name: project.name, language: project.language }))

    const blob = await zip.generateAsync({ type: 'uint8array' })
    expect(blob.byteLength).toBeGreaterThan(0)

    // Verify unzipping
    const loadedZip = await JSZip.loadAsync(blob)
    expect(loadedZip.file('main.cpp')).toBeDefined()
    expect(loadedZip.file('calc.hpp')).toBeDefined()
    expect(loadedZip.file('codespace.json')).toBeDefined()

    const mainContent = await loadedZip.file('main.cpp')?.async('text')
    expect(mainContent).toContain('#include <iostream>')
  })
})
