import { describe, it, expect, beforeEach } from 'vitest'
import '../tests/setup'
import { storageService } from '../src/services/storageService'
import type { Project } from '../src/types'

describe('StorageService', () => {
  it('should seed default starter projects on initial load', async () => {
    const projects = await storageService.getAllProjects()
    expect(projects.length).toBeGreaterThanOrEqual(5)

    const languages = projects.map((p) => p.language)
    expect(languages).toContain('c')
    expect(languages).toContain('cpp')
    expect(languages).toContain('java')
    expect(languages).toContain('python')
    expect(languages).toContain('javascript')
  })

  it('should save, retrieve, and delete a custom project', async () => {
    const newProject: Project = {
      id: 'test-custom-1',
      name: 'Custom Test Project',
      language: 'python',
      activeFile: 'main.py',
      updatedAt: Date.now(),
      files: [
        {
          path: 'main.py',
          name: 'main.py',
          language: 'python',
          content: 'print("Hello from test")',
        },
      ],
    }

    await storageService.saveProject(newProject)
    const retrieved = await storageService.getProject('test-custom-1')
    expect(retrieved).toBeDefined()
    expect(retrieved?.name).toBe('Custom Test Project')
    expect(retrieved?.files[0].content).toBe('print("Hello from test")')

    await storageService.deleteProject('test-custom-1')
    const afterDelete = await storageService.getProject('test-custom-1')
    expect(afterDelete).toBeUndefined()
  })

  it('should save and load settings', async () => {
    const defaultSettings = await storageService.getSettings()
    expect(defaultSettings.fontSize).toBe(14)

    await storageService.saveSettings({
      ...defaultSettings,
      fontSize: 18,
      theme: 'light',
    })

    const updatedSettings = await storageService.getSettings()
    expect(updatedSettings.fontSize).toBe(18)
    expect(updatedSettings.theme).toBe('light')
  })
})
