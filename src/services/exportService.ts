import JSZip from 'jszip'
import type { Project, ProjectFile, Language } from '../types'

export class ExportService {
  public static downloadFile(filename: string, content: string, mimeType = 'text/plain'): void {
    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = filename
    document.body.appendChild(anchor)
    anchor.click()
    document.body.removeChild(anchor)
    URL.revokeObjectURL(url)
  }

  public static async downloadProjectZip(project: Project): Promise<void> {
    const zip = new JSZip()

    for (const file of project.files) {
      zip.file(file.path, file.content)
    }

    // Add project manifest
    const manifest = {
      name: project.name,
      language: project.language,
      activeFile: project.activeFile,
      exportedAt: new Date().toISOString(),
      generator: 'CodeSpace Serverless Online Compiler',
    }
    zip.file('codespace.json', JSON.stringify(manifest, null, 2))

    const content = await zip.generateAsync({ type: 'blob' })
    const filename = `${project.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}.zip`

    const url = URL.createObjectURL(content)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = filename
    document.body.appendChild(anchor)
    anchor.click()
    document.body.removeChild(anchor)
    URL.revokeObjectURL(url)
  }

  public static async importProjectFromZip(
    file: File,
    targetLanguage?: Language
  ): Promise<Omit<Project, 'id'>> {
    const zip = await JSZip.loadAsync(file)
    const files: ProjectFile[] = []

    let detectedLang: Language = targetLanguage || 'c'
    let projectName = file.name.replace(/\.zip$/i, '')
    let activeFile = ''

    // Check for manifest
    const manifestFile = zip.file('codespace.json')
    if (manifestFile) {
      try {
        const text = await manifestFile.async('text')
        const data = JSON.parse(text)
        if (data.name) projectName = data.name
        if (data.language) detectedLang = data.language
        if (data.activeFile) activeFile = data.activeFile
      } catch {
        // ignore manifest parse error
      }
    }

    const entries = Object.keys(zip.files)
    for (const path of entries) {
      if (path === 'codespace.json' || path.endsWith('/')) continue
      const zipEntry = zip.files[path]
      if (zipEntry.dir) continue

      const content = await zipEntry.async('text')
      const name = path.split('/').pop() || path

      // Detect language from file extension if not yet set
      if (!targetLanguage && !manifestFile) {
        if (path.endsWith('.py')) detectedLang = 'python'
        else if (path.endsWith('.java')) detectedLang = 'java'
        else if (path.endsWith('.cpp') || path.endsWith('.hpp') || path.endsWith('.cc')) detectedLang = 'cpp'
        else if (path.endsWith('.c') || path.endsWith('.h')) detectedLang = 'c'
        else if (path.endsWith('.js') || path.endsWith('.mjs')) detectedLang = 'javascript'
      }

      files.push({
        path,
        name,
        content,
        language: detectedLang,
      })
    }

    if (!activeFile && files.length > 0) {
      activeFile = files[0].path
    }

    return {
      name: projectName,
      language: detectedLang,
      files,
      activeFile,
      updatedAt: Date.now(),
    }
  }

  public static downloadOutputLog(
    projectName: string,
    output: string,
    metrics?: { durationMs: number; exitCode: number }
  ): void {
    const timestamp = new Date().toISOString()
    const header = `================================================
CodeSpace Execution Log
Project: ${projectName}
Timestamp: ${timestamp}
Exit Code: ${metrics ? metrics.exitCode : 'N/A'}
Duration: ${metrics ? `${metrics.durationMs.toFixed(2)}ms` : 'N/A'}
================================================\n\n`

    this.downloadFile(
      `${projectName.toLowerCase().replace(/[^a-z0-9]/g, '_')}_output.txt`,
      header + output
    )
  }
}
